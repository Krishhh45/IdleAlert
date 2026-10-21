from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from app.database import Base

class MonitoringLog(Base):
    __tablename__ = "monitoring_logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.now)
    classroom_name = Column(String, default="")
    session_id = Column(Integer, nullable=True)
    people_count = Column(Integer, default=0)
    fan_count = Column(Integer, default=0)
    light_count = Column(Integer, default=0)
    light_estimated = Column(Boolean, default=False)
    fan_status = Column(String, default="Unknown")  # ON/OFF/Unknown
    light_status = Column(String, default="Unknown")  # ON/OFF/Unknown
    energy_status = Column(String, default="Normal")  # Normal/Warning/Critical
    alert_triggered = Column(Boolean, default=False)
    snapshot_url = Column(String, nullable=True)
