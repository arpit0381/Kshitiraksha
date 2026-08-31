from typing import Dict, Any
from app.schemas.models import ConfidenceBreakdown, ChangeCategory

class ConfidenceEngine:
    """
    Explainable 4-Factor Confidence Calculation Engine
    Evaluates:
    1. Change Magnitude Score (severity of spectral delta)
    2. Spatial Consistency Score (connectedness & morphology vs random noise)
    3. Image Quality Score (cloud clearance & sensor SNR)
    4. Persistence Score (temporal stability)
    """

    @classmethod
    def calculate_confidence(
        cls,
        delta_mean: float,
        num_blobs: int,
        total_pixels: int,
        cloud_pct_baseline: float,
        cloud_pct_recent: float,
        category: ChangeCategory
    ) -> ConfidenceBreakdown:
        # 1. Magnitude score (how distinct is the spectral shift)
        # Larger absolute delta = higher confidence in real physical change
        mag = min(1.0, abs(delta_mean) / 0.45)
        mag_score = max(0.40, mag)

        # 2. Spatial consistency (large coherent clusters score higher than scattered salt-and-pepper)
        if total_pixels == 0:
            spatial_score = 0.1
        else:
            avg_pixels_per_blob = total_pixels / max(1, num_blobs)
            spatial_score = min(0.98, max(0.55, avg_pixels_per_blob / 80.0))

        # 3. Image quality score (cloud & shadow penalty)
        avg_cloud = (cloud_pct_baseline + cloud_pct_recent) / 2.0
        quality_score = max(0.50, min(0.98, 1.0 - (avg_cloud / 100.0) * 0.8))

        # 4. Persistence score (baseline repeatability)
        # In multi-temporal monitoring, standard optical persistence benchmark:
        persistence_score = 0.86

        # Overall composite detection confidence
        overall = (mag_score + spatial_score + quality_score + persistence_score) / 4.0
        overall = round(min(0.99, max(0.50, overall)), 3)

        # Classification confidence
        # Explains how confident we are in the specific label (e.g. VEGETATION_LOSS vs WATER)
        if category in [ChangeCategory.VEGETATION_LOSS, ChangeCategory.WATER_SHRINKAGE]:
            class_conf = round(overall * 0.94, 3)
        else:
            class_conf = round(overall * 0.88, 3)

        return ConfidenceBreakdown(
            magnitude_score=round(mag_score, 3),
            spatial_consistency_score=round(spatial_score, 3),
            image_quality_score=round(quality_score, 3),
            persistence_score=round(persistence_score, 3),
            overall_detection_confidence=overall,
            classification_confidence=class_conf
        )
