# File: app/main.py
from fastapi import FastAPI
from app.core.config import settings
from app.api.v1.endpoints import auth
from app.api.v1 import router as v1_router  # This is safe now

app = FastAPI()

app.include_router(v1_router.router, prefix=settings.API_V1_STR, tags=["v1"])
