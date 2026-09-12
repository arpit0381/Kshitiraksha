from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class AOI(Base):
    __tablename__ = "aois"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    geometry = Column(JSON, nullable=False)
    preset_key = Column(String)
    area_hectares = Column(Float, nullable=False)
    active_alerts_count = Column(Integer, default=0)
    project_id = Column(String, nullable=True)
    center = Column(JSON, nullable=True)
    zoom = Column(Integer, default=13)
    category = Column(String, default="VEGETATION_LOSS")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_monitored_at = Column(DateTime(timezone=True), nullable=True)
    
    owner_id = Column(String, ForeignKey("users.id"), nullable=True)
    owner = relationship("User")
