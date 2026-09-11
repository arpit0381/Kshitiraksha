import uuid
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime
from sqlalchemy.orm import Session
from app.api import deps
from app.models.aoi import AOI as AOIModel
from app.models.user import User
from app.schemas.models import AOIResponse, AOICreate

router = APIRouter(prefix="/aois", tags=["AOIs"])

@router.get("", response_model=List[AOIResponse])
def list_aois(db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    # In a real system, you might only return AOIs for the current_user or organization
    # For now, we'll return all AOIs for demonstration, but let's filter by owner to be safe.
    aois = db.query(AOIModel).filter(AOIModel.owner_id == current_user.id).all()
    return aois

@router.get("/{aoi_id}", response_model=AOIResponse)
def get_aoi(aoi_id: str, db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    aoi = db.query(AOIModel).filter(AOIModel.id == aoi_id, AOIModel.owner_id == current_user.id).first()
    if not aoi:
        raise HTTPException(status_code=404, detail="AOI not found")
    return aoi

@router.post("", response_model=AOIResponse)
def create_aoi(aoi_in: AOICreate, db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    new_id = f"aoi-custom-{int(datetime.now().timestamp())}-{str(uuid.uuid4())[:8]}"
    
    # Simplified area estimation from bounding box coordinates
    coords = aoi_in.geometry.get("coordinates", [[]])[0]
    if len(coords) >= 4:
        lons = [c[0] for c in coords]
        lats = [c[1] for c in coords]
        d_lat_km = (max(lats) - min(lats)) * 111.0
        d_lon_km = (max(lons) - min(lons)) * 100.0
        area_ha = round(max(5.0, d_lat_km * d_lon_km * 100.0), 1)
    else:
        area_ha = 100.0

    new_aoi = AOIModel(
        id=new_id,
        name=aoi_in.name,
        description=aoi_in.description or "User-defined satellite monitoring boundary",
        geometry=aoi_in.geometry,
        preset_key=aoi_in.preset_key,
        area_hectares=area_ha,
        owner_id=current_user.id
    )
    
    db.add(new_aoi)
    db.commit()
    db.refresh(new_aoi)
    
    return new_aoi
