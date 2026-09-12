import uuid
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Any, Dict
from datetime import datetime
from sqlalchemy.orm import Session
from app.api import deps
from app.models.alert import AlertNotification, AlertRule
from app.schemas.models import AlertNotificationResponse, AlertRuleResponse, AlertRuleCreate

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertNotificationResponse])
def list_notifications(db: Session = Depends(deps.get_db)):
    return db.query(AlertNotification).order_by(AlertNotification.sent_at.desc()).all()

@router.post("/dispatch", response_model=AlertNotificationResponse)
def dispatch_alert(payload: Dict[str, Any], db: Session = Depends(deps.get_db)):
    new_id = f"alt-{int(datetime.now().timestamp())}-{str(uuid.uuid4())[:5]}"
    alert = AlertNotification(
        id=new_id,
        event_id=payload.get("event_id", "evt-manual"),
        event_title=payload.get("event_title", "Emergency Sentinel-2 Change Alert"),
        aoi_name=payload.get("aoi_name", "Monitored Zone"),
        category=payload.get("category", "VEGETATION_LOSS"),
        severity=payload.get("severity", "CRITICAL"),
        channel=payload.get("channel", "EMAIL"),
        recipient=payload.get("recipient", "officer@isro.gov.in"),
        status="DELIVERED",
        affected_area_hectares=float(payload.get("affected_area_hectares", 15.0)),
        confidence_pct=float(payload.get("confidence_pct", 92.0))
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert

@router.get("/rules", response_model=List[AlertRuleResponse])
def list_rules(db: Session = Depends(deps.get_db)):
    return db.query(AlertRule).order_by(AlertRule.created_at.desc()).all()

@router.post("/rules", response_model=AlertRuleResponse)
def save_rule(payload: AlertRuleCreate, db: Session = Depends(deps.get_db)):
    rule_id = payload.id or f"rule-{int(datetime.now().timestamp())}-{str(uuid.uuid4())[:4]}"
    existing = db.query(AlertRule).filter(AlertRule.id == rule_id).first()
    if existing:
        existing.aoi_id = payload.aoi_id
        existing.category = payload.category
        existing.min_confidence = payload.min_confidence
        existing.min_area_hectares = payload.min_area_hectares
        existing.delta_threshold = payload.delta_threshold
        existing.channels = payload.channels
        existing.enabled = payload.enabled
        db.commit()
        db.refresh(existing)
        return existing
    
    new_rule = AlertRule(
        id=rule_id,
        aoi_id=payload.aoi_id,
        category=payload.category,
        min_confidence=payload.min_confidence,
        min_area_hectares=payload.min_area_hectares,
        delta_threshold=payload.delta_threshold,
        channels=payload.channels,
        enabled=payload.enabled
    )
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)
    return new_rule
