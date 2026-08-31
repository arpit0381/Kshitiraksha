from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from enum import Enum

class ChangeCategory(str, Enum):
    VEGETATION_LOSS = "VEGETATION_LOSS"
    WATER_EXPANSION = "WATER_EXPANSION"
    WATER_SHRINKAGE = "WATER_SHRINKAGE"
    BARE_SOIL_EXPANSION = "BARE_SOIL_EXPANSION"
    BUILT_UP_CHANGE = "BUILT_UP_CHANGE"
    FLOODING = "FLOODING"
    UNKNOWN_SIGNIFICANT_CHANGE = "UNKNOWN_SIGNIFICANT_CHANGE"

class ReviewStatus(str, Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    FALSE_POSITIVE = "FALSE_POSITIVE"
    NEEDS_REVIEW = "NEEDS_REVIEW"

class AnalysisStatus(str, Enum):
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class AOIBase(BaseModel):
    name: str
    description: Optional[str] = None
    geometry: Dict[str, Any] = Field(..., description="GeoJSON Geometry (Polygon/MultiPolygon)")
    preset_key: Optional[str] = None

class AOICreate(AOIBase):
    pass

class AOIResponse(AOIBase):
    id: str
    area_hectares: float
    created_at: datetime
    last_monitored_at: Optional[datetime] = None
    active_alerts_count: int = 0

class Observation(BaseModel):
    id: str
    aoi_id: str
    satellite: str = "Sentinel-2 MSI L2A"
    acquisition_date: str
    cloud_cover_percentage: float
    ground_sample_distance_m: float = 10.0
    sun_elevation_deg: float = 58.4
    bands_available: List[str] = ["B2", "B3", "B4", "B8", "B11", "B12", "SCL"]

class AnalysisRequest(BaseModel):
    aoi_id: str
    baseline_date: str
    recent_date: str
    vegetation_loss_threshold: float = -0.20
    min_area_hectares: float = 0.5
    cloud_mask_strictness: float = 0.30
    priority_level: str = "STANDARD"  # STANDARD or PRIORITY (requires x402 payment)

class ConfidenceBreakdown(BaseModel):
    magnitude_score: float = Field(..., ge=0.0, le=1.0)
    spatial_consistency_score: float = Field(..., ge=0.0, le=1.0)
    image_quality_score: float = Field(..., ge=0.0, le=1.0)
    persistence_score: float = Field(..., ge=0.0, le=1.0)
    overall_detection_confidence: float = Field(..., ge=0.0, le=1.0)
    classification_confidence: float = Field(..., ge=0.0, le=1.0)

class ChangeEventResponse(BaseModel):
    id: str
    aoi_id: str
    aoi_name: str
    analysis_run_id: str
    category: ChangeCategory
    title: str
    description: str
    baseline_date: str
    recent_date: str
    affected_area_hectares: float
    average_delta_index: float
    confidence: ConfidenceBreakdown
    geojson_geometry: Dict[str, Any]
    review_status: ReviewStatus = ReviewStatus.PENDING
    review_notes: Optional[str] = None
    created_at: datetime

class ReviewUpdateRequest(BaseModel):
    status: ReviewStatus
    notes: Optional[str] = None

class X402ChallengeResponse(BaseModel):
    status_code: int = 402
    resource: str
    amount_algo: float
    destination_address: str
    network: str = "algorand-testnet"
    challenge_token: str
    message: str = "Payment Required: Priority Satellite Analysis requires 0.2 ALGO micro-settlement via x402."

class X402PaymentVerification(BaseModel):
    resource: str
    challenge_token: str
    transaction_id: str
    sender_wallet: str
