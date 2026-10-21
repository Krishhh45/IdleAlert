from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.monitoring_log import MonitoringLog
from app.models.monitoring_session import MonitoringSession
from app.models.alert import Alert

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("")
def get_analytics(db: Session = Depends(get_db)):
    total_logs = db.query(MonitoringLog).count()
    total_sessions = db.query(MonitoringSession).count()
    total_alerts = db.query(Alert).count()

    # If there is no real data whatsoever, strictly return has_data: False
    if total_logs == 0 and total_sessions == 0 and total_alerts == 0:
        return {
            "has_data": False,
            "total_monitoring_sessions": 0,
            "occupancy_over_time": [],
            "energy_alerts_over_time": [],
            "sessions_summary": [],
            "detection_summary": {"people": 0, "fans": 0, "lights": 0},
            "alert_counts": {"total": 0, "active": 0, "resolved": 0}
        }

    # 1. Detection summary
    people_total = db.query(func.sum(MonitoringLog.people_count)).scalar() or 0
    fan_total = db.query(func.sum(MonitoringLog.fan_count)).scalar() or 0
    light_total = db.query(func.sum(MonitoringLog.light_count)).scalar() or 0

    # 2. Occupancy over time from real logs
    recent_logs = db.query(MonitoringLog).order_by(MonitoringLog.timestamp.desc()).limit(40).all()
    occupancy_data = [{
        "timestamp": log.timestamp.strftime("%H:%M:%S") if log.timestamp else "",
        "people_count": log.people_count,
        "fan_count": log.fan_count,
        "light_count": log.light_count,
        "energy_status": log.energy_status
    } for log in reversed(recent_logs)]

    # 3. Alert counts
    active_alerts = db.query(Alert).filter(Alert.status == "Active").count()
    resolved_alerts = db.query(Alert).filter(Alert.status == "Resolved").count()

    # 4. Energy alerts frequency
    alert_logs = db.query(MonitoringLog).filter(MonitoringLog.alert_triggered == True).order_by(MonitoringLog.timestamp.desc()).limit(30).all()
    energy_alert_data = [{
        "timestamp": log.timestamp.strftime("%H:%M:%S") if log.timestamp else "",
        "energy_status": log.energy_status,
        "people_count": log.people_count
    } for log in reversed(alert_logs)]

    # 5. Real monitoring sessions list
    recent_sessions = db.query(MonitoringSession).order_by(MonitoringSession.start_time.desc()).limit(10).all()
    sessions_data = [{
        "session_id": s.id,
        "classroom_name": s.classroom_name,
        "start_time": s.start_time.strftime("%Y-%m-%d %H:%M") if s.start_time else "",
        "duration_seconds": s.duration_seconds,
        "avg_occupancy": s.avg_occupancy,
        "max_people": s.max_people,
        "energy_wastage_events": s.energy_wastage_events,
        "alerts_generated": s.alerts_generated
    } for s in recent_sessions]

    return {
        "has_data": True,
        "total_monitoring_sessions": total_sessions,
        "total_frames_analyzed": total_logs,
        "occupancy_over_time": occupancy_data,
        "energy_alerts_over_time": energy_alert_data,
        "sessions_summary": sessions_data,
        "detection_summary": {"people": people_total, "fans": fan_total, "lights": light_total},
        "alert_counts": {"total": total_alerts, "active": active_alerts, "resolved": resolved_alerts}
    }
