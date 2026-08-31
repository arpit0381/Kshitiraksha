from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from app.schemas.models import (
    ChangeEventResponse,
    ReviewUpdateRequest,
    ChangeCategory,
    ReviewStatus,
    ConfidenceBreakdown
)

router = APIRouter(prefix="/events", tags=["Change Events"])

EVENT_STORE: List[ChangeEventResponse] = [
    ChangeEventResponse(
        id="evt-hasdeo-001",
        aoi_id="aoi-hasdeo",
        aoi_name="Hasdeo Arand Forest Range",
        analysis_run_id="run-98231",
        category=ChangeCategory.VEGETATION_LOSS,
        title="Severe Canopy Clearance & Soil Exposure",
        description="High-confidence deforestation cluster detected in central forest corridor. Delta NDVI dropped below -0.45 across 64 continuous hectares indicating mechanical clearing.",
        baseline_date="2025-01-15",
        recent_date="2026-02-10",
        affected_area_hectares=68.4,
        average_delta_index=-0.48,
        confidence=ConfidenceBreakdown(
            magnitude_score=0.94,
            spatial_consistency_score=0.96,
            image_quality_score=0.92,
            persistence_score=0.88,
            overall_detection_confidence=0.925,
            classification_confidence=0.870
        ),
        geojson_geometry={
            "type": "MultiPolygon",
            "coordinates": [
                [[
                    [82.670, 22.815],
                    [82.695, 22.818],
                    [82.698, 22.835],
                    [82.675, 22.832],
                    [82.670, 22.815]
                ]]
            ]
        },
        review_status=ReviewStatus.PENDING,
        review_notes="Awaiting divisional forest officer field cross-check.",
        created_at=datetime.fromisoformat("2026-02-10T14:22:00")
    ),
    ChangeEventResponse(
        id="evt-sundarbans-002",
        aoi_id="aoi-sundarbans",
        aoi_name="Sundarbans Biosphere Delta",
        analysis_run_id="run-98232",
        category=ChangeCategory.WATER_EXPANSION,
        title="Estuarine Breach & Mangrove Submergence",
        description="Sudden high NDWI index surge detected across low-lying mudflat embankment with 84 hectares of mangrove fringing submerged by saline surge.",
        baseline_date="2025-02-01",
        recent_date="2026-02-18",
        affected_area_hectares=84.2,
        average_delta_index=0.52,
        confidence=ConfidenceBreakdown(
            magnitude_score=0.91,
            spatial_consistency_score=0.93,
            image_quality_score=0.89,
            persistence_score=0.85,
            overall_detection_confidence=0.895,
            classification_confidence=0.842
        ),
        geojson_geometry={
            "type": "MultiPolygon",
            "coordinates": [
                [[
                    [88.835, 21.930],
                    [88.865, 21.935],
                    [88.860, 21.960],
                    [88.830, 21.955],
                    [88.835, 21.930]
                ]]
            ]
        },
        review_status=ReviewStatus.VERIFIED,
        review_notes="Confirmed by regional coastal zone management authority sensor buoy.",
        created_at=datetime.fromisoformat("2026-02-18T10:10:00")
    ),
    ChangeEventResponse(
        id="evt-bellandur-003",
        aoi_id="aoi-bellandur",
        aoi_name="Bellandur Lake Wetland",
        analysis_run_id="run-98233",
        category=ChangeCategory.WATER_SHRINKAGE,
        title="Wetland Desiccation & Perimeter Infill",
        description="Continuous reduction of open water sheet accompanied by artificial earth backfilling on the eastern inlet channel.",
        baseline_date="2025-01-20",
        recent_date="2026-02-22",
        affected_area_hectares=18.6,
        average_delta_index=-0.38,
        confidence=ConfidenceBreakdown(
            magnitude_score=0.86,
            spatial_consistency_score=0.90,
            image_quality_score=0.95,
            persistence_score=0.87,
            overall_detection_confidence=0.895,
            classification_confidence=0.850
        ),
        geojson_geometry={
            "type": "MultiPolygon",
            "coordinates": [
                [[
                    [77.668, 12.930],
                    [77.680, 12.932],
                    [77.678, 12.940],
                    [77.666, 12.938],
                    [77.668, 12.930]
                ]]
            ]
        },
        review_status=ReviewStatus.NEEDS_REVIEW,
        review_notes="Suspected seasonal water hyacinth blanket vs true earth reclamation.",
        created_at=datetime.fromisoformat("2026-02-22T16:45:00")
    )
]

@router.get("", response_model=List[ChangeEventResponse])
def list_events(aoi_id: Optional[str] = Query(None)):
    if aoi_id:
        return [e for e in EVENT_STORE if e.aoi_id == aoi_id]
    return EVENT_STORE

@router.get("/{event_id}", response_model=ChangeEventResponse)
def get_event(event_id: str):
    for evt in EVENT_STORE:
        if evt.id == event_id:
            return evt
    raise HTTPException(status_code=404, detail="Event not found")

@router.patch("/{event_id}/review", response_model=ChangeEventResponse)
def update_review(event_id: str, payload: ReviewUpdateRequest):
    for i, evt in enumerate(EVENT_STORE):
        if evt.id == event_id:
            updated = evt.model_copy(update={
                "review_status": payload.status,
                "review_notes": payload.notes or evt.review_notes
            })
            EVENT_STORE[i] = updated
            return updated
    raise HTTPException(status_code=404, detail="Event not found")
