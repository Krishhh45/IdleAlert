from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    confidence: float
    label: str

class DetectionResult(BaseModel):
    detections: List[BoundingBox]
    people_count: int
    fan_count: int
    light_count: int
    litter_count: int = 0
    occupancy_status: str  # "Occupied" or "Unoccupied"
    light_estimated: bool = False
    light_brightness_on: bool = False
    energy_status: str     # "Normal", "Warning", "Critical"
    energy_message: str
    recommended_action: str
    alert_created: bool = False
    annotated_image_base64: Optional[str] = None
    model_info: dict = {}

class VideoTimelineEvent(BaseModel):
    timestamp: str       # e.g. "00:12"
    seconds: float
    event_type: str      # "person_detected", "became_empty", "wastage_detected", "appliances_active"
    description: str     # e.g. "Person detected (Occupancy: 1)"

class VideoAnalysisResult(BaseModel):
    annotated_video_url: str
    total_frames_processed: int
    total_frames: int
    duration_seconds: float
    max_people_detected: int
    max_fans_detected: int
    max_lights_detected: int
    energy_wastage_frames: int
    energy_status_summary: str
    smart_recommendation: str
    events_timeline: List[VideoTimelineEvent]
    model_info: dict = {}

class SessionStartRequest(BaseModel):
    classroom_name: str

class SessionSummaryOut(BaseModel):
    session_id: int
    classroom_name: str
    duration_seconds: int
    duration_formatted: str
    avg_occupancy: float
    max_people: int
    fans_detected: int
    lights_detected: int
    energy_wastage_events: int
    alerts_generated: int
    total_frames: int
