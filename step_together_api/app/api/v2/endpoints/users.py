from fastapi import APIRouter
from app.crud.user import get_all_users
from app.schemas.user import UserOut

router = APIRouter()

@router.get("/", tags=["Users V2"])
def list_users_v2():
    users = get_all_users()
    return {"users": [UserOut.from_orm(user) for user in users]}
