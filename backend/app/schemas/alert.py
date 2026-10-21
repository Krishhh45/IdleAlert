from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AlertOut(BaseModel):
    id: int
    classroom_name: str
    alert_type: str
    severity: str
    condition: str
    recommended_action: str
    status: str
    sms_sent: bool
    sms_status: str
    sms_recipient: str
    sms_message: Optional[str] = ""
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True
