# File: app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.endpoints import auth
from app.api.v1 import router as v1_router  # This is safe now
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Start CORS configuration: set BACKEND_CORS_ORIGINS in app.core.config (list or comma-separated string)
origins = getattr(settings, "BACKEND_CORS_ORIGINS", ["*"])
if isinstance(origins, str):
    origins = [o.strip() for o in origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# End CORS configuration
app.include_router(v1_router.router, prefix=settings.API_V1_STR, tags=["v1"])

app.mount(
    "/media",
    StaticFiles(directory="app/media"),
    name="media"
)
