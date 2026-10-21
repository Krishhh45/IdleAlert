from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from app.database import get_db
from app.models.alert import Alert

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

@router.get("")
def get_alerts(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Alert).order_by(Alert.created_at.desc())
    if status:
        query = query.filter(Alert.status == status)
    alerts = query.limit(100).all()
    return [{
        "id": a.id,
        "classroom_name": a.classroom_name,
        "alert_type": a.alert_type,
        "severity": a.severity,
        "condition": a.condition,
        "recommended_action": a.recommended_action,
        "status": a.status,
        "sms_sent": a.sms_sent,
        "sms_status": a.sms_status or ("SMS sent" if a.sms_sent else "SMS service is not configured."),
        "sms_recipient": a.sms_recipient or "",
        "sms_message": a.sms_message or "",
        "created_at": a.created_at.isoformat() if a.created_at else "",
        "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None
    } for a in alerts]

@router.patch("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        return {"error": "Alert not found"}
    alert.status = "Acknowledged"
    db.commit()
    return {"success": True}

@router.patch("/{alert_id}/resolve")
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        return {"error": "Alert not found"}
    alert.status = "Resolved"
    alert.resolved_at = datetime.now()
    db.commit()
    return {"success": True}
