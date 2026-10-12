from typing import List
from datetime import datetime
from sqlalchemy import String, Float, DateTime, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.db.base import Base

class AlertNotification(Base):
    __tablename__ = "alert_notifications"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    event_id: Mapped[str] = mapped_column(String, nullable=False)
    event_title: Mapped[str] = mapped_column(String, nullable=False)
    aoi_name: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    severity: Mapped[str] = mapped_column(String, default="HIGH")
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    channel: Mapped[str] = mapped_column(String, default="DASHBOARD")
    recipient: Mapped[str] = mapped_column(String, default="officer@isro.gov.in")
    status: Mapped[str] = mapped_column(String, default="DELIVERED")
    affected_area_hectares: Mapped[float] = mapped_column(Float, default=0.0)
    confidence_pct: Mapped[float] = mapped_column(Float, default=90.0)

class AlertRule(Base):
    __tablename__ = "alert_rules"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    aoi_id: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(String, default="VEGETATION_LOSS")
    min_confidence: Mapped[float] = mapped_column(Float, default=0.85)
    min_area_hectares: Mapped[float] = mapped_column(Float, default=2.0)
    delta_threshold: Mapped[float] = mapped_column(Float, default=-0.25)
    channels: Mapped[List[str]] = mapped_column(JSON, default=list)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

