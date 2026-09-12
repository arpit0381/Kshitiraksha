from app.services.satellite_provider import Sentinel2L2AProvider
import numpy as np

def test_satellite_provider():
    provider = Sentinel2L2AProvider()
    print("Provider initialized.")
    
    # Bbox for a small region
    bbox = [77.5, 28.5, 77.6, 28.6] 
    
    observations = provider.search_observations("test_aoi", bbox, "2025-01-01", "2026-01-01")
    print(f"Found {len(observations)} observations.")
    
    if observations:
        obs_id = observations[0]["id"]
        print(f"Fetching cube for {obs_id}...")
        
        cube = provider.get_multi_spectral_cube(obs_id, resolution_shape=(100, 100))
        print("Keys returned:", cube.keys())
        for k, v in cube.items():
            print(f"{k}: shape={v.shape}, min={v.min()}, max={v.max()}")

if __name__ == "__main__":
    test_satellite_provider()
