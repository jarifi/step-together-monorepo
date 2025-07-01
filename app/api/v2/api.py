from fastapi import APIRouter
from app.api.v2.endpoints import users

api_router = APIRouter()
api_router.include_router(users.router, prefix="/users")
