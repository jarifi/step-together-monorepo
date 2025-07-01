# File: app/main.py
from fastapi import FastAPI
from app.api.v1 import router as v1_router  # This is safe now

app = FastAPI()

app.include_router(v1_router.router, prefix="/api/v1")
