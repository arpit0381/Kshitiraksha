from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
from app.schemas.models import AOIResponse, AOICreate

router = APIRouter(prefix="/aois", tags=["AOIs"])

# Seed data based on PRD / ISRO benchmarks
AOI_STORE: List[AOIResponse] = [
    AOIResponse(
        id="aoi-hasdeo",
        name="Hasdeo Arand Forest Range",
        description="Continuous monitoring of dense Sal forest canopy against open-cast coal mining encroachment in north Chhattisgarh.",
        preset_key="hasdeo",
        geometry={
            "type": "Polygon",
            "coordinates": [[
                [82.650, 22.800],
                [82.720, 22.800],
                [82.720, 22.850],
                [82.650, 22.850],
                [82.650, 22.800]
            ]]
        },
        area_hectares=1420.5,
        created_at=datetime.fromisoformat("2025-01-10T08:30:00"),
        last_monitored_at=datetime.fromisoformat("2026-02-28T14:15:00"),
        active_alerts_count=2
    ),
    AOIResponse(
        id="aoi-sundarbans",
        name="Sundarbans Biosphere Delta",
        description="Monitoring tidal mangrove loss, delta erosion, and salinity changes along the Hugli-Matla estuary.",
        preset_key="sundarbans",
        geometry={
            "type": "Polygon",
            "coordinates": [[
                [88.800, 21.900],
                [88.900, 21.900],
                [88.900, 21.990],
                [88.800, 21.990],
                [88.800, 21.900]
            ]]
        },
        area_hectares=3250.0,
        created_at=datetime.fromisoformat("2025-01-12T11:00:00"),
        last_monitored_at=datetime.fromisoformat("2026-02-27T09:45:00"),
        active_alerts_count=1
    ),
    AOIResponse(
        id="aoi-bellandur",
        name="Bellandur Lake Wetland",
        description="Urban water body surface shrinkage, marsh vegetation degradation, and encroachment detection.",
        preset_key="bellandur",
        geometry={
            "type": "Polygon",
            "coordinates": [[
                [77.655, 12.925],
                [77.685, 12.925],
                [77.685, 12.945],
                [77.655, 12.945],
                [77.655, 12.925]
            ]]
        },
        area_hectares=380.2,
        created_at=datetime.fromisoformat("2025-02-01T06:20:00"),
        last_monitored_at=datetime.fromisoformat("2026-02-25T17:00:00"),
        active_alerts_count=1
    ),
    AOIResponse(
        id="aoi-wayanad",
        name="Wayanad Western Ghats Slope",
        description="Rapid slope scar detection, landslide debris runout, and canopy displacement monitoring.",
        preset_key="wayanad",
        geometry={
            "type": "Polygon",
            "coordinates": [[
                [76.150, 11.530],
                [76.210, 11.530],
                [76.210, 11.570],
                [76.150, 11.570],
                [76.150, 11.530]
            ]]
        },
        area_hectares=890.0,
        created_at=datetime.fromisoformat("2025-02-05T10:15:00"),
        last_monitored_at=datetime.fromisoformat("2026-02-26T12:30:00"),
        active_alerts_count=2
    )
]

@router.get("", response_model=List[AOIResponse])
def list_aois():
    return AOI_STORE

@router.get("/{aoi_id}", response_model=AOIResponse)
def get_aoi(aoi_id: str):
    for aoi in AOI_STORE:
        if aoi.id == aoi_id:
            return aoi
    raise HTTPException(status_code=404, detail="AOI not found")

@router.post("", response_model=AOIResponse)
def create_aoi(aoi_in: AOICreate):
    new_id = f"aoi-custom-{int(datetime.now().timestamp())}"
    # Simplified area estimation from bounding box coordinates
    coords = aoi_in.geometry.get("coordinates", [[]])[0]
    if len(coords) >= 4:
        lons = [c[0] for c in coords]
        lats = [c[1] for c in coords]
        # ~111 km per deg lat, ~100 km per deg lon in India
        d_lat_km = (max(lats) - min(lats)) * 111.0
        d_lon_km = (max(lons) - min(lons)) * 100.0
        area_ha = round(max(5.0, d_lat_km * d_lon_km * 100.0), 1)
    else:
        area_ha = 100.0

    new_aoi = AOIResponse(
        id=new_id,
        name=aoi_in.name,
        description=aoi_in.description or "User-defined satellite monitoring boundary",
        geometry=aoi_in.geometry,
        preset_key=aoi_in.preset_key,
        area_hectares=area_ha,
        created_at=datetime.now(),
        last_monitored_at=None,
        active_alerts_count=0
    )
    AOI_STORE.insert(0, new_aoi)
    return new_aoi
