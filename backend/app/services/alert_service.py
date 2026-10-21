from datetime import datetime
from typing import Tuple
from sqlalchemy.orm import Session
from app.models.alert import Alert
from app.services.sms_service import sms_service

class AlertService:
    def trigger_alert(self, db: Session, classroom_name: str, severity: str,
                      condition: str, recommended_action: str, sms_text: str,
                      user_phone: str, alert_type: str = "energy_wastage") -> Tuple[Alert, bool]:
        """
        Triggers an energy alert for the given classroom.
        Enforces strict deduplication (Requirement 7 & 9):
        - If an active alert already exists, does NOT create a duplicate alert or spam SMS.
        - Escalates severity from Warning to Critical if fans & lights are both ON.
        - Dispatches real SMS only on new alert event or escalation.
        Returns: (alert, is_new_alert)
        """
        existing = db.query(Alert).filter(
            Alert.classroom_name == classroom_name,
            Alert.alert_type == "energy_wastage",
            Alert.status.in_(["Active", "Acknowledged"])
        ).order_by(Alert.created_at.desc()).first()

        if existing:
            # If condition escalated from Warning to Critical, update existing alert
            if severity == "Critical" and existing.severity != "Critical":
                existing.severity = "Critical"
                existing.condition = condition
                existing.recommended_action = recommended_action
                # Dispatch critical escalation SMS
                if sms_text and user_phone:
                    res = sms_service.send_sms(user_phone, sms_text, alert_type="FAN_LIGHT_CRITICAL")
                    if res.get("sent"):
                        existing.sms_sent = True
                        existing.sms_status = res.get("status")
                    elif not existing.sms_sent:
                        existing.sms_status = res.get("status")
                db.commit()
                return existing, False

            # Existing active alert is still ongoing, no duplicate SMS
            return existing, False

        # Brand new alert event: create record
        alert = Alert(
            classroom_name=classroom_name,
            alert_type="energy_wastage",
            severity=severity,
            condition=condition,
            recommended_action=recommended_action,
            status="Active",
            sms_sent=False,
            sms_status="SMS service is not configured.",
            sms_recipient=user_phone or "",
            sms_message=sms_text or ""
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)

        # Automatically execute real TextBee SMS dispatch on new alert event
        if sms_text and user_phone:
            result = sms_service.send_sms(user_phone, sms_text, alert_type=alert_type)
            alert.sms_sent = result.get("sent", False)
            alert.sms_status = result.get("status", "SMS service is not configured.")
            alert.sms_recipient = result.get("recipient", user_phone)
            db.commit()
        else:
            alert.sms_status = "No registered mobile number."
            db.commit()

        return alert, True

    def resolve_alerts(self, db: Session, classroom_name: str):
        active_alerts = db.query(Alert).filter(
            Alert.classroom_name == classroom_name,
            Alert.alert_type == "energy_wastage",
            Alert.status.in_(["Active", "Acknowledged"])
        ).all()
        for alert in active_alerts:
            alert.status = "Resolved"
            alert.resolved_at = datetime.now()
        if active_alerts:
            db.commit()

alert_service = AlertService()
