from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime
from app.api.events import EVENT_STORE

router = APIRouter(prefix="/exports", tags=["Exports"])

@router.get("/{event_id}/geojson")
def export_event_geojson(event_id: str):
    evt = next((e for e in EVENT_STORE if e.id == event_id), None)
    if not evt:
        raise HTTPException(status_code=404, detail="Event not found")

    geojson = {
        "type": "FeatureCollection",
        "properties": {
            "eventId": evt.id,
            "aoiId": evt.aoi_id,
            "aoiName": evt.aoi_name,
            "category": evt.category.value,
            "affectedAreaHectares": evt.affected_area_hectares,
            "baselineDate": evt.baseline_date,
            "recentDate": evt.recent_date,
            "confidenceScore": evt.confidence.overall_detection_confidence,
            "reviewStatus": evt.review_status.value,
            "exportedAt": datetime.now().isoformat()
        },
        "features": [
            {
                "type": "Feature",
                "geometry": evt.geojson_geometry,
                "properties": {
                    "title": evt.title,
                    "deltaIndex": evt.average_delta_index,
                    "magnitudeScore": evt.confidence.magnitude_score,
                    "spatialScore": evt.confidence.spatial_consistency_score
                }
            }
        ]
    }
    return JSONResponse(
        content=geojson,
        headers={"Content-Disposition": f'attachment; filename="{evt.id}_change_polygon.geojson"'}
    )
