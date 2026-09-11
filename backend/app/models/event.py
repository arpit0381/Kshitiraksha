from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class ChangeEvent(Base):
    __tablename__ = "change_events"

    id = Column(String, primary_key=True, index=True)
    aoi_id = Column(String, ForeignKey("aois.id"))
    aoi_name = Column(String, nullable=False)
    analysis_run_id = Column(String, nullable=False)
    category = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    
    baseline_date = Column(String, nullable=False)
    recent_date = Column(String, nullable=False)
    affected_area_hectares = Column(Float, nullable=False)
    average_delta_index = Column(Float, nullable=False)
    
    confidence = Column(JSON, nullable=False)
    geojson_geometry = Column(JSON, nullable=False)
    
    review_status = Column(String, default="PENDING")
    review_notes = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    aoi = relationship("AOI")
