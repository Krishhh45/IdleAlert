import cv2
import numpy as np
import base64
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.ai.detector import detector
from app.ai.energy_analyzer import energy_analyzer
from app.services.alert_service import alert_service
from app.api.auth import get_registered_user_phone
from app.api.classrooms import get_current_classroom_name
from app.models.monitoring_log import MonitoringLog
from app.models.monitoring_session import MonitoringSession

router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])

class SessionStartRequest(BaseModel):
    classroom_name: Optional[str] = None

class SessionStopRequest(BaseModel):
    session_id: int

class FrameRequest(BaseModel):
    frame: str  # base64 encoded image
    session_id: Optional[int] = None
    classroom_name: Optional[str] = None
    user_phone: Optional[str] = None

@router.post("/session/start")
def start_session(req: SessionStartRequest, db: Session = Depends(get_db)):
    room_name = (req.classroom_name or "").strip() or get_current_classroom_name() or "Main Classroom"
    session = MonitoringSession(
        classroom_name=room_name,
        start_time=datetime.now()
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return {
        "session_id": session.id,
        "classroom_name": session.classroom_name,
        "start_time": session.start_time.isoformat()
    }

@router.post("/session/stop")
def stop_session(req: SessionStopRequest, db: Session = Depends(get_db)):
    session = db.query(MonitoringSession).filter(MonitoringSession.id == req.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Monitoring session not found.")

    session.end_time = datetime.now()
    duration = int((session.end_time - session.start_time).total_seconds())
    session.duration_seconds = max(1, duration)

    # Calculate real stats across all logs recorded in this session
    logs = db.query(MonitoringLog).filter(MonitoringLog.session_id == session.id).all()

    if logs:
        session.total_frames = len(logs)
        session.max_people = max((l.people_count for l in logs), default=0)
        session.fans_detected = max((l.fan_count for l in logs), default=0)
        session.lights_detected = max((l.light_count for l in logs), default=0)
        session.avg_occupancy = round(sum(l.people_count for l in logs) / len(logs), 1)
        session.energy_wastage_events = sum(1 for l in logs if l.energy_status in ["Warning", "Critical"])
        session.alerts_generated = sum(1 for l in logs if l.alert_triggered)
    else:
        session.total_frames = 0
        session.max_people = 0
        session.avg_occupancy = 0.0

    db.commit()

    # Format duration for human-readable display
    mins, secs = divmod(session.duration_seconds, 60)
    hrs, mins = divmod(mins, 60)
    duration_str = f"{hrs:02d}:{mins:02d}:{secs:02d}" if hrs > 0 else f"{mins:02d}:{secs:02d}"

    return {
        "session_id": session.id,
        "classroom_name": session.classroom_name,
        "duration_seconds": session.duration_seconds,
        "duration_formatted": duration_str,
        "avg_occupancy": session.avg_occupancy,
        "max_people": session.max_people,
        "fans_detected": session.fans_detected,
        "lights_detected": session.lights_detected,
        "energy_wastage_events": session.energy_wastage_events,
        "alerts_generated": session.alerts_generated,
        "total_frames": session.total_frames
    }

@router.post("/frame")
def process_frame(req: FrameRequest, db: Session = Depends(get_db)):
    # Decode base64 frame
    try:
        raw_b64 = req.frame.split(",")[-1] if "," in req.frame else req.frame
        img_data = base64.b64decode(raw_b64)
        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            return {"error": "Failed to decode camera frame"}
    except Exception as e:
        return {"error": f"Frame decode error: {str(e)}"}

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

    # 2. Supplementary light check if custom model is not loaded
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

    # 3. Combined energy evaluation (Occupancy + Equipment ON/OFF)
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
    classroom_name = (req.classroom_name or "").strip() or get_current_classroom_name() or "Main Classroom"
    phone_to_use = (req.user_phone or "").strip() or get_registered_user_phone(db)

    if energy["status"] in ["Warning", "Critical"]:
        alert, is_new = alert_service.trigger_alert(
            db=db,
            classroom_name=classroom_name,
            severity=energy["status"],
            condition=energy["message"],
            recommended_action=energy["recommended_action"],
            sms_text=energy["sms_text"],
            user_phone=phone_to_use,
            alert_type=energy.get("alert_type", "energy_wastage")
        )
        alert_created = is_new
    else:
        alert_service.resolve_alerts(db, classroom_name)

    # 5. Annotate frame with real bounding boxes
    annotated = detector.annotate_image(frame, detections)
    _, buffer = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 80])
    annotated_b64 = base64.b64encode(buffer).decode("utf-8")

    # 6. Save real monitoring log
    fan_status_str = "ON" if fan_on_count > 0 else ("OFF" if (fan_off_count > 0 or detector.has_custom_model) else "Unknown")
    light_status_str = "ON" if (light_on_count > 0 or light_brightness_on) else "OFF"

    log = MonitoringLog(
        classroom_name=classroom_name,
        session_id=req.session_id,
        people_count=people_count,
        fan_count=total_fans,
        light_count=total_lights,
        light_estimated=light_estimated,
        fan_status=fan_status_str,
        light_status=light_status_str,
        energy_status=energy["status"],
        alert_triggered=alert_created
    )
    db.add(log)
    db.commit()

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
        "annotated_frame": annotated_b64,
        "model_info": detector.get_model_info()
    }
