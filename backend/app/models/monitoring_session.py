from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.database import Base

class MonitoringSession(Base):
    __tablename__ = "monitoring_sessions"
    id = Column(Integer, primary_key=True, index=True)
    classroom_name = Column(String, default="Main Classroom")
    start_time = Column(DateTime, default=datetime.now)
    end_time = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)
    avg_occupancy = Column(Float, default=0.0)
    max_people = Column(Integer, default=0)
    fans_detected = Column(Integer, default=0)
    lights_detected = Column(Integer, default=0)
    energy_wastage_events = Column(Integer, default=0)
    alerts_generated = Column(Integer, default=0)
    total_frames = Column(Integer, default=0)
