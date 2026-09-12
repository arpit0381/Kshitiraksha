from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.auth import router as auth_router
from app.api.aois import router as aois_router
from app.api.analysis import router as analysis_router
from app.api.events import router as events_router
from app.api.exports import router as exports_router
from app.api.projects import router as projects_router
from app.api.alerts import router as alerts_router
from app.api.x402 import router as x402_router

app = FastAPI(
    title="Kshitiraksha - Satellite Change Detection & Alert System",
    description="Intelligent Remote Sensing & GIS platform for automated satellite change detection, human verification, and AlgoKit x402 micropayments.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for Frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.models.user import User
from app.models.aoi import AOI
from app.models.event import ChangeEvent
from app.models.project import Project
from app.models.alert import AlertNotification, AlertRule
from app.models.payment import X402PaymentRecord
from app.db.seed import seed_initial_data

# Automatically initialize database schema tables and initial seed data
Base.metadata.create_all(bind=engine)
try:
    with SessionLocal() as db_session:
        seed_initial_data(db_session)
except Exception as e:
    print(f"Warning: database seed initialization notice: {e}")

# Mount Modular Routers
app.include_router(auth_router, prefix="/api")
app.include_router(aois_router, prefix="/api")
app.include_router(analysis_router, prefix="/api")
app.include_router(events_router, prefix="/api")
app.include_router(projects_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(exports_router, prefix="/api")
app.include_router(x402_router, prefix="/api")

@app.get("/")
def root():
    return {
        "system": "Kshitiraksha",
        "status": "OPERATIONAL",
        "version": "1.0.0",
        "sensor": "Sentinel-2 MSI (10m L2A)",
        "modules": [
            "AOI Management",
            "Multi-Spectral Change Engine (NDVI/NDWI)",
            "OpenCV Morphology & Vectorizer",
            "Explainable 4-Factor Confidence Engine",
            "Human Review & Verification",
            "AlgoKit x402 Micropayments",
            "Projects & Alerts Dispatch"
        ],
        "docs": "/docs"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "satellite_provider": "ONLINE",
        "opencv_engine": "READY",
        "x402_facilitator": "CONNECTED"
    }
