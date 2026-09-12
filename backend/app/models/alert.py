from sqlalchemy import Column, String, Float, DateTime, Boolean, JSON
from sqlalchemy.sql import func
from app.db.base import Base

class AlertNotification(Base):
    __tablename__ = "alert_notifications"

    id = Column(String, primary_key=True, index=True)
    event_id = Column(String, nullable=False)
    event_title = Column(String, nullable=False)
    aoi_name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    severity = Column(String, default="HIGH")
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    channel = Column(String, default="DASHBOARD")
    recipient = Column(String, default="officer@isro.gov.in")
    status = Column(String, default="DELIVERED")
    affected_area_hectares = Column(Float, default=0.0)
    confidence_pct = Column(Float, default=90.0)

class AlertRule(Base):
    __tablename__ = "alert_rules"

    id = Column(String, primary_key=True, index=True)
    aoi_id = Column(String, nullable=False)
    category = Column(String, default="VEGETATION_LOSS")
    min_confidence = Column(Float, default=0.85)
    min_area_hectares = Column(Float, default=2.0)
    delta_threshold = Column(Float, default=-0.25)
    channels = Column(JSON, default=list)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
