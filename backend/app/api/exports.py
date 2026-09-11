from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from datetime import datetime
from sqlalchemy.orm import Session
from app.api import deps
from app.models.event import ChangeEvent as EventModel

router = APIRouter(prefix="/exports", tags=["Exports"])

@router.get("/{event_id}/geojson")
def export_event_geojson(event_id: str, db: Session = Depends(deps.get_db)):
    evt = db.query(EventModel).filter(EventModel.id == event_id).first()
    if not evt:
        raise HTTPException(status_code=404, detail="Event not found")

    # In database, these are JSON / Strings, so we handle them appropriately
    confidence = evt.confidence if isinstance(evt.confidence, dict) else {}
    
    geojson = {
        "type": "FeatureCollection",
        "properties": {
            "eventId": evt.id,
            "aoiId": evt.aoi_id,
            "aoiName": evt.aoi_name,
            "category": evt.category,
            "affectedAreaHectares": evt.affected_area_hectares,
            "baselineDate": evt.baseline_date,
            "recentDate": evt.recent_date,
            "confidenceScore": confidence.get("overall_detection_confidence", 0),
            "reviewStatus": evt.review_status,
            "exportedAt": datetime.now().isoformat()
        },
        "features": [
            {
                "type": "Feature",
                "geometry": evt.geojson_geometry,
                "properties": {
                    "title": evt.title,
                    "deltaIndex": evt.average_delta_index,
                    "magnitudeScore": confidence.get("magnitude_score", 0),
                    "spatialScore": confidence.get("spatial_consistency_score", 0)
                }
            }
        ]
    }
    return JSONResponse(
        content=geojson,
        headers={"Content-Disposition": f'attachment; filename="{evt.id}_change_polygon.geojson"'}
    )
