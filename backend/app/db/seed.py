import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.user import User
from app.models.aoi import AOI
from app.models.project import Project
from app.models.event import ChangeEvent
from app.models.alert import AlertNotification, AlertRule
from app.models.payment import X402PaymentRecord

def seed_initial_data(db: Session):
    # Seed or ensure all 4 standard demo personas exist
    demo_users = [
        "officer.korba@forest.gov.in",
        "scientist.isro@nrsc.gov.in",
        "coastal.authority@cwc.gov.in",
        "algo.dev@x402.org",
        "auditor.cag@nic.in",
        "analyst.worldbank@esg.org",
        "dfo.korba@forest.gov.in"
    ]
    user = None
    for email in demo_users:
        existing = db.query(User).filter(User.email == email).first()
        if not existing:
            new_user = User(
                id=str(uuid.uuid4()),
                email=email,
                hashed_password=get_password_hash("demopass123"),
                is_active=True
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            if not user:
                user = new_user
        elif not user:
            user = existing

    # Seed Projects if empty
    if db.query(Project).count() == 0:
        projects = [
            Project(
                id="proj-forest-watch",
                name="National Deforestation & Canopy Watch",
                description="Continuous multi-spectral monitoring of high-density Sal and Deciduous forest reserves against illegal logging and opencast mining.",
                department="Ministry of Environment, Forest and Climate Change (MoEFCC)",
                aoi_ids=["aoi-hasdeo", "aoi-wayanad"],
                monitoring_frequency="ORBITAL_5DAY",
                status="ACTIVE"
            ),
            Project(
                id="proj-wetland-resilience",
                name="Coastal Delta & Wetland Conservation Taskforce",
                description="Surveillance of coastal mangrove estuaries, tidal mudflats, and urban lake boundary encroachments.",
                department="Central Water Commission & Coastal Zone Management Authority",
                aoi_ids=["aoi-sundarbans", "aoi-bellandur"],
                monitoring_frequency="WEEKLY",
                status="ACTIVE"
            )
        ]
        for p in projects:
            db.add(p)
        db.commit()

    # Seed AOIs if empty
    if db.query(AOI).count() == 0:
        aois = [
            AOI(
                id="aoi-hasdeo",
                project_id="proj-forest-watch",
                name="Hasdeo Arand Forest Range",
                description="Continuous monitoring of dense Sal forest canopy against open-cast coal mining encroachment in north Chhattisgarh.",
                preset_key="hasdeo",
                category="VEGETATION_LOSS",
                center=[22.825, 82.685],
                zoom=13,
                area_hectares=1420.5,
                active_alerts_count=2,
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
                owner_id=user.id
            ),
            AOI(
                id="aoi-sundarbans",
                project_id="proj-wetland-resilience",
                name="Sundarbans Biosphere Delta",
                description="Monitoring tidal mangrove loss, delta erosion, and salinity changes along the Hugli-Matla estuary.",
                preset_key="sundarbans",
                category="WATER_EXPANSION",
                center=[21.945, 88.850],
                zoom=12,
                area_hectares=3250.0,
                active_alerts_count=1,
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
                owner_id=user.id
            ),
            AOI(
                id="aoi-bellandur",
                project_id="proj-wetland-resilience",
                name="Bellandur Lake Wetland",
                description="Urban water body surface shrinkage, marsh vegetation degradation, and encroachment detection.",
                preset_key="bellandur",
                category="WATER_SHRINKAGE",
                center=[12.935, 77.670],
                zoom=14,
                area_hectares=380.2,
                active_alerts_count=1,
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
                owner_id=user.id
            ),
            AOI(
                id="aoi-wayanad",
                project_id="proj-forest-watch",
                name="Wayanad Wildlife Sanctuary",
                description="Tropical moist deciduous forest canopy monitoring along the Western Ghats ecological zone.",
                preset_key="wayanad",
                category="VEGETATION_LOSS",
                center=[11.685, 76.220],
                zoom=13,
                area_hectares=980.0,
                active_alerts_count=1,
                geometry={
                    "type": "Polygon",
                    "coordinates": [[
                        [76.180, 11.650],
                        [76.260, 11.650],
                        [76.260, 11.720],
                        [76.180, 11.720],
                        [76.180, 11.650]
                    ]]
                },
                owner_id=user.id
            )
        ]
        for a in aois:
            db.add(a)
        db.commit()

    # Seed ChangeEvents if empty
    if db.query(ChangeEvent).count() == 0:
        events = [
            ChangeEvent(
                id="evt-hasdeo-001",
                aoi_id="aoi-hasdeo",
                aoi_name="Hasdeo Arand Forest Range",
                analysis_run_id="run-sentinel2-2026-02-12-001",
                category="VEGETATION_LOSS",
                title="Canopy Clearance & Open Pit Mining Encroachment",
                description="High-confidence vegetative biomass depletion observed in Parsa East Kente Basan mine block sector B. Rapid loss of Sal forest tree cover.",
                baseline_date="2025-01-15",
                recent_date="2026-02-10",
                affected_area_hectares=28.4,
                average_delta_index=-0.46,
                confidence={
                    "magnitude_score": 0.94,
                    "spatial_consistency_score": 0.96,
                    "image_quality_score": 0.91,
                    "persistence_score": 0.89,
                    "overall_detection_confidence": 0.932,
                    "classification_confidence": 0.895
                },
                geojson_geometry={
                    "type": "MultiPolygon",
                    "coordinates": [
                        [[
                            [82.670, 22.818],
                            [82.705, 22.816],
                            [82.708, 22.835],
                            [82.672, 22.837],
                            [82.670, 22.818]
                        ]]
                    ]
                },
                review_status="PENDING",
                review_notes="Automated pipeline flagged significant NDVI dip (-0.46) across 28.4 ha. Recommended for physical patrol dispatch."
            ),
            ChangeEvent(
                id="evt-sundarbans-002",
                aoi_id="aoi-sundarbans",
                aoi_name="Sundarbans Biosphere Delta",
                analysis_run_id="run-sentinel2-2026-02-27-003",
                category="WATER_EXPANSION",
                title="Tidal Embankment Breaching & Mangrove Inundation",
                description="Tidal surge detected along northern Matla embankment. High NDWI anomaly indicating sustained sea water ingress across low-lying delta mudflats.",
                baseline_date="2025-02-01",
                recent_date="2026-02-27",
                affected_area_hectares=64.2,
                average_delta_index=0.38,
                confidence={
                    "magnitude_score": 0.91,
                    "spatial_consistency_score": 0.94,
                    "image_quality_score": 0.88,
                    "persistence_score": 0.92,
                    "overall_detection_confidence": 0.914,
                    "classification_confidence": 0.875
                },
                geojson_geometry={
                    "type": "MultiPolygon",
                    "coordinates": [
                        [[
                            [88.820, 21.920],
                            [88.875, 21.925],
                            [88.870, 21.960],
                            [88.815, 21.955],
                            [88.820, 21.920]
                        ]]
                    ]
                },
                review_status="VERIFIED",
                review_notes="Field ground-truthed by Coastal Patrol Vessel CPV-08. Sea wall breached at chainage 14.5km."
            ),
            ChangeEvent(
                id="evt-bellandur-003",
                aoi_id="aoi-bellandur",
                aoi_name="Bellandur Lake Wetland",
                analysis_run_id="run-sentinel2-2026-02-25-004",
                category="WATER_SHRINKAGE",
                title="Wetland Encroachment & Water Surface Shrinkage",
                description="Open water surface contraction accompanied by debris fill along southern wetland buffer corridor. Significant drop in water index (-0.39).",
                baseline_date="2025-03-10",
                recent_date="2026-02-25",
                affected_area_hectares=14.8,
                average_delta_index=-0.39,
                confidence={
                    "magnitude_score": 0.88,
                    "spatial_consistency_score": 0.92,
                    "image_quality_score": 0.85,
                    "persistence_score": 0.87,
                    "overall_detection_confidence": 0.882,
                    "classification_confidence": 0.840
                },
                geojson_geometry={
                    "type": "MultiPolygon",
                    "coordinates": [
                        [[
                            [77.662, 12.930],
                            [77.678, 12.931],
                            [77.676, 12.942],
                            [77.660, 12.940],
                            [77.662, 12.930]
                        ]]
                    ]
                },
                review_status="NEEDS_REVIEW",
                review_notes="Requires cross-verification with Bangalore Municipal Lake Development Authority cadastral boundary."
            ),
            ChangeEvent(
                id="evt-wayanad-004",
                aoi_id="aoi-wayanad",
                aoi_name="Wayanad Wildlife Sanctuary",
                analysis_run_id="run-sentinel2-2026-02-20-002",
                category="VEGETATION_LOSS",
                title="Riparian Buffer Slashing & Illegal Clearing",
                description="Corridor clearing detected along Kabini river tributary. Canopy thinning and soil exposure identified by multi-spectral differencing.",
                baseline_date="2025-01-20",
                recent_date="2026-02-18",
                affected_area_hectares=9.6,
                average_delta_index=-0.35,
                confidence={
                    "magnitude_score": 0.89,
                    "spatial_consistency_score": 0.91,
                    "image_quality_score": 0.93,
                    "persistence_score": 0.86,
                    "overall_detection_confidence": 0.898,
                    "classification_confidence": 0.860
                },
                geojson_geometry={
                    "type": "MultiPolygon",
                    "coordinates": [
                        [[
                            [76.205, 11.670],
                            [76.235, 11.672],
                            [76.230, 11.695],
                            [76.202, 11.692],
                            [76.205, 11.670]
                        ]]
                    ]
                },
                review_status="VERIFIED",
                review_notes="Verified by Sultan Bathery Range Office. Offence case registered under Section 27 of Wildlife Protection Act."
            )
        ]
        for e in events:
            db.add(e)
        db.commit()

    # Seed Alert Rules if empty
    if db.query(AlertRule).count() == 0:
        rules = [
            AlertRule(
                id="rule-hasdeo-crit",
                aoi_id="aoi-hasdeo",
                category="VEGETATION_LOSS",
                min_confidence=0.88,
                min_area_hectares=5.0,
                delta_threshold=-0.30,
                channels=["DASHBOARD", "EMAIL", "SMS"],
                enabled=True
            ),
            AlertRule(
                id="rule-sundarbans-flood",
                aoi_id="aoi-sundarbans",
                category="WATER_EXPANSION",
                min_confidence=0.85,
                min_area_hectares=10.0,
                delta_threshold=0.25,
                channels=["DASHBOARD", "EMAIL", "WEBHOOK"],
                enabled=True
            ),
            AlertRule(
                id="rule-bellandur-encroach",
                aoi_id="aoi-bellandur",
                category="WATER_SHRINKAGE",
                min_confidence=0.82,
                min_area_hectares=2.0,
                delta_threshold=-0.25,
                channels=["DASHBOARD", "EMAIL"],
                enabled=True
            )
        ]
        for r in rules:
            db.add(r)
        db.commit()

    # Seed Alert Notifications if empty
    if db.query(AlertNotification).count() == 0:
        alerts = [
            AlertNotification(
                id="alt-2026-001",
                event_id="evt-hasdeo-001",
                event_title="Canopy Clearance & Open Pit Mining Encroachment",
                aoi_name="Hasdeo Arand Forest Range",
                category="VEGETATION_LOSS",
                severity="CRITICAL",
                channel="DASHBOARD",
                recipient="Chief Conservator of Forests, Bilaspur Circle",
                status="DELIVERED",
                affected_area_hectares=28.4,
                confidence_pct=93.2
            ),
            AlertNotification(
                id="alt-2026-002",
                event_id="evt-sundarbans-002",
                event_title="Tidal Embankment Breaching & Mangrove Inundation",
                aoi_name="Sundarbans Biosphere Delta",
                category="WATER_EXPANSION",
                severity="HIGH",
                channel="EMAIL",
                recipient="officer.korba@forest.gov.in",
                status="DELIVERED",
                affected_area_hectares=64.2,
                confidence_pct=91.4
            )
        ]
        for a in alerts:
            db.add(a)
        db.commit()

    # Seed X402 Payment Records if empty
    if db.query(X402PaymentRecord).count() == 0:
        payments = [
            X402PaymentRecord(
                tx_id="ALGO-TX-M6K9X72-Q82F1",
                resource="/api/v1/sentinel/highres-compute",
                service_name="Priority 10m L2A Sentinel Pipeline",
                amount_algo=0.25,
                sender="ISRO77WXYZA402TESTNETALGOV73281KKLOP",
                status="CONFIRMED",
                block_number=41834219
            ),
            X402PaymentRecord(
                tx_id="ALGO-TX-N3B1P88-L91Z2",
                resource="/api/v1/exports/geotiff",
                service_name="Calibrated Radiometric Surface Reflectance GeoTIFF",
                amount_algo=0.50,
                sender="ISRO77WXYZA402TESTNETALGOV73281KKLOP",
                status="CONFIRMED",
                block_number=41834890
            )
        ]
        for p in payments:
            db.add(p)
        db.commit()
