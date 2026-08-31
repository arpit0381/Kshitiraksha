import cv2
import numpy as np
from typing import Dict, Any, List, Tuple

class ChangeDetectionEngine:
    """
    Geospatial Remote Sensing & Change Detection Engine
    Computes spectral indices (NDVI, NDWI), delta thresholding,
    OpenCV morphological noise filtering, connected components,
    and polygon vectorization into GeoJSON.
    """

    @staticmethod
    def calculate_ndvi(red: np.ndarray, nir: np.ndarray) -> np.ndarray:
        """
        Normalized Difference Vegetation Index: (NIR - Red) / (NIR + Red)
        Range: -1.0 to +1.0
        """
        denominator = (nir + red).astype(np.float32)
        numerator = (nir - red).astype(np.float32)
        # Avoid division by zero
        safe_denom = np.where(denominator == 0, 1e-7, denominator)
        ndvi = numerator / safe_denom
        return np.clip(ndvi, -1.0, 1.0)

    @staticmethod
    def calculate_ndwi(green: np.ndarray, nir: np.ndarray) -> np.ndarray:
        """
        Normalized Difference Water Index: (Green - NIR) / (Green + NIR)
        Range: -1.0 to +1.0
        """
        denominator = (green + nir).astype(np.float32)
        numerator = (green - nir).astype(np.float32)
        safe_denom = np.where(denominator == 0, 1e-7, denominator)
        ndwi = numerator / safe_denom
        return np.clip(ndwi, -1.0, 1.0)

    @staticmethod
    def filter_noise_morphology(binary_mask: np.ndarray, kernel_size: int = 3) -> np.ndarray:
        """
        Applies morphological opening (removes small false positive speckles)
        and closing (bridges small internal gaps).
        """
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel_size, kernel_size))
        opened = cv2.morphologyEx(binary_mask.astype(np.uint8), cv2.MORPH_OPEN, kernel)
        closed = cv2.morphologyEx(opened, cv2.MORPH_CLOSE, kernel)
        return closed

    @staticmethod
    def filter_connected_components(binary_mask: np.ndarray, min_area_pixels: int = 15) -> Tuple[np.ndarray, List[Dict[str, Any]]]:
        """
        Finds connected components and filters out regions smaller than min_area_pixels.
        Returns cleaned binary mask and stats for each significant blob.
        """
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(binary_mask, connectivity=8)
        clean_mask = np.zeros_like(binary_mask, dtype=np.uint8)
        significant_regions = []

        for i in range(1, num_labels):  # Skip background (label 0)
            area = stats[i, cv2.CC_STAT_AREA]
            if area >= min_area_pixels:
                clean_mask[labels == i] = 1
                significant_regions.append({
                    "label": i,
                    "area_pixels": int(area),
                    "bbox": [
                        int(stats[i, cv2.CC_STAT_LEFT]),
                        int(stats[i, cv2.CC_STAT_TOP]),
                        int(stats[i, cv2.CC_STAT_WIDTH]),
                        int(stats[i, cv2.CC_STAT_HEIGHT])
                    ],
                    "centroid": [float(centroids[i][0]), float(centroids[i][1])]
                })

        return clean_mask, significant_regions

    @classmethod
    def vectorize_to_geojson(
        cls,
        binary_mask: np.ndarray,
        bbox_geo: List[float],  # [min_lon, min_lat, max_lon, max_lat]
        simplify_epsilon: float = 1.5
    ) -> Dict[str, Any]:
        """
        Converts binary raster mask into EPSG:4326 GeoJSON MultiPolygon coordinates
        using OpenCV contour discovery and affine coordinate interpolation.
        """
        height, width = binary_mask.shape
        min_lon, min_lat, max_lon, max_lat = bbox_geo

        contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        features = []

        for contour in contours:
            # Simplify contour to reduce vertex count while preserving shape
            approx = cv2.approxPolyDP(contour, simplify_epsilon, True)
            if len(approx) < 3:
                continue

            # Project pixel (x, y) to geographic (lon, lat)
            geo_ring = []
            for pt in approx:
                px, py = pt[0]
                lon = min_lon + (px / width) * (max_lon - min_lon)
                lat = max_lat - (py / height) * (max_lat - min_lat)  # Invert Y for latitude
                geo_ring.append([round(lon, 6), round(lat, 6)])

            # Close polygon ring
            if geo_ring and geo_ring[0] != geo_ring[-1]:
                geo_ring.append(geo_ring[0])

            features.append([geo_ring])

        if not features:
            # Fallback to an empty geometry collection
            return {
                "type": "MultiPolygon",
                "coordinates": []
            }

        return {
            "type": "MultiPolygon",
            "coordinates": features
        }
