from abc import ABC, abstractmethod
from typing import Dict, Any, List, Tuple
import numpy as np

class SatelliteProvider(ABC):
    """Abstract Satellite Provider Interface (TRD Section 18)"""
    @abstractmethod
    def search_observations(self, aoi_id: str, bbox: List[float], start_date: str, end_date: str) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_multi_spectral_cube(self, observation_id: str, resolution_shape: Tuple[int, int]) -> Dict[str, np.ndarray]:
        pass

import pystac_client
import planetary_computer
import odc.stac
import cv2

class Sentinel2L2AProvider(SatelliteProvider):
    """
    Sentinel-2 MSI Level-2A Surface Reflectance Provider
    Uses Microsoft Planetary Computer STAC API to fetch real, live satellite imagery.
    """
    def __init__(self):
        self.catalog = pystac_client.Client.open(
            "https://planetarycomputer.microsoft.com/api/stac/v1",
            modifier=planetary_computer.sign_inplace,
        )

    def search_observations(self, aoi_id: str, bbox: List[float], start_date: str, end_date: str) -> List[Dict[str, Any]]:
        # bbox format: [min_lon, min_lat, max_lon, max_lat]
        search = self.catalog.search(
            collections=["sentinel-2-l2a"],
            bbox=bbox,
            datetime=f"{start_date}/{end_date}",
            query={"eo:cloud_cover": {"lt": 30}}
        )
        
        items = list(search.items())
        
        results = []
        for item in items:
            results.append({
                "id": item.id,
                "satellite": "Sentinel-2 L2A",
                "date": item.datetime.strftime("%Y-%m-%d") if item.datetime else None,
                "cloud_cover_pct": item.properties.get("eo:cloud_cover", 0.0),
                "sun_elevation_deg": item.properties.get("view:sun_elevation", 0.0),
                "gsd_m": 10.0,
                "tile_id": item.properties.get("s2:mgrs_tile", "")
            })
        
        # Sort by date descending
        return sorted(results, key=lambda x: x["date"], reverse=True)

    def get_multi_spectral_cube(
        self,
        observation_id: str,
        resolution_shape: Tuple[int, int] = (180, 240),
        scenario: str = "deforestation"
    ) -> Dict[str, np.ndarray]:
        """
        Loads authentic surface reflectance bands from Planetary Computer.
        """
        search = self.catalog.search(
            collections=["sentinel-2-l2a"],
            ids=[observation_id]
        )
        items = list(search.items())
        if not items:
            raise ValueError(f"Observation {observation_id} not found.")
        
        item = items[0]
        
        # Lazy load standard bands at 20m resolution to save memory/bandwidth for quick preview
        ds = odc.stac.load(
            [item],
            bands=["B02", "B03", "B04", "B08", "SCL"],
            resolution=20, 
            chunks={"x": 512, "y": 512}
        )
        
        # Take a center subset to simulate AOI crop (preventing out of memory on full 100km tile)
        h, w = resolution_shape
        cy, cx = ds.sizes['y'] // 2, ds.sizes['x'] // 2
        dy, dx = min(cy, h), min(cx, w)
            
        subset = ds.isel(y=slice(cy - dy, cy + dy), x=slice(cx - dx, cx + dx)).compute()
        
        # Extract numpy arrays
        blue = subset.B02.values[0].astype(float)
        green = subset.B03.values[0].astype(float)
        red = subset.B04.values[0].astype(float)
        nir = subset.B08.values[0].astype(float)
        scl = subset.SCL.values[0]
        
        # Scale reflectance (divide by 10000) and clip
        blue = np.clip(blue / 10000.0, 0, 1)
        green = np.clip(green / 10000.0, 0, 1)
        red = np.clip(red / 10000.0, 0, 1)
        nir = np.clip(nir / 10000.0, 0, 1)
        
        # SCL (Scene Classification): 3=cloud shadow, 8=med cloud, 9=high cloud, 10=cirrus
        cloud_mask = np.isin(scl, [3, 8, 9, 10])
        valid_mask = (~cloud_mask).astype(np.uint8)
        
        # Resize to exact requested resolution_shape (w, h) for cv2
        target_size = (resolution_shape[1], resolution_shape[0])
        
        blue_r = cv2.resize(blue, target_size, interpolation=cv2.INTER_LINEAR)
        green_r = cv2.resize(green, target_size, interpolation=cv2.INTER_LINEAR)
        red_r = cv2.resize(red, target_size, interpolation=cv2.INTER_LINEAR)
        nir_r = cv2.resize(nir, target_size, interpolation=cv2.INTER_LINEAR)
        valid_r = cv2.resize(valid_mask, target_size, interpolation=cv2.INTER_NEAREST)
        
        return {
            "B2_blue": np.clip(blue_r, 0.01, 0.99),
            "B3_green": np.clip(green_r, 0.01, 0.99),
            "B4_red": np.clip(red_r, 0.01, 0.99),
            "B8_nir": np.clip(nir_r, 0.01, 0.99),
            "valid_mask": valid_r
        }
