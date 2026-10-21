from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from app.database import Base

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    classroom_name = Column(String, default="")
    alert_type = Column(String)  # "energy_wastage"
    severity = Column(String)  # "Warning", "Critical"
    condition = Column(String)  # Human-readable condition description
    recommended_action = Column(String)
    status = Column(String, default="Active")  # Active, Acknowledged, Resolved
    sms_sent = Column(Boolean, default=False)
    sms_status = Column(String, default="SMS service is not configured.")  # Clear description
    sms_recipient = Column(String, default="")
    sms_message = Column(String, default="")
    created_at = Column(DateTime, default=datetime.now)
    resolved_at = Column(DateTime, nullable=True)
