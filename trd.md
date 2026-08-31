TECHNICAL REQUIREMENTS DOCUMENT (TRD)
Satellite-Based Automated Change Detection & Alert System
Version: 1.0
Document Type: Technical Requirements Document (TRD)
Project Domain: Remote Sensing • GIS • Artificial Intelligence • Web Application • Blockchain Payments
Architecture Type: Modular, Service-Oriented, Asynchronous Processing
Deployment Strategy: Free/Open-Source First
Primary Stack: React + FastAPI + Python GIS + PostgreSQL/PostGIS + Docker

1. DOCUMENT PURPOSE
This Technical Requirements Document defines the complete technical implementation requirements for the:

Satellite-Based Automated Change Detection & Alert System

The system allows users to select a geographical Area of Interest (AOI), obtain satellite observations over time, preprocess imagery, detect meaningful changes, generate geospatial events, alert users, visualize evidence, and export results.

The original project documentation defines the core operational flow as:

User → AOI Selection → Monitoring Scheduler → Satellite Data Query → Preprocessing → Change Detection → Change Classification → Event Storage → Alert → Dashboard / Export 
ISRO_Satellite_Change_Detection…


This TRD converts that product flow into an implementation-ready technical architecture.

2. TECHNICAL OBJECTIVES
The technical system must:

Run using free and open-source technologies wherever possible.

Avoid mandatory paid cloud services.

Support local development.

Support Docker-based deployment.

Process satellite imagery asynchronously.

Store geospatial geometry efficiently.

Support repeated AOI monitoring.

Detect and store geographical changes.

Generate explainable events.

Provide an interactive GIS dashboard.

Support GIS exports.

Allow future AI/ML integration.

Support optional x402/AlgoKit premium payment integration.

Remain modular and scalable.

3. HIGH-LEVEL TECHNICAL ARCHITECTURE

                         ┌─────────────────────┐
                         │      USER           │
                         │ Browser / Mobile    │
                         └──────────┬──────────┘
                                    │
                                    ▼
                     ┌──────────────────────────┐
                     │      FRONTEND            │
                     │ React + Vite + Leaflet   │
                     └────────────┬─────────────┘
                                  │ HTTPS / REST
                                  ▼
                     ┌──────────────────────────┐
                     │       API SERVER         │
                     │       FastAPI            │
                     │ Authentication           │
                     │ Projects / AOIs / Events │
                     └────────────┬─────────────┘
                                  │
              ┌───────────────────┼────────────────────┐
              │                   │                    │
              ▼                   ▼                    ▼
     ┌────────────────┐  ┌─────────────────┐  ┌────────────────┐
     │ PostgreSQL +   │  │ Redis Queue     │  │ Object Storage │
     │ PostGIS        │  │                │  │ Local / MinIO  │
     └────────────────┘  └────────┬────────┘  └────────────────┘
                                  │
                                  ▼
                      ┌───────────────────────┐
                      │ PROCESSING WORKER     │
                      │ Python + Rasterio     │
                      │ GDAL + NumPy          │
                      │ OpenCV                │
                      └───────────┬───────────┘
                                  │
                                  ▼
                      ┌───────────────────────┐
                      │ SATELLITE DATA LAYER  │
                      │ Open Data / Catalog   │
                      │ Sentinel / Landsat    │
                      └───────────────────────┘
The architecture directly follows the source's separation of presentation, API, scheduler/queue, processing, data access, database, storage and notifications. 
ISRO_Satellite_Change_Detection…


4. COMPLETE FREE TECHNOLOGY STACK
4.1 Technology Stack Summary
Layer	Technology	Cost	Reason
Frontend	React	Free / Open Source	Modern UI
Build Tool	Vite	Free / Open Source	Fast development
Language	TypeScript	Free / Open Source	Type safety
Mapping	Leaflet	Free / Open Source	Interactive GIS maps
Alternative Map	MapLibre	Free / Open Source	Advanced mapping
Backend	FastAPI	Free / Open Source	Python ecosystem
Backend Language	Python	Free / Open Source	GIS + AI ecosystem
Database	PostgreSQL	Free / Open Source	Reliable database
GIS Database	PostGIS	Free / Open Source	Geospatial queries
Queue	Redis	Free / Open Source	Job queue
Task Processing	Celery	Free / Open Source	Async jobs
Scheduler	Celery Beat	Free / Open Source	Scheduled monitoring
Raster Processing	Rasterio	Free / Open Source	Satellite raster processing
GIS Processing	GDAL	Free / Open Source	Industry-standard GIS
Numerical Analysis	NumPy	Free / Open Source	Array calculations
Image Processing	OpenCV	Free / Open Source	Morphology/filtering
Geometry	Shapely	Free / Open Source	Geometry operations
Geo Data	GeoPandas	Free / Open Source	Vector data
ML	scikit-learn	Free / Open Source	Baseline ML
Advanced ML	PyTorch	Free / Open Source	Deep learning
Object Storage	MinIO	Free / Open Source	S3-compatible self-hosted
Containers	Docker	Free	Reproducible deployment
Reverse Proxy	Nginx	Free / Open Source	Routing
API Documentation	FastAPI Swagger/OpenAPI	Built-in	API docs
Testing	Pytest	Free / Open Source	Backend testing
Frontend Testing	Vitest	Free / Open Source	UI tests
E2E Testing	Playwright	Free / Open Source	Full-flow testing
Blockchain	AlgoKit / x402	Protocol/tooling layer	Optional premium module

The source document itself recommends React/Next.js, Leaflet/MapLibre, FastAPI, Rasterio, GDAL, NumPy, OpenCV, PostgreSQL/PostGIS, async workers and optional ML frameworks. 
ISRO_Satellite_Change_Detection…


5. FREE-FIRST DEPLOYMENT STRATEGY
Development
Everything runs locally using Docker:


localhost
│
├── Frontend
├── Backend
├── PostgreSQL + PostGIS
├── Redis
├── Worker
├── Scheduler
├── MinIO
└── Nginx
No cloud account required.

Demo Deployment
Recommended architecture:


Single Linux Machine / Laptop / Free VM
              │
              ▼
       Docker Compose
              │
   ┌──────────┼──────────┐
   │          │          │
Frontend   Backend    Worker
   │          │          │
PostGIS     Redis     MinIO
This is ideal for a hackathon.

6. SYSTEM MODULES
The source identifies major responsibilities around authentication, project management, AOI configuration, monitoring, processing, events, alerts and exports. 
ISRO_Satellite_Change_Detection…


Our implementation will use the following modules.

Module A — Authentication & User Management
Responsibilities
Registration

Login

Logout

Password hashing

JWT authentication

Role-based access control

User ownership validation

Technology

FastAPI
SQLAlchemy
JWT
bcrypt / Argon2
PostgreSQL
Module B — Project Management
Responsibilities

Create Project
Update Project
Activate Project
Deactivate Project
Delete Project
Project Configuration
JSON

{
  "project_name": "Forest Monitoring",
  "description": "Monitor vegetation changes",
  "active": true,
  "monitoring_frequency": "weekly"
}
Module C — AOI Management
AOI = Area of Interest.

Users can:

Draw polygon

Edit polygon

Delete polygon

Upload boundary

Configure monitoring

Supported Storage Format

GeoJSON
Internally:


PostGIS Geometry
7. GIS FRONTEND ARCHITECTURE
Recommended Libraries

React
TypeScript
Vite
Leaflet
React Leaflet
Turf.js
Map Features
The map must support:

Basemap
OpenStreetMap

Satellite imagery layer where legally/technically available

AOI Features

Draw Polygon
Edit Polygon
Delete Polygon
Save Polygon
Calculate Area
Validate Geometry
Event Features

Display Change Polygon
Zoom to Event
Show Before Layer
Show After Layer
Toggle Change Overlay
8. BACKEND ARCHITECTURE
Framework

Python + FastAPI
Why
The backend and GIS processing use the same ecosystem.

This reduces unnecessary complexity.

Instead of:


Node.js API
      +
Python GIS Microservice
For MVP:


FastAPI API
      +
Python Worker
Both share:


Python Models
Python GIS Libraries
Python Processing Code
9. BACKEND PROJECT STRUCTURE

backend/
│
├── app/
│   │
│   ├── main.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── database.py
│   │
│   ├── api/
│   │   ├── auth.py
│   │   ├── projects.py
│   │   ├── aois.py
│   │   ├── monitoring.py
│   │   ├── events.py
│   │   └── exports.py
│   │
│   ├── models/
│   │   ├── user.py
│   │   ├── project.py
│   │   ├── aoi.py
│   │   ├── observation.py
│   │   ├── analysis_run.py
│   │   ├── event.py
│   │   └── alert.py
│   │
│   ├── schemas/
│   │
│   ├── services/
│   │   ├── satellite_service.py
│   │   ├── monitoring_service.py
│   │   ├── event_service.py
│   │   └── export_service.py
│   │
│   ├── workers/
│   │   ├── celery_app.py
│   │   ├── monitoring_tasks.py
│   │   └── processing_tasks.py
│   │
│   └── utils/
│
├── tests/
│
├── requirements.txt
│
└── Dockerfile
10. DATABASE ARCHITECTURE
The source documentation already defines the main entities: users, projects, AOIs, observations, analysis runs, change events, alerts and audit logs. 
ISRO_Satellite_Change_Detection…


We expand this slightly for implementation.

10.1 Users
SQL

users
Fields:


id UUID PRIMARY KEY

name VARCHAR

email VARCHAR UNIQUE

password_hash VARCHAR

role VARCHAR

is_active BOOLEAN

created_at TIMESTAMP

updated_at TIMESTAMP
10.2 Projects

projects
Fields:


id UUID

user_id UUID

name VARCHAR

description TEXT

active BOOLEAN

monitoring_frequency VARCHAR

created_at TIMESTAMP

updated_at TIMESTAMP
10.3 AOIs

aois
Fields:


id UUID

project_id UUID

name VARCHAR

geometry GEOMETRY(POLYGON, 4326)

area_sq_m DOUBLE PRECISION

buffer_meters INTEGER

active BOOLEAN

created_at TIMESTAMP
Important
PostGIS spatial index:

SQL

CREATE INDEX idx_aois_geometry
ON aois
USING GIST(geometry);
11. OBSERVATION DATABASE MODEL

observations
Fields:


id UUID

aoi_id UUID

source VARCHAR

satellite VARCHAR

scene_id VARCHAR

acquired_at TIMESTAMP

cloud_score FLOAT

coverage_percentage FLOAT

asset_reference TEXT

status VARCHAR

created_at TIMESTAMP
Status

DISCOVERED
DOWNLOADING
READY
REJECTED
FAILED
12. ANALYSIS RUN MODEL

analysis_runs
Fields:


id UUID

aoi_id UUID

baseline_observation_id UUID

recent_observation_id UUID

algorithm_version VARCHAR

status VARCHAR

started_at TIMESTAMP

completed_at TIMESTAMP

error_message TEXT
13. CHANGE EVENT MODEL

change_events
Fields:


id UUID

analysis_run_id UUID

geometry GEOMETRY

category VARCHAR

detection_confidence FLOAT

classification_confidence FLOAT

area_sq_m DOUBLE PRECISION

magnitude FLOAT

baseline_date TIMESTAMP

recent_date TIMESTAMP

status VARCHAR

created_at TIMESTAMP
Event Status

NEW

ACKNOWLEDGED

VERIFIED

DISMISSED
These review states are directly consistent with the original event/alert design. 
ISRO_Satellite_Change_Detection…


14. ALERT MODEL

alerts
Fields:


id UUID

event_id UUID

channel VARCHAR

recipient VARCHAR

status VARCHAR

sent_at TIMESTAMP

delivery_status VARCHAR

created_at TIMESTAMP
15. MONITORING CONFIGURATION

monitoring_configs
Fields:


id UUID

aoi_id UUID

frequency VARCHAR

minimum_change_area_sq_m FLOAT

change_threshold FLOAT

minimum_detection_confidence FLOAT

enabled_categories JSONB

alert_enabled BOOLEAN

created_at TIMESTAMP
16. PROCESSING PIPELINE
This is the heart of the project.

The source workflow specifies imagery discovery, quality filtering, preprocessing, baseline selection, change analysis, post-processing, event generation and alerting. 
ISRO_Satellite_Change_Detection…


Our technical pipeline:


1. Scheduler Trigger
        ↓
2. Find Active AOIs
        ↓
3. Search Satellite Catalog
        ↓
4. Filter Observations
        ↓
5. Select Baseline
        ↓
6. Select Recent Image
        ↓
7. Download Required Bands
        ↓
8. Clip to AOI
        ↓
9. Cloud / Shadow Mask
        ↓
10. Align Images
        ↓
11. Calculate Indices
        ↓
12. Change Detection
        ↓
13. Thresholding
        ↓
14. Noise Removal
        ↓
15. Connected Components
        ↓
16. Polygon Generation
        ↓
17. Area Calculation
        ↓
18. Classification
        ↓
19. Confidence Calculation
        ↓
20. Event Storage
        ↓
21. Alert Decision
        ↓
22. User Notification
17. SATELLITE DATA REQUIREMENTS
Recommended MVP Sources
Use open/publicly accessible satellite data sources.

Primary

Sentinel-2
Best suited for:

Vegetation

Water

Land change

Secondary

Landsat
Useful for:

Historical comparisons

Long-term analysis

18. SATELLITE DATA ABSTRACTION LAYER
Do not hardcode the processing system directly to one provider.

Create:


SatelliteProvider
Interface:

Python


Run
class SatelliteProvider:

    def search_observations(
        self,
        geometry,
        start_date,
        end_date
    ):
        pass

    def get_assets(
        self,
        observation_id
    ):
        pass

    def download_bands(
        self,
        observation_id,
        bands
    ):
        pass
Future providers can then be added without changing the processing engine.

19. IMAGE PREPROCESSING REQUIREMENTS
The source specifically requires clipping, cloud/shadow masking, invalid-pixel handling and preparation of comparable observations. 
ISRO_Satellite_Change_Detection…


Step 1 — AOI Clipping
Never process the full satellite image if unnecessary.


Satellite Image
      ↓
Clip to AOI
      ↓
Process only required region
Step 2 — Resolution Normalization
Ensure both images have:


Same CRS

Same Resolution

Same Grid Alignment
Step 3 — Cloud Masking
Create:


Valid Pixel Mask
Concept:


1 = Valid Pixel

0 = Cloud / Shadow / Invalid
All calculations must ignore invalid pixels.

20. VEGETATION INDEX CALCULATION
For MVP vegetation detection:


NDVI
Formula:


NDVI = (NIR - RED) / (NIR + RED)
Processing output:


NDVI Baseline
NDVI Recent
NDVI Difference
21. WATER INDEX
For water monitoring:


NDWI
Use the same processing architecture:


Baseline NDWI

Recent NDWI

Difference

Threshold

Change Region
22. CHANGE DETECTION ENGINE
The source supports image differencing, index differencing, change-vector approaches, thresholding and future ML models. 
ISRO_Satellite_Change_Detection…


Our MVP will prioritize explainable detection.

MVP Algorithm
Input

Baseline Image

Recent Image

AOI Geometry

Cloud Mask

Threshold
Process
Python


Run
difference = recent_ndvi - baseline_ndvi

change_mask = difference < vegetation_loss_threshold

valid_change = change_mask & valid_pixel_mask
23. NOISE REMOVAL
Raw pixel masks will contain noise.

Use:


Morphological Opening

Morphological Closing

Connected Components

Minimum Area Filter
Technology:


OpenCV

Rasterio

NumPy
24. POLYGON GENERATION
Convert:


Raster Change Mask
Into:


GeoJSON Polygon
Pipeline:


Binary Mask
      ↓
Connected Components
      ↓
Raster Vectorization
      ↓
Polygon Simplification
      ↓
Area Calculation
      ↓
PostGIS Storage
25. CHANGE CLASSIFICATION
Separate two concepts.

Detection Confidence

How confident are we that a real change happened?
Classification Confidence

How confident are we about what changed?
Example:


Detection Confidence: 0.94

Vegetation Loss Classification: 0.78
This avoids pretending the system knows more than it actually knows.

26. INITIAL CLASSIFICATION TYPES

VEGETATION_LOSS

WATER_EXPANSION

WATER_SHRINKAGE

BARE_SOIL_EXPANSION

BUILT_UP_CHANGE

FLOODING

UNKNOWN_SIGNIFICANT_CHANGE
The original documentation explicitly supports a category for meaningful changes where classification confidence is insufficient. 
ISRO_Satellite_Change_Detection…


27. CONFIDENCE ENGINE
Suggested scoring:


Detection Confidence =
(
Change Magnitude Score
+
Spatial Consistency Score
+
Image Quality Score
+
Persistence Score
) / 4
Example

Magnitude: 0.90

Spatial Consistency: 0.95

Image Quality: 0.80

Persistence: 0.85

Confidence:

(0.90 + 0.95 + 0.80 + 0.85) / 4

= 0.875
28. EVENT DEDUPLICATION
Very important technical requirement.

Without this:


Same Forest Change
        ↓
Weekly Scan
        ↓
New Alert
        ↓
New Alert
        ↓
New Alert
Terrible UX 😭

Use:


Spatial Intersection

+
Date Difference

+
Category Similarity
Logic:

Python


Run
if overlap_percentage > 70:
    if same_category:
        if recent_event_exists:
            update_existing_event()
29. HUMAN REVIEW LOOP
Users can mark:


VERIFIED

FALSE POSITIVE

UNKNOWN

NEEDS REVIEW
This feedback should be stored.

Future:


Human Review Data
        ↓
Training Dataset
        ↓
Improved ML Model
30. ASYNCHRONOUS PROCESSING
Heavy processing must never block the API request.

The original document explicitly requires asynchronous processing for multiple AOIs and long-running analysis jobs. 
ISRO_Satellite_Change_Detection…


Architecture

Frontend
   │
POST /monitor
   │
   ▼
FastAPI
   │
   ▼
Create Job
   │
   ▼
Redis Queue
   │
   ▼
Celery Worker
   │
   ▼
Satellite Processing
API response:

JSON

{
  "job_id": "uuid",
  "status": "QUEUED"
}
31. JOB STATUS

QUEUED

RUNNING

DOWNLOADING

PREPROCESSING

ANALYZING

GENERATING_EVENTS

COMPLETED

FAILED
32. SCHEDULER
Use:


Celery Beat
Monitoring example:


Every Day

Every Week

Every 15 Days

Manual Only
Flow:


Scheduler
   ↓
Find Active AOIs
   ↓
Check Frequency
   ↓
Create Jobs
   ↓
Queue Workers
33. REST API REQUIREMENTS
Authentication

POST /api/v1/auth/register

POST /api/v1/auth/login

GET /api/v1/auth/me
Projects

GET /api/v1/projects

POST /api/v1/projects

GET /api/v1/projects/{project_id}

PATCH /api/v1/projects/{project_id}

DELETE /api/v1/projects/{project_id}
AOIs

GET /api/v1/projects/{project_id}/aois

POST /api/v1/projects/{project_id}/aois

GET /api/v1/aois/{aoi_id}

PATCH /api/v1/aois/{aoi_id}

DELETE /api/v1/aois/{aoi_id}
Monitoring

POST /api/v1/aois/{aoi_id}/monitor

GET /api/v1/aois/{aoi_id}/observations

GET /api/v1/aois/{aoi_id}/analysis-runs
Events

GET /api/v1/events

GET /api/v1/events/{event_id}

POST /api/v1/events/{event_id}/review

GET /api/v1/events/{event_id}/evidence
Export

GET /api/v1/events/{event_id}/export/geojson
The underlying API categories are aligned with the original project's authentication, project, AOI, monitoring, event and export design. 
ISRO_Satellite_Change_Detection…


34. SAMPLE MONITORING REQUEST
JSON

{
  "comparison_mode": "latest_vs_baseline",
  "change_type": "vegetation_loss",
  "minimum_change_area_sq_m": 500,
  "threshold": -0.2
}
Response:

JSON

{
  "job_id": "c123-456",
  "status": "QUEUED",
  "message": "Monitoring analysis started"
}
35. EVENT API RESPONSE
JSON

{
  "event_id": "event_123",
  "category": "VEGETATION_LOSS",
  "detection_confidence": 0.87,
  "classification_confidence": 0.76,
  "affected_area_sq_m": 24000,
  "affected_area_hectares": 2.4,
  "baseline_date": "2026-07-01",
  "recent_date": "2026-08-20",
  "status": "NEW",
  "geometry": {}
}
36. FRONTEND TECHNICAL ARCHITECTURE

frontend/
│
├── src/
│
│   ├── app/
│
│   ├── pages/
│   │   ├── Login
│   │   ├── Dashboard
│   │   ├── Projects
│   │   ├── AOI
│   │   └── Events
│
│   ├── components/
│
│   ├── map/
│   │   ├── AOIDrawTool
│   │   ├── EventLayer
│   │   ├── BeforeAfter
│   │   └── MapControls
│
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── events.ts
│
│   ├── hooks/
│
│   └── types/
37. DASHBOARD REQUIREMENTS
Dashboard must display:


Total Projects

Active AOIs

Recent Events

Verified Events

Pending Review

Total Changed Area

Latest Processing Jobs
38. EVENT REVIEW SCREEN
Technical UI requirements:


┌────────────────────┐
│ BASELINE           │
│ Satellite Image    │
└────────────────────┘

          ↔

┌────────────────────┐
│ RECENT             │
│ Satellite Image    │
└────────────────────┘

          +

┌────────────────────┐
│ CHANGE OVERLAY     │
│ Polygon + Metadata │
└────────────────────┘
The source strongly emphasizes before/after imagery plus a clear change overlay as core evidence for review. 
ISRO_Satellite_Change_Detection…


39. OBJECT STORAGE
For a fully free self-hosted stack:


MinIO
Store:


Original Downloaded Rasters

Processed Rasters

Cloud Masks

NDVI Files

Change Masks

Preview Images

Event Thumbnails

GeoJSON Exports

Generated Reports
Database stores metadata and references, not huge raster files directly.

40. FILE STORAGE STRUCTURE

storage/

projects/
   project_id/

      aois/
         aoi_id/

            observations/
               observation_id/

            preprocessing/
               analysis_id/

            events/
               event_id/

                  before.png
                  after.png
                  change.png
                  event.geojson
41. SECURITY REQUIREMENTS
The source requires authentication, protection of private AOIs and credentials, and maintainable separation of responsibilities. 
ISRO_Satellite_Change_Detection…


Implementation:

Authentication

JWT Access Token
Password

Argon2 or bcrypt
Authorization
Every API must verify:


User
    ↓
Project Ownership
    ↓
AOI Ownership
    ↓
Event Ownership
42. ENVIRONMENT VARIABLES

APP_ENV=development

DATABASE_URL=

REDIS_URL=

JWT_SECRET=

MINIO_ENDPOINT=

MINIO_ACCESS_KEY=

MINIO_SECRET_KEY=

SATELLITE_PROVIDER=

LOG_LEVEL=
Never commit:


.env
43. LOGGING REQUIREMENTS
Use structured logs.

Example:

JSON

{
  "timestamp": "2026-08-31T12:00:00Z",
  "level": "INFO",
  "job_id": "123",
  "aoi_id": "456",
  "stage": "CHANGE_DETECTION",
  "message": "NDVI difference calculation completed"
}
44. ERROR HANDLING
Satellite Data Failure

Retry
      ↓
Alternative Observation
      ↓
Mark Job Failed
Cloudy Observation

Reject Observation

Search Next Available Scene
Processing Error

Log Error

Retry Job

Maximum Retry Count

Mark Failed
45. TESTING STRATEGY
The source calls for unit, integration, API, GIS, data-quality, false-positive, load and UI testing. 
ISRO_Satellite_Change_Detection…


Unit Tests

NDVI

NDWI

Threshold Logic

Area Calculation

Geometry Validation

Confidence Calculation
Integration Tests

Create AOI
      ↓
Create Job
      ↓
Worker Processing
      ↓
Event Creation
      ↓
Alert Creation
GIS Tests

Invalid Polygon

Self Intersecting Polygon

Very Small AOI

Large AOI

Coordinate Reference System
46. PERFORMANCE REQUIREMENTS
API
Target:


Normal API response < 500 ms
excluding heavy processing.

Processing
Processing should:


Clip AOI Early

Avoid Full Scene Processing

Reuse Cached Observation Metadata

Process Only Required Bands
47. MONITORING & HEALTH
Add endpoints:


GET /health

GET /ready
Health response:

JSON

{
  "api": "healthy",
  "database": "healthy",
  "redis": "healthy",
  "worker": "healthy"
}
48. DOCKER ARCHITECTURE

docker-compose.yml
Services:

YAML

frontend
backend
worker
scheduler
postgres
redis
minio
nginx
Complete system:


Docker Compose Up
       ↓
Entire Platform Starts
This keeps the prototype reproducible, which is also consistent with the source's container-based deployment strategy. 
ISRO_Satellite_Change_Detection…


49. OPTIONAL AI/ML MODULE
Do not make ML mandatory for MVP.

Architecture:


Rule Based Detection
        ↓
Generate Dataset
        ↓
Human Verification
        ↓
Training Data
        ↓
ML Classification
Possible models later:


Random Forest

XGBoost-like alternative if added

U-Net

Segmentation CNN

Transformer-based remote sensing model
But MVP:


NDVI / NDWI
+
Threshold
+
Spatial Processing
+
Confidence Rules
The source explicitly recommends an explainable baseline before moving to advanced ML. 
ISRO_Satellite_Change_Detection…


50. X402 / ALGOKIT PAYMENT ARCHITECTURE
This should remain an optional premium module, not a dependency for the core monitoring system.

The source's Appendix C describes x402 as an HTTP 402 micropayment flow where a client receives a payment challenge, signs the transaction through a wallet, retries the request with payment data, and receives the premium resource after facilitator verification.

Architecture

React Dashboard
      │
      │ Premium Request
      ▼
Payment Gateway
      │
      │ HTTP 402
      ▼
Wallet
      │
      │ Sign Payment
      ▼
Retry Request
      │
      ▼
Premium API
      │
      ▼
Satellite Processing
51. PAYMENT MODULE STRUCTURE

payment-service/

├── middleware/
│
├── x402/
│
├── wallet/
│
├── facilitator/
│
└── routes/
52. PREMIUM FEATURES
Potential premium endpoints:


Priority AOI Processing

High Frequency Monitoring

Bulk GeoJSON Export

Premium API Access

Advanced Reports
The source specifically frames priority AOI processing, higher-frequency polling and paid API access as premium use cases. 
ISRO_Satellite_Change_Detection…


53. PAYMENT DATABASE
Add:


payments
Fields:


id

user_id

wallet_address

resource

amount

currency

network

transaction_hash

status

created_at

settled_at
Status:


PENDING

SIGNED

VERIFYING

SETTLED

FAILED
54. FULL SYSTEM DATA FLOW

USER
 │
 ▼
DRAW AOI
 │
 ▼
FASTAPI
 │
 ▼
POSTGIS
 │
 ▼
SCHEDULER
 │
 ▼
REDIS QUEUE
 │
 ▼
CELERY WORKER
 │
 ▼
SATELLITE DISCOVERY
 │
 ▼
QUALITY FILTER
 │
 ▼
PREPROCESSING
 │
 ▼
INDEX CALCULATION
 │
 ▼
CHANGE DETECTION
 │
 ▼
POST PROCESSING
 │
 ▼
POLYGON GENERATION
 │
 ▼
POSTGIS EVENT
 │
 ▼
ALERT ENGINE
 │
 ▼
DASHBOARD
 │
 ├───────────────┐
 ▼               ▼
MAP             EXPORT
55. RECOMMENDED MVP IMPLEMENTATION ORDER
Week / Phase 1

Project Setup

Docker

PostgreSQL

PostGIS

FastAPI

React
Phase 2

Authentication

Projects

AOI Drawing

AOI Storage
Phase 3

Satellite Data Discovery

Observation Storage

Manual Processing Trigger
Phase 4

Raster Processing

NDVI

Cloud Filtering

Change Detection
Phase 5

Polygon Generation

Event Creation

Dashboard Visualization
Phase 6

Alerts

GeoJSON Export

Event Review
Phase 7

Celery

Redis

Automatic Monitoring
Phase 8

Advanced Classification

Payment Layer

Performance Optimization
56. MVP DEFINITION OF DONE
The MVP is complete when:


✓ User can register

✓ User can login

✓ User can create project

✓ User can draw AOI

✓ AOI is stored in PostGIS

✓ System can find two valid observations

✓ Imagery can be processed

✓ Cloud pixels are excluded

✓ NDVI difference is calculated

✓ Change mask is generated

✓ Noise is removed

✓ Change polygons are created

✓ Area is calculated

✓ Event is stored

✓ Event appears on map

✓ Before/after can be viewed

✓ Event can be verified/dismissed

✓ GeoJSON can be exported
This preserves the source document's recommended complete pipeline-first philosophy: AOI → clean imagery → detection → event → map → alert → export. 
ISRO_Satellite_Change_Detection…


57. FINAL RECOMMENDED FREE STACK
My Final Choice for Your Project

FRONTEND
React + TypeScript + Vite

MAP
Leaflet + React Leaflet + Turf.js

BACKEND
Python + FastAPI

DATABASE
PostgreSQL + PostGIS

QUEUE
Redis + Celery

SCHEDULER
Celery Beat

SATELLITE PROCESSING
Rasterio + GDAL + NumPy + OpenCV

GIS
GeoPandas + Shapely

STORAGE
MinIO

AUTH
JWT + Argon2

TESTING
Pytest + Vitest + Playwright

DEPLOYMENT
Docker + Docker Compose + Nginx

AI
scikit-learn initially
PyTorch later

PAYMENTS
Optional AlgoKit + x402
FINAL ARCHITECTURE DECISION
Bhai, meri strongest recommendation ye hai:

MVP mein architecture ko unnecessarily microservices jungle mat banana.

Use this:


1 Frontend

1 FastAPI Backend

1 Processing Worker

1 Scheduler

1 PostgreSQL/PostGIS

1 Redis

1 MinIO
All running through: