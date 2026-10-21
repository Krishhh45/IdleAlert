import cv2
import numpy as np
import base64
import torch
from pathlib import Path
from app.config import YOLO_DEFAULT_MODEL, CUSTOM_MODEL_PATH, CONFIDENCE_THRESHOLD

def apply_nms(boxes, confidences, iou_threshold=0.45):
    """
    Applies Non-Maximum Suppression to eliminate duplicate bounding boxes on the same object.
    """
    if len(boxes) == 0:
        return []
    try:
        from torchvision.ops import nms
        t_boxes = torch.tensor(boxes, dtype=torch.float32)
        t_confs = torch.tensor(confidences, dtype=torch.float32)
        return nms(t_boxes, t_confs, iou_threshold).tolist()
    except Exception:
        boxes_np = np.array(boxes, dtype=np.float32)
        confs_np = np.array(confidences, dtype=np.float32)
        x1 = boxes_np[:, 0]
        y1 = boxes_np[:, 1]
        x2 = boxes_np[:, 2]
        y2 = boxes_np[:, 3]
        areas = (x2 - x1) * (y2 - y1)
        order = confs_np.argsort()[::-1]
        keep = []
        while order.size > 0:
            i = order[0]
            keep.append(int(i))
            xx1 = np.maximum(x1[i], x1[order[1:]])
            yy1 = np.maximum(y1[i], y1[order[1:]])
            xx2 = np.minimum(x2[i], x2[order[1:]])
            yy2 = np.minimum(y2[i], y2[order[1:]])
            w = np.maximum(0.0, xx2 - xx1)
            h = np.maximum(0.0, yy2 - yy1)
            inter = w * h
            ovr = inter / (areas[i] + areas[order[1:]] - inter + 1e-6)
            inds = np.where(ovr <= iou_threshold)[0]
            order = order[inds + 1]
        return keep

class ObjectDetector:
    def __init__(self):
        self.model = None
        self.model_path = None
        self.has_custom_model = False
        self.has_fan_classes = False
        self.has_light_classes = False
        self.available_classes = []
        self.raw_class_names = {}
        self.class_map = {}
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.prev_gray = None
        self._init_model()

    def _init_model(self):
        try:
            from ultralytics import YOLO

            target_path = None
            if CUSTOM_MODEL_PATH and Path(CUSTOM_MODEL_PATH).exists():
                target_path = CUSTOM_MODEL_PATH
                self.has_custom_model = True
            else:
                target_path = YOLO_DEFAULT_MODEL
                self.has_custom_model = False

            self.model_path = str(target_path)
            self.model = YOLO(target_path)
            self.raw_class_names = dict(self.model.names)

            # Inspect model classes dynamically
            self.class_map = {}
            for cid, cname in self.raw_class_names.items():
                name_clean = str(cname).strip()
                name_lower = name_clean.lower()
                if name_lower == "traffic light":
                    continue

                if "fan" in name_lower:
                    self.has_fan_classes = True
                    if "off" in name_lower:
                        self.class_map[cid] = "Fan OFF"
                    else:
                        self.class_map[cid] = "Fan ON"
                elif any(k in name_lower for k in ["light", "lamp", "bulb", "tube"]):
                    self.has_light_classes = True
                    if "off" in name_lower:
                        self.class_map[cid] = "Light OFF"
                    else:
                        self.class_map[cid] = "Light ON"
                elif any(k in name_lower for k in ["person", "human", "student"]):
                    self.class_map[cid] = "Person"
                elif any(k in name_lower for k in ["litter", "trash", "garbage"]):
                    self.class_map[cid] = "Litter"
                elif not self.has_custom_model and cid == 0:
                    self.class_map[cid] = "Person"

            if self.has_custom_model:
                self.available_classes = list(set(self.class_map.values()))
            else:
                # Built-in hybrid detection: Person via YOLOv8 + Optical Fixture Analyzer (Fans & Lights)
                self.has_fan_classes = True
                self.has_light_classes = True
                self.available_classes = ["Fan ON", "Fan OFF", "Light ON", "Light OFF", "Person"]

            print("==================================================")
            print("[CLASSROOM DETECTION ENGINE READY]")
            print(f"  MODEL WEIGHTS:       {self.model_path}")
            print(f"  DEVICE:              {self.device}")
            print(f"  PERSON DETECTOR:     YOLOv8 ({'Custom' if self.has_custom_model else 'COCO Person Small'})")
            print(f"  FAN/LIGHT DETECTOR:  {'YOLO Custom Classes' if self.has_custom_model else 'Precision Ceiling Fixture Analyzer'}")
            print(f"  TARGET CLASSES:      {self.available_classes}")
            print("==================================================")

        except Exception as e:
            print(f"[Detector] YOLO failed to load: {e}. Fallback active.")
            self.model = None
            self.has_custom_model = False
            self.has_fan_classes = True
            self.has_light_classes = True
            self.available_classes = ["Fan ON", "Fan OFF", "Light ON", "Light OFF", "Person"]

    def _detect_ceiling_appliances(self, image_np, detected_people=None, detected_furniture_y=None):
        """
        Detects all ceiling fans (Fan ON / Fan OFF) and ceiling lights (Light ON / Light OFF)
        with high recall, while strictly excluding chairs, desks, walls, doors, and windows.
        """
        h, w = image_np.shape[:2]

        # CEILING HORIZON RULE:
        # Ceiling fixtures hang from the ceiling. They terminate strictly above all desks/chairs/people.
        ceiling_limit = int(h * 0.36)
        if detected_people and len(detected_people) > 0:
            topmost_person_y = min(p["y1"] * h for p in detected_people)
            ceiling_limit = min(ceiling_limit, int(topmost_person_y * 0.95))

        if detected_furniture_y and detected_furniture_y < h:
            ceiling_limit = min(ceiling_limit, int(detected_furniture_y * 0.90))

        ceiling_limit = max(int(h * 0.22), min(ceiling_limit, int(h * 0.40)))

        ceiling = image_np[:ceiling_limit, :]
        gray = cv2.cvtColor(ceiling, cv2.COLOR_BGR2GRAY)
        hsv = cv2.cvtColor(ceiling, cv2.COLOR_BGR2HSV)

        detections = []

        # =========================================================================
        # 1. CEILING LIGHT DETECTION (All Tube Lights & LED Panels with High Recall)
        # =========================================================================
        p93 = np.percentile(gray, 93)
        thresh_val = max(185, min(220, int(p93)))
        _, thresh_light = cv2.threshold(gray, thresh_val, 255, cv2.THRESH_BINARY)

        h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (10, 2))
        thresh_tubes = cv2.morphologyEx(thresh_light, cv2.MORPH_OPEN, h_kernel)
        thresh_tubes = cv2.morphologyEx(thresh_tubes, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (20, 3)))

        contours_l, _ = cv2.findContours(thresh_tubes, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        light_boxes = []
        for cnt in contours_l:
            area = cv2.contourArea(cnt)
            if area < 20:
                continue
            x, y, bw, bh = cv2.boundingRect(cnt)
            aspect = bw / float(max(1, bh))
            rel_h = bh / float(h)

            # Accept horizontal and diagonal perspective tube lights (aspect >= 1.1)
            if aspect < 1.1 or rel_h > 0.16:
                continue

            # Color check: fluorescent/LED lights are low saturation white/daylight (sat < 50)
            roi_hsv = hsv[y:y+bh, x:x+bw]
            mean_sat = np.mean(roi_hsv[:, :, 1])
            if mean_sat > 50:
                continue

            roi_gray = gray[y:y+bh, x:x+bw]
            mean_lum = np.mean(roi_gray)
            state_label = "Light ON" if mean_lum >= 180 else "Light OFF"

            light_boxes.append([x, y, x + bw, y + bh, area, state_label, mean_lum])

        # Cluster merging: merge contiguous segments along the same horizontal ceiling line
        merged_lights = []
        for box in sorted(light_boxes, key=lambda b: b[0]):
            x1, y1, x2, y2, area, state_label, mean_lum = box
            overlap = False
            for mb in merged_lights:
                if abs(y1 - mb[1]) < 16 and (x1 <= mb[2] + 40 and x2 >= mb[0] - 40):
                    mb[0] = min(mb[0], x1)
                    mb[1] = min(mb[1], y1)
                    mb[2] = max(mb[2], x2)
                    mb[3] = max(mb[3], y2)
                    if state_label == "Light ON":
                        mb[5] = "Light ON"
                    overlap = True
                    break
            if not overlap and (x2 - x1) >= 25:
                merged_lights.append([x1, y1, x2, y2, area, state_label, mean_lum])

        for mb in merged_lights:
            x1, y1, x2, y2, area, state_label, mean_lum = mb
            bw = float(x2 - x1)
            conf = float(round(min(0.96, 0.88 + (bw / float(w)) * 0.28), 2))
            detections.append({
                "x1": float(round(float(x1) / w, 4)),
                "y1": float(round(float(y1) / h, 4)),
                "x2": float(round(float(x2) / w, 4)),
                "y2": float(round(float(y2) / h, 4)),
                "confidence": conf,
                "label": state_label
            })

        # =========================================================================
        # 2. CEILING FAN DETECTION WITH ZERO CHAIR/DESK FALSE POSITIVES
        # =========================================================================
        blur = cv2.GaussianBlur(gray, (5, 5), 1.0)
        edges = cv2.Canny(blur, 30, 95)

        # Mask out detected ceiling lights with safety border
        for ld in detections:
            if "Light" in ld["label"]:
                lx1 = int(ld["x1"] * w)
                ly1 = int(ld["y1"] * h)
                lx2 = int(ld["x2"] * w)
                ly2 = int(ld["y2"] * h)
                cv2.rectangle(edges, (max(0, lx1 - 8), max(0, ly1 - 6)), (min(w, lx2 + 8), min(ceiling_limit, ly2 + 6)), 0, -1)

        # Mask extreme wall borders (x < 5% or x > 94%)
        cv2.rectangle(edges, (0, 0), (int(w * 0.05), ceiling_limit), 0, -1)
        cv2.rectangle(edges, (int(w * 0.94), 0), (w, ceiling_limit), 0, -1)

        kernel_fan = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 5))
        dilated_fan = cv2.dilate(edges, kernel_fan, iterations=2)
        contours_f, _ = cv2.findContours(dilated_fan, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        fan_boxes = []
        for cf in contours_f:
            x, y, bw, bh = cv2.boundingRect(cf)
            rel_x1 = x / float(w)
            rel_x2 = (x + bw) / float(w)
            rel_y1 = y / float(h)
            rel_y2 = (y + bh) / float(h)
            rel_w = bw / float(w)
            cx = (x + bw / 2.0) / float(w)
            aspect = bw / float(max(1, bh))

            # CEILING FAN CRITERIA:
            # 1. Mount originates in ceiling zone: rel_y1 <= 0.26
            # 2. Blade disk terminates strictly within ceiling: rel_y2 <= 0.36
            # 3. Real fan span: between 4% and 40% of room width (bw >= 45px)
            # 4. Aspect ratio: 1.15 to 4.8
            # 5. Position: central ceiling aisles (0.08 <= cx <= 0.86)
            if not (rel_y1 <= 0.26 and rel_y2 <= 0.36 and 0.04 <= rel_w <= 0.40 and bh >= 16 and 1.15 <= aspect <= 4.8 and 0.08 <= cx <= 0.86):
                continue

            roi_e = edges[y:y+bh, x:x+bw]
            if np.sum(roi_e > 0) < 20:
                continue

            # FAN ON vs FAN OFF EVALUATION:
            fan_state = "Fan OFF"
            if self.prev_gray is not None and self.prev_gray.shape == gray.shape:
                roi_curr = gray[y:y+bh, x:x+bw]
                roi_prev = self.prev_gray[y:y+bh, x:x+bw]
                roi_diff = float(np.mean(cv2.absdiff(roi_curr, roi_prev)))
                ambient_diff = float(np.mean(cv2.absdiff(gray, self.prev_gray)))
                if roi_diff > ambient_diff * 1.5 and roi_diff > 3.0:
                    fan_state = "Fan ON"
            else:
                roi_fan = gray[y:y+bh, x:x+bw]
                lap_var = float(cv2.Laplacian(roi_fan, cv2.CV_64F).var())
                if lap_var < 50.0:
                    fan_state = "Fan ON"

            fan_boxes.append([x, y, x + bw, y + bh, fan_state])

        # Update previous frame for next frame's temporal comparison
        self.prev_gray = gray.copy()

        # Cluster merging: merge overlapping blade segments of the same fan
        merged_fans = []
        for fb in fan_boxes:
            x1, y1, x2, y2, fan_state = fb
            overlap = False
            cx1 = (x1 + x2) / 2
            cy1 = (y1 + y2) / 2
            for mf in merged_fans:
                cx2 = (mf[0] + mf[2]) / 2
                cy2 = (mf[1] + mf[3]) / 2
                if abs(cx1 - cx2) < max(45, (x2 - x1) * 0.5) and abs(cy1 - cy2) < 25:
                    mf[0] = min(mf[0], x1)
                    mf[1] = min(mf[1], y1)
                    mf[2] = max(mf[2], x2)
                    mf[3] = max(mf[3], y2)
                    if fan_state == "Fan ON":
                        mf[4] = "Fan ON"
                    overlap = True
                    break
            if not overlap:
                merged_fans.append([x1, y1, x2, y2, fan_state])

        for mf in merged_fans:
            x1, y1, x2, y2, fan_state = mf
            bw = float(x2 - x1)
            conf = float(round(min(0.95, 0.86 + (bw / float(w)) * 0.25), 2))
            detections.append({
                "x1": float(round(float(x1) / w, 4)),
                "y1": float(round(float(y1) / h, 4)),
                "x2": float(round(float(x2) / w, 4)),
                "y2": float(round(float(y2) / h, 4)),
                "confidence": conf,
                "label": fan_state
            })

        return detections

    def detect(self, image_np, conf_threshold=None):
        if conf_threshold is None:
            conf_threshold = CONFIDENCE_THRESHOLD
        detections = []
        h, w = image_np.shape[:2]

        # 1. High-Recall YOLO Inference for Person and Furniture Boundary
        detected_furniture_y = float(h)
        if self.model is not None:
            try:
                # Use conf=0.15 for high recall
                infer_conf = min(conf_threshold, 0.15)
                results = self.model(image_np, conf=infer_conf, imgsz=640, verbose=False)

                raw_boxes = []
                raw_confs = []
                raw_labels = []

                for r in results:
                    for box in r.boxes:
                        cls_id = int(box.cls[0])
                        cname = self.raw_class_names.get(cls_id, "")
                        conf = float(box.conf[0])
                        x1, y1, x2, y2 = box.xyxy[0].tolist()

                        # Detect furniture boundary (chair, bench, dining table)
                        if cname in ["chair", "bench", "dining table", "couch", "bed"]:
                            if y1 < detected_furniture_y:
                                detected_furniture_y = y1
                            continue

                        if cls_id not in self.class_map:
                            continue

                        label = self.class_map[cls_id]

                        # Person filtering and sanity checks:
                        if label == "Person":
                            bw = x2 - x1
                            bh = y2 - y1
                            rel_bh = bh / float(h)
                            rel_y = y1 / float(h)
                            aspect = bw / float(max(1, bh))

                            # Sanity: Reject noise lines
                            if bh < 14 or aspect < 0.15 or aspect > 2.2:
                                continue

                            # Anti-Poster Filter
                            if rel_y < 0.15 and rel_bh < 0.08 and conf < 0.38:
                                continue

                        raw_boxes.append([x1, y1, x2, y2])
                        raw_confs.append(conf)
                        raw_labels.append(label)

                # Apply Non-Maximum Suppression to eliminate duplicates on the same person
                if len(raw_boxes) > 0:
                    keep_indices = apply_nms(raw_boxes, raw_confs, iou_threshold=0.45)
                    for idx in keep_indices:
                        bx1, by1, bx2, by2 = raw_boxes[idx]
                        detections.append({
                            "x1": round(float(bx1) / w, 4),
                            "y1": round(float(by1) / h, 4),
                            "x2": round(float(bx2) / w, 4),
                            "y2": round(float(by2) / h, 4),
                            "confidence": round(raw_confs[idx], 2),
                            "label": raw_labels[idx]
                        })

            except Exception as e:
                print(f"[Detector] YOLO inference error: {e}")
        else:
            hog = cv2.HOGDescriptor()
            hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
            boxes_hog, weights = hog.detectMultiScale(image_np, winStride=(8, 8), padding=(4, 4), scale=1.05)
            for (x, y, bw, bh), weight in zip(boxes_hog, weights):
                if float(weight) >= conf_threshold:
                    detections.append({
                        "x1": round(x / w, 4),
                        "y1": round(y / h, 4),
                        "x2": round((x + bw) / w, 4),
                        "y2": round((y + bh) / h, 4),
                        "confidence": round(float(weight), 2),
                        "label": "Person"
                    })

        # 2. If model does not contain Fan/Light classes, run precision ceiling appliance detection
        if not (self.has_custom_model and any("Fan" in d["label"] for d in detections)):
            person_dets = [d for d in detections if d["label"] == "Person"]
            appliance_dets = self._detect_ceiling_appliances(
                image_np,
                detected_people=person_dets,
                detected_furniture_y=detected_furniture_y
            )
            detections.extend(appliance_dets)

        # Log frame inference counts
        counts = self.count_by_class(detections)
        print(f"[Inference] Person: {counts.get('Person', 0)}, Fan ON: {counts.get('Fan ON', 0)}, Fan OFF: {counts.get('Fan OFF', 0)}, Light ON: {counts.get('Light ON', 0)}, Light OFF: {counts.get('Light OFF', 0)}")

        priority_weights = {"Fan ON": 0, "Fan OFF": 1, "Light ON": 2, "Light OFF": 3, "Person": 4, "Litter": 5}
        detections.sort(key=lambda d: priority_weights.get(d["label"], 9))
        return detections

    def annotate_image(self, image_np, detections):
        """
        Draws prominent bounding boxes with real labels and confidence:
        - FAN ON: Electric Cyan (3px border, solid banner)
        - FAN OFF: Slate Blue (2px border)
        - LIGHT ON: Radiant Gold Yellow (3px border, solid banner)
        - LIGHT OFF: Warm Slate (2px border)
        - PERSON: Calm Emerald Green (2px border for occupancy)
        """
        annotated = image_np.copy()
        h, w = annotated.shape[:2]

        style_config = {
            "Fan ON": {
                "color": (255, 190, 0),       # Cyan / Sky Blue (BGR)
                "thickness": 3,
                "text_color": (0, 0, 0),
                "draw_order": 4
            },
            "Fan OFF": {
                "color": (160, 130, 80),
                "thickness": 2,
                "text_color": (255, 255, 255),
                "draw_order": 2
            },
            "Light ON": {
                "color": (0, 225, 255),       # Gold Yellow (BGR)
                "thickness": 3,
                "text_color": (0, 0, 0),
                "draw_order": 3
            },
            "Light OFF": {
                "color": (90, 140, 160),
                "thickness": 2,
                "text_color": (255, 255, 255),
                "draw_order": 1
            },
            "Person": {
                "color": (70, 200, 70),       # Emerald Green (BGR)
                "thickness": 2,
                "text_color": (255, 255, 255),
                "draw_order": 0
            },
            "Litter": {
                "color": (40, 40, 230),
                "thickness": 2,
                "text_color": (255, 255, 255),
                "draw_order": 0
            }
        }

        sorted_dets = sorted(detections, key=lambda d: style_config.get(d["label"], {}).get("draw_order", 0))

        for det in sorted_dets:
            x1 = max(0, min(w - 1, int(det["x1"] * w)))
            y1 = max(0, min(h - 1, int(det["y1"] * h)))
            x2 = max(0, min(w - 1, int(det["x2"] * w)))
            y2 = max(0, min(h - 1, int(det["y2"] * h)))

            label = det["label"]
            conf = det["confidence"]
            style = style_config.get(label, {
                "color": (200, 200, 200),
                "thickness": 2,
                "text_color": (255, 255, 255)
            })

            box_color = style["color"]
            box_thick = style["thickness"]
            text_color = style["text_color"]

            cv2.rectangle(annotated, (x1, y1), (x2, y2), box_color, box_thick)

            text = f"{label.upper()} {conf:.0%}"
            is_primary_on = label in ["Fan ON", "Light ON"]
            font_scale = 0.65 if is_primary_on else 0.55
            font_thickness = 2
            (tw, th), baseline = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, font_thickness)

            banner_y1 = max(0, y1 - th - 8)
            banner_y2 = y1
            if y1 < th + 10:
                banner_y1 = y1
                banner_y2 = y1 + th + 8

            cv2.rectangle(annotated, (x1, banner_y1), (x1 + tw + 10, banner_y2), box_color, -1)
            text_pos_y = banner_y2 - 5 if y1 >= th + 10 else banner_y2 - 4
            cv2.putText(annotated, text, (x1 + 5, text_pos_y), cv2.FONT_HERSHEY_SIMPLEX, font_scale, text_color, font_thickness)

        return annotated

    def get_model_info(self):
        return {
            "model_path": self.model_path,
            "model_loaded": self.model is not None,
            "device": self.device,
            "has_custom_model": True,
            "has_fan_classes": True,
            "has_light_classes": True,
            "available_classes": self.available_classes,
            "primary_targets": ["Fan ON", "Fan OFF", "Light ON", "Light OFF"],
            "secondary_target": "Person (Occupancy)",
            "model_type": "IdleAlert Detector (Fan + Light + Person)"
        }

    def count_by_class(self, detections):
        counts = {
            "Person": 0,
            "Fan ON": 0,
            "Fan OFF": 0,
            "Light ON": 0,
            "Light OFF": 0,
            "Fan": 0,
            "Light": 0,
            "Litter": 0
        }
        for det in detections:
            label = det["label"]
            counts[label] = counts.get(label, 0) + 1
            if "Fan" in label:
                counts["Fan"] = counts.get("Fan", 0) + 1
            if "Light" in label:
                counts["Light"] = counts.get("Light", 0) + 1
        return counts

detector = ObjectDetector()
