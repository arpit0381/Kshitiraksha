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

class Sentinel2L2AProvider(SatelliteProvider):
    """
    Sentinel-2 MSI Level-2A Surface Reflectance Provider
    Simulates authentic multispectral band data (B2-Blue, B3-Green, B4-Red, B8-NIR, SCL-Cloud)
    for change detection analysis.
    """

    def search_observations(self, aoi_id: str, bbox: List[float], start_date: str, end_date: str) -> List[Dict[str, Any]]:
        return [
            {
                "id": f"{aoi_id}_baseline_20250115",
                "satellite": "Sentinel-2B MSI L2A",
                "date": "2025-01-15",
                "cloud_cover_pct": 2.4,
                "sun_elevation_deg": 56.8,
                "gsd_m": 10.0,
                "tile_id": "T43QGB"
            },
            {
                "id": f"{aoi_id}_recent_20260210",
                "satellite": "Sentinel-2A MSI L2A",
                "date": "2026-02-10",
                "cloud_cover_pct": 4.1,
                "sun_elevation_deg": 59.2,
                "gsd_m": 10.0,
                "tile_id": "T43QGB"
            }
        ]

    def get_multi_spectral_cube(
        self,
        observation_id: str,
        resolution_shape: Tuple[int, int] = (180, 240),
        scenario: str = "deforestation"
    ) -> Dict[str, np.ndarray]:
        """
        Generates realistic calibrated surface reflectance bands (0.0 to 1.0)
        reflecting real physical biophysical properties.
        """
        h, w = resolution_shape
        np.random.seed(42 if "baseline" in observation_id else 84)

        # Baseline: Healthy vegetation has low Red (~0.05-0.12) and very high NIR (~0.55-0.85)
        # Water has low Red & very low NIR (<0.05)
        # Bare soil / mining has moderate Red (~0.25) and moderate NIR (~0.30)
        
        # Base landscape synthesis
        x = np.linspace(-3, 3, w)
        y = np.linspace(-2, 2, h)
        xx, yy = np.meshgrid(x, y)
        
        # Terrain variation
        terrain = np.sin(xx * 1.5) * np.cos(yy * 1.5) * 0.1

        if "baseline" in observation_id:
            # Pristine baseline state
            # Forest covering central/right area: high NIR, low Red
            red = 0.08 + np.clip(terrain, 0, 0.05) + np.random.normal(0, 0.015, (h, w))
            green = 0.12 + np.clip(terrain, 0, 0.05) + np.random.normal(0, 0.015, (h, w))
            nir = 0.68 + terrain * 0.5 + np.random.normal(0, 0.03, (h, w))
            
            # Lake/water body in top-left
            water_mask = ((xx + 1.8)**2 + (yy - 1.0)**2) < 0.6
            red[water_mask] = 0.03
            green[water_mask] = 0.09
            nir[water_mask] = 0.02

            # Valid pixel cloud mask (1 = clean, 0 = cloud)
            valid_mask = np.ones((h, w), dtype=np.uint8)
            # 2% light wispy cloud top edge
            valid_mask[0:8, 20:50] = 0
            
        else:
            # Recent state: Significant vegetation clearing / mining cut in center
            red = 0.09 + np.clip(terrain, 0, 0.05) + np.random.normal(0, 0.015, (h, w))
            green = 0.13 + np.clip(terrain, 0, 0.05) + np.random.normal(0, 0.015, (h, w))
            nir = 0.67 + terrain * 0.5 + np.random.normal(0, 0.03, (h, w))

            water_mask = ((xx + 1.8)**2 + (yy - 1.0)**2) < 0.6
            red[water_mask] = 0.03
            green[water_mask] = 0.09
            nir[water_mask] = 0.02

            # Deforestation / excavation scar in center:
            # Forest replaced by bare soil/mine pit (Red rises to ~0.32, NIR collapses to ~0.24)
            change_zone_1 = ((xx - 0.5)**2 + (yy + 0.2)**2) < 0.45
            change_zone_2 = ((xx + 0.3)**2 / 0.8 + (yy - 0.4)**2 / 0.3) < 0.35
            deforestation_mask = change_zone_1 | change_zone_2

            red[deforestation_mask] = 0.34 + np.random.normal(0, 0.02, np.sum(deforestation_mask))
            green[deforestation_mask] = 0.28 + np.random.normal(0, 0.02, np.sum(deforestation_mask))
            nir[deforestation_mask] = 0.22 + np.random.normal(0, 0.02, np.sum(deforestation_mask))

            valid_mask = np.ones((h, w), dtype=np.uint8)
            valid_mask[0:12, 18:55] = 0

        # Normalization
        red = np.clip(red, 0.01, 0.99)
        green = np.clip(green, 0.01, 0.99)
        nir = np.clip(nir, 0.01, 0.99)

        return {
            "B2_blue": np.clip(red * 0.8, 0.01, 0.99),
            "B3_green": green,
            "B4_red": red,
            "B8_nir": nir,
            "valid_mask": valid_mask
        }
