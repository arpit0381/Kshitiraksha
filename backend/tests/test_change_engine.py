import pytest
import numpy as np
from app.services.change_engine import ChangeDetectionEngine
from app.services.confidence_engine import ConfidenceEngine
from app.services.x402_facilitator import X402PaymentFacilitator
from app.schemas.models import ChangeCategory

def test_calculate_ndvi():
    red = np.array([[0.1, 0.2], [0.3, 0.0]])
    nir = np.array([[0.7, 0.2], [0.1, 0.0]])
    ndvi = ChangeDetectionEngine.calculate_ndvi(red, nir)
    
    # Pixel (0,0): (0.7 - 0.1) / (0.7 + 0.1) = 0.6 / 0.8 = 0.75
    assert np.isclose(ndvi[0, 0], 0.75, atol=1e-3)
    # Pixel (0,1): (0.2 - 0.2) / 0.4 = 0.0
    assert np.isclose(ndvi[0, 1], 0.0, atol=1e-3)
    # Range check
    assert np.all(ndvi >= -1.0) and np.all(ndvi <= 1.0)

def test_calculate_ndwi():
    green = np.array([[0.5, 0.1]])
    nir = np.array([[0.1, 0.5]])
    ndwi = ChangeDetectionEngine.calculate_ndwi(green, nir)
    
    # Water has high green and low NIR: (0.5 - 0.1) / 0.6 = 0.4 / 0.6 = +0.666
    assert ndwi[0, 0] > 0.5
    # Vegetation has low green and high NIR: (0.1 - 0.5) / 0.6 = -0.666
    assert ndwi[0, 1] < -0.5

def test_morphology_and_connected_components():
    # 20x20 mask with a single 1x1 noise speckle and a coherent 6x6 blob
    mask = np.zeros((20, 20), dtype=np.uint8)
    mask[2, 2] = 1 # isolated speckle
    mask[8:14, 8:14] = 1 # 36-pixel blob
    
    clean = ChangeDetectionEngine.filter_noise_morphology(mask, kernel_size=3)
    # Isolated speckle should be eroded away
    assert clean[2, 2] == 0
    # Core of the blob should remain
    assert clean[10, 10] == 1

    filtered, blobs = ChangeDetectionEngine.filter_connected_components(clean, min_area_pixels=10)
    assert len(blobs) == 1
    assert blobs[0]["area_pixels"] >= 10

def test_vectorize_to_geojson():
    mask = np.zeros((50, 50), dtype=np.uint8)
    mask[10:30, 10:30] = 1
    bbox = [82.65, 22.80, 82.72, 22.85]
    geojson = ChangeDetectionEngine.vectorize_to_geojson(mask, bbox)
    
    assert geojson["type"] == "MultiPolygon"
    assert len(geojson["coordinates"]) > 0
    # Ensure coordinates are within geographic bounds
    coords = geojson["coordinates"][0][0]
    for pt in coords:
        lon, lat = pt
        assert 82.65 <= lon <= 82.72
        assert 22.80 <= lat <= 22.85

def test_confidence_engine():
    conf = ConfidenceEngine.calculate_confidence(
        delta_mean=-0.45,
        num_blobs=2,
        total_pixels=500,
        cloud_pct_baseline=2.0,
        cloud_pct_recent=3.0,
        category=ChangeCategory.VEGETATION_LOSS
    )
    assert conf.overall_detection_confidence >= 0.85
    assert conf.magnitude_score >= 0.85
    assert conf.spatial_consistency_score >= 0.85
    assert conf.image_quality_score >= 0.90
    assert conf.classification_confidence > 0.70

def test_x402_challenge_and_verification():
    challenge = X402PaymentFacilitator.create_payment_challenge(
        resource_path="/api/premium/test",
        amount_algo=0.25
    )
    assert challenge["code"] == 402
    assert challenge["currency"] == "ALGO"
    assert "challenge_token" in challenge

    # Valid verification
    settlement = X402PaymentFacilitator.verify_settlement(
        challenge_token=challenge["challenge_token"],
        transaction_id="ALGO-TESTNET-TXID-1234567890ABCDEF"
    )
    assert settlement["valid"] is True
    assert settlement["status"] == "SETTLED"

    # Invalid token verification
    bad_settlement = X402PaymentFacilitator.verify_settlement(
        challenge_token="tampered.token.signature",
        transaction_id="TX123"
    )
    assert bad_settlement["valid"] is False
