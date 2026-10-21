from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
from app.models import User, Alert, MonitoringLog, MonitoringSession
from app.config import UPLOAD_DIR
from app.ai.detector import detector

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables (empty database — zero seeded data)
    Base.metadata.create_all(bind=engine)
    print("[Startup] Database tables created (empty — zero fake/seeded data)")
    print(f"[Startup] Detector capability: {detector.get_model_info()}")
    from app.services.sms_service import sms_service
    sms_service.log_startup_diagnostics()
    yield

app = FastAPI(
    title="IdleAlert: Smart Classroom Monitoring System",
    version="2.0.0",
    lifespan=lifespan
)

# CORS - explicitly allow local frontend origins and pattern matching for all local dev ports
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads & annotated videos
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Import and register routers
from app.api import auth, classrooms, monitoring, analysis, alerts, analytics

app.include_router(auth.router)
app.include_router(classrooms.router)
app.include_router(monitoring.router)
app.include_router(analysis.router)
app.include_router(alerts.router)
app.include_router(analytics.router)

@app.get("/")
def root():
    return {"status": "online", "system": "IdleAlert Monitoring System"}

@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "IdleAlert Backend"}

@app.get("/api/model-info")
def model_info():
    return detector.get_model_info()

@app.get("/api/model-diagnostics")
def model_diagnostics():
    """Diagnostic check returning full inspection data for Part 1 & Part 10."""
    info = detector.get_model_info()
    return {
        "model_path": info["model_path"],
        "model_loaded": info["model_loaded"],
        "device": info["device"],
        "num_classes": info["num_classes"],
        "class_names": detector.raw_class_names,
        "has_fan_classes": info["has_fan_classes"],
        "has_light_classes": info["has_light_classes"],
        "limitation_message": info["limitation_message"]
    }
