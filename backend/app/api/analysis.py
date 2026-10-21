import cv2
import numpy as np
import base64
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import IMAGE_UPLOAD_DIR, VIDEO_UPLOAD_DIR, ANNOTATED_VIDEO_DIR
from app.ai.detector import detector
from app.ai.energy_analyzer import energy_analyzer
from app.services.alert_service import alert_service
from app.services.video_service import transcode_to_h264
from app.api.classrooms import get_current_classroom_name
from app.api.auth import get_registered_user_phone
from app.models.monitoring_log import MonitoringLog

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

def format_timestamp(seconds: float) -> str:
    mins = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{mins:02d}:{secs:02d}"

def smooth_video_detections(prev_detections, new_detections, alpha=0.75):
    """
    Stabilizes bounding boxes across consecutive frames in unstable/handheld camera videos.
    Matches boxes of the same class by spatial overlap and applies Exponential Moving Average (EMA).
    """
    if not prev_detections:
        return new_detections

    smoothed = []
    used_prev = set()

    for new_d in new_detections:
        best_prev = None
        best_iou = 0.0
        best_idx = -1

        for i, prev_d in enumerate(prev_detections):
            if i in used_prev or prev_d["label"] != new_d["label"]:
                continue

            # Calculate intersection between normalized coordinates
            ix1 = max(new_d["x1"], prev_d["x1"])
            iy1 = max(new_d["y1"], prev_d["y1"])
            ix2 = min(new_d["x2"], prev_d["x2"])
            iy2 = min(new_d["y2"], prev_d["y2"])

            if ix2 > ix1 and iy2 > iy1:
                intersection = (ix2 - ix1) * (iy2 - iy1)
                area1 = (new_d["x2"] - new_d["x1"]) * (new_d["y2"] - new_d["y1"])
                area2 = (prev_d["x2"] - prev_d["x1"]) * (prev_d["y2"] - prev_d["y1"])
                union = area1 + area2 - intersection
                iou = intersection / max(1e-6, union)
                if iou > best_iou:
                    best_iou = iou
                    best_prev = prev_d
                    best_idx = i

        if best_prev and best_iou > 0.15:
            used_prev.add(best_idx)
            smoothed.append({
                "x1": round(alpha * new_d["x1"] + (1 - alpha) * best_prev["x1"], 4),
                "y1": round(alpha * new_d["y1"] + (1 - alpha) * best_prev["y1"], 4),
                "x2": round(alpha * new_d["x2"] + (1 - alpha) * best_prev["x2"], 4),
                "y2": round(alpha * new_d["y2"] + (1 - alpha) * best_prev["y2"], 4),
                "confidence": new_d["confidence"],
                "label": new_d["label"]
            })
        else:
            smoothed.append(new_d)

    return smoothed

@router.post("/image")
async def analyze_image(
    file: UploadFile = File(...),
    classroom_name: Optional[str] = Form(None),
    user_phone: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    if not contents or len(contents) < 50:
        raise HTTPException(status_code=400, detail="Uploaded image is empty or invalid.")

    nparr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if frame is None:
        raise HTTPException(status_code=400, detail="Failed to decode image file.")

    # Save original image
    filename = f"{uuid.uuid4().hex}_{file.filename}"
    save_path = IMAGE_UPLOAD_DIR / filename
    with open(save_path, "wb") as f:
        f.write(contents)

    # 1. Run actual YOLO inference
    detections = detector.detect(frame)
    counts = detector.count_by_class(detections)
    people_count = counts.get("Person", 0)
    fan_on_count = counts.get("Fan ON", 0)
    fan_off_count = counts.get("Fan OFF", 0)
    light_on_count = counts.get("Light ON", 0)
    light_off_count = counts.get("Light OFF", 0)
    total_fans = counts.get("Fan", 0)
    total_lights = counts.get("Light", 0)
    litter_count = counts.get("Litter", 0)

    # 2. Supplementary light check if no ceiling lights detected
    light_estimated = False
    light_brightness_on = False
    if light_on_count == 0 and light_off_count == 0:
        light_est = energy_analyzer.estimate_light_from_frame(frame)
        light_brightness_on = light_est["is_on"]
        light_estimated = True
        if light_brightness_on:
            light_on_count = 1
        else:
            light_off_count = 1

    # 3. Combined energy evaluation (Human occupancy + Equipment ON/OFF status)
    energy = energy_analyzer.evaluate(
        people_count=people_count,
        fan_on_count=fan_on_count,
        light_on_count=light_on_count,
        fan_off_count=fan_off_count,
        light_off_count=light_off_count,
        light_brightness_on=light_brightness_on
    )

    # 4. Handle alerts & automatic SMS (Trigger ONLY when unoccupied + equipment ON)
    alert_created = False
    active_classroom = (classroom_name or "").strip() or get_current_classroom_name() or "Main Classroom"
    active_phone = (user_phone or "").strip() or get_registered_user_phone(db)

    if energy["status"] in ["Warning", "Critical"]:
        _, is_new = alert_service.trigger_alert(
            db=db,
            classroom_name=active_classroom,
            severity=energy["status"],
            condition=energy["message"],
            recommended_action=energy["recommended_action"],
            sms_text=energy["sms_text"],
            user_phone=active_phone,
            alert_type=energy.get("alert_type", "energy_wastage")
        )
        alert_created = is_new

    # 5. Save real monitoring log
    fan_status_str = "ON" if fan_on_count > 0 else ("OFF" if (fan_off_count > 0 or detector.has_custom_model) else "Unknown")
    light_status_str = "ON" if (light_on_count > 0 or light_brightness_on) else "OFF"

    log = MonitoringLog(
        classroom_name=active_classroom,
        people_count=people_count,
        fan_count=total_fans,
        light_count=total_lights,
        light_estimated=light_estimated,
        fan_status=fan_status_str,
        light_status=light_status_str,
        energy_status=energy["status"],
        alert_triggered=alert_created,
        snapshot_url=f"/uploads/images/{filename}"
    )
    db.add(log)
    db.commit()

    # 6. Annotate image with real YOLO bounding boxes (Fan ON/OFF, Light ON/OFF, Person)
    annotated = detector.annotate_image(frame, detections)
    _, buffer = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 90])
    annotated_b64 = base64.b64encode(buffer).decode("utf-8")

    return {
        "detections": detections,
        "people_count": people_count,
        "fan_count": total_fans,
        "light_count": total_lights,
        "fan_on_count": fan_on_count,
        "fan_off_count": fan_off_count,
        "light_on_count": light_on_count,
        "light_off_count": light_off_count,
        "litter_count": litter_count,
        "occupancy_status": "Occupied" if people_count > 0 else "Unoccupied",
        "light_estimated": light_estimated,
        "light_brightness_on": light_brightness_on,
        "energy_status": energy["status"],
        "energy_message": energy["message"],
        "recommended_action": energy["recommended_action"],
        "alert_created": alert_created,
        "annotated_image_base64": annotated_b64,
        "model_info": detector.get_model_info()
    }

@router.post("/video")
async def analyze_video(
    file: UploadFile = File(...),
    classroom_name: Optional[str] = Form(None),
    user_phone: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    if not contents or len(contents) < 1000:
        raise HTTPException(status_code=400, detail="Uploaded video file is empty or corrupted.")

    video_uid = uuid.uuid4().hex
    video_filename = f"{video_uid}_{file.filename}"
    video_path = VIDEO_UPLOAD_DIR / video_filename
    with open(video_path, "wb") as f:
        f.write(contents)

    # Validate video input
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise HTTPException(status_code=400, detail="Cannot read video. Please upload a standard MP4, AVI, or MOV file.")

    fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    if width <= 0 or height <= 0 or total_frames <= 0:
        cap.release()
        raise HTTPException(status_code=400, detail="Invalid video stream: zero dimensions or frames detected.")

    duration_seconds = round(total_frames / fps, 1) if fps > 0 else 0.0

    # Output file paths
    final_filename = f"annotated_{video_uid}.mp4"
    temp_raw_filename = f"raw_temp_{video_uid}.mp4"

    out_final_path = ANNOTATED_VIDEO_DIR / final_filename
    temp_raw_path = ANNOTATED_VIDEO_DIR / temp_raw_filename

    # Initialize raw OpenCV video writer
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(str(temp_raw_path), fourcc, fps, (width, height))
    if not out.isOpened():
        cap.release()
        raise HTTPException(status_code=500, detail="Failed to initialize video writer.")

    # Frame-by-frame inference loop (~4 frames per sec analysis, every frame written)
    frame_interval = max(1, int(fps / 4))
    frame_idx = 0
    frames_processed = 0
    total_people = 0
    total_fans = 0
    total_lights = 0
    total_fans_on = 0
    total_lights_on = 0
    wastage_frames = 0
    last_detections = []

    # Real Video Event Timeline tracking
    events_timeline = []
    prev_state = {
        "occupied": None,
        "wastage": False
    }

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        current_time_sec = round(frame_idx / fps, 1)
        timestamp_str = format_timestamp(current_time_sec)

        if frame_idx % frame_interval == 0:
            # 1. Run actual YOLO inference & stabilize boxes for unstable camera video
            raw_detections = detector.detect(frame)
            detections = smooth_video_detections(last_detections, raw_detections, alpha=0.70)
            last_detections = detections
            counts = detector.count_by_class(detections)
            people = counts.get("Person", 0)
            fans_on = counts.get("Fan ON", 0)
            fans_off = counts.get("Fan OFF", 0)
            lights_on = counts.get("Light ON", 0)
            lights_off = counts.get("Light OFF", 0)
            fans_total = counts.get("Fan", 0)
            lights_total = counts.get("Light", 0)

            total_people = max(total_people, people)
            total_fans = max(total_fans, fans_total)
            total_lights = max(total_lights, lights_total)
            total_fans_on = max(total_fans_on, fans_on)
            total_lights_on = max(total_lights_on, lights_on)

            light_brightness_on = False
            if lights_on == 0 and lights_off == 0:
                light_est = energy_analyzer.estimate_light_from_frame(frame)
                light_brightness_on = light_est["is_on"]
                if light_brightness_on:
                    lights_on = 1
                else:
                    lights_off = 1

            # 2. Combined energy evaluation on this frame
            energy = energy_analyzer.evaluate(
                people_count=people,
                fan_on_count=fans_on,
                light_on_count=lights_on,
                fan_off_count=fans_off,
                light_off_count=lights_off,
                light_brightness_on=light_brightness_on
            )

            is_occupied = people > 0

            # State Transition: Became occupied
            if is_occupied and prev_state["occupied"] is False:
                equip_note = "Fan/Light usage normal" if (fans_on > 0 or lights_on > 0) else "All equipment OFF"
                events_timeline.append({
                    "timestamp": timestamp_str,
                    "seconds": current_time_sec,
                    "event_type": "person_detected",
                    "description": f"Person detected ({people} present) - Status: NORMAL ({equip_note})"
                })
            # State Transition: Became empty
            elif not is_occupied and prev_state["occupied"] is True:
                events_timeline.append({
                    "timestamp": timestamp_str,
                    "seconds": current_time_sec,
                    "event_type": "became_empty",
                    "description": "Classroom became empty (0 occupants)"
                })
            # Initial frame state
            elif prev_state["occupied"] is None:
                if is_occupied:
                    events_timeline.append({
                        "timestamp": timestamp_str,
                        "seconds": current_time_sec,
                        "event_type": "person_detected",
                        "description": f"Classroom occupied ({people} person{'s' if people > 1 else ''} present) - Status: NORMAL"
                    })
                else:
                    events_timeline.append({
                        "timestamp": timestamp_str,
                        "seconds": current_time_sec,
                        "event_type": "became_empty",
                        "description": "Classroom is unoccupied (0 occupants)"
                    })

            prev_state["occupied"] = is_occupied

            # State Transition: Energy wastage triggered or resolved
            is_wastage = energy["status"] in ["Warning", "Critical"]
            if is_wastage:
                wastage_frames += 1
                if not prev_state["wastage"]:
                    events_timeline.append({
                        "timestamp": timestamp_str,
                        "seconds": current_time_sec,
                        "event_type": "wastage_detected",
                        "description": energy["message"]
                    })
            else:
                if prev_state["wastage"]:
                    events_timeline.append({
                        "timestamp": timestamp_str,
                        "seconds": current_time_sec,
                        "event_type": "wastage_resolved",
                        "description": "Energy status returned to NORMAL"
                    })

            prev_state["wastage"] = is_wastage
            frames_processed += 1

        # Annotate every single video frame with real bounding boxes and confidence
        annotated = detector.annotate_image(frame, last_detections)
        out.write(annotated)
        frame_idx += 1

    cap.release()
    out.release()

    # Transcode output to 100% browser-compatible H.264 MP4 with +faststart
    success = transcode_to_h264(temp_raw_path, out_final_path)
    if not success:
        if temp_raw_path.exists() and not out_final_path.exists():
            temp_raw_path.rename(out_final_path)

    if not out_final_path.exists() or out_final_path.stat().st_size == 0:
        raise HTTPException(status_code=500, detail="Failed to generate annotated output video.")

    # Save real monitoring log
    active_classroom = (classroom_name or "").strip() or get_current_classroom_name() or "Main Classroom"
    active_phone = (user_phone or "").strip() or get_registered_user_phone(db)

    overall_energy = energy_analyzer.evaluate(
        people_count=0 if wastage_frames > 0 else total_people,
        fan_on_count=total_fans_on,
        light_on_count=total_lights_on,
        light_brightness_on=False
    )

    log = MonitoringLog(
        classroom_name=active_classroom,
        people_count=total_people,
        fan_count=total_fans,
        light_count=total_lights,
        light_estimated=not detector.has_custom_model,
        fan_status="Detected" if total_fans > 0 else "Not detected",
        light_status="Detected" if total_lights > 0 else "Estimated",
        energy_status="Warning" if wastage_frames > 0 else "Normal",
        alert_triggered=wastage_frames > 0
    )
    db.add(log)
    db.commit()

    # Trigger automatic alert if energy wastage was detected in video
    if wastage_frames > 0:
        video_alert_type = "FAN_LIGHT_CRITICAL" if (total_fans_on > 0 and total_lights_on > 0) else ("FAN_ON" if total_fans_on > 0 else "LIGHT_ON")
        alert_service.trigger_alert(
            db=db,
            classroom_name=active_classroom,
            severity="Critical" if (total_fans_on > 0 and total_lights_on > 0) else "Warning",
            condition=f"Energy wastage detected across {wastage_frames} frames in uploaded video.",
            recommended_action=overall_energy["recommended_action"],
            sms_text=overall_energy["sms_text"],
            user_phone=active_phone,
            alert_type=video_alert_type
        )

    return {
        "annotated_video_url": f"/uploads/annotated/{final_filename}",
        "original_video_url": f"/uploads/videos/{video_filename}",
        "total_frames_processed": frames_processed,
        "total_frames": total_frames,
        "duration_seconds": duration_seconds,
        "max_people_detected": total_people,
        "max_fans_detected": total_fans,
        "max_lights_detected": total_lights,
        "energy_wastage_frames": wastage_frames,
        "energy_status_summary": "Energy wastage detected" if wastage_frames > 0 else "Normal",
        "smart_recommendation": overall_energy["recommended_action"] if wastage_frames > 0 else "Energy usage normal.",
        "events_timeline": events_timeline,
        "model_info": detector.get_model_info()
    }
