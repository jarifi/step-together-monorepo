import os
import uuid
import io
from typing import List, Annotated

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from PIL import Image

from app.db.session import get_db
from app.core.security import get_current_user
from app.crud import user as user_crud
from app.schema.user import UserCreate, UserResponse, CurrentUser, UserUpdate
from app.models.user import User
from app.crud.team import get_team_by_user_id
from app.crud.challenge import get_active_challenge
from app.crud.step_log import get_steps_for_current_week
from app.crud.user import get_user
from app.schema.HomeInitResponse import UserDashboardResponse
from app.logfile import user_logger

router = APIRouter(tags=["users"])

BASE_MEDIA_PATH = "app/media/profile_pictures"
ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]


@router.get("/", response_model=List[UserResponse], dependencies=[Depends(get_current_user)])
def read_users(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of records to return"),
    db: Session = Depends(get_db)
):
    """
    Retrieve a list of all users.
    Requires authentication.
    Expected path: /api/v1/users/
    """
    return user_crud.get_all_users(db, skip=skip, limit=limit)


@router.get("/search", response_model=List[UserResponse], dependencies=[Depends(get_current_user)])
def search_users(
    q: str = Query(..., min_length=1, description="Search term for user name or email"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=100, description="Maximum number of records to return"),
    db: Session = Depends(get_db)
):
    """
    Search users by name or email.
    Requires authentication.
    Expected path: /api/v1/users/search?q=searchterm
    """
    return user_crud.search_users(db, search_term=q, skip=skip, limit=limit)


@router.get("/me", response_model=CurrentUser)
def read_users_me(current_user: Annotated[User, Depends(get_current_user)]):
    """
    Retrieve information about the current authenticated user.
    Expected path: /api/v1/users/me
    """
    return current_user


@router.get("/{user_id}", response_model=UserResponse, dependencies=[Depends(get_current_user)])
def read_user(user_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single user by their ID.
    Requires authentication.
    Expected path: /api/v1/users/{user_id}
    """
    db_user = user_crud.get_user(db, user_id)
    if not db_user:
        user_logger.warning(
            f"USER READ FAILED | user_id={user_id}"
        )
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_new_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user.
    Expected path: /api/v1/users/
    """

    created_user = user_crud.create_user(db, user)

    user_logger.info(
        f"USER CREATED | user_id={created_user.id}"
    )

    return created_user


@router.put("/{user_id}", response_model=UserResponse)
def update_existing_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    Update an existing user's information.
    - Regular users: can update ONLY their own profile
    - Admins: can update ANY user
    """

    # Check permission
    if current_user.role != "admin" and current_user.id != user_id:
        user_logger.warning(
            f"USER UPDATE FORBIDDEN | target_user_id={user_id} | attempted_by={current_user.id}"
        )

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user's profile"
        )

    # Update user
    updated_user = user_crud.update_user(db, user_id, user_data)
    if not updated_user:
        user_logger.warning(
            f"USER UPDATE FAILED | user_id={user_id} | reason=not_found"
        )
        raise HTTPException(status_code=404, detail="User not found")
    
    user_logger.info(
        f"USER UPDATED | target_user_id={user_id} | updated_by={current_user.id} | changes={user_data.model_dump(exclude_unset=True)}"
    )

    return updated_user



@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
def delete_existing_user(
    user_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    Delete a user account.
    Requires authentication. Only the user themselves can delete their account.
    Expected path: /api/v1/users/{user_id}
    """
    # if current_user.id != user_id:
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this user's account")
    success = user_crud.delete_user(db, user_id)
    if not success:
        user_logger.warning(
            f"USER DELETE FAILED | user_id={user_id} | attempted_by={current_user.id}"
        )
        raise HTTPException(status_code=404, detail="User not found")
    
    user_logger.info(
        f"USER DELETED | user_id={user_id} | deleted_by={current_user.id}"
    )

    return {"deleted": True}

@router.get("/user/dashboard/init", response_model=UserDashboardResponse)
def init_dashboard_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = get_user(db, current_user.id)
    team = get_team_by_user_id(db, user.id)
    challenge = get_active_challenge(db, team.id) if team else None

    steps_this_week = (
        get_steps_for_current_week(db, user.id, challenge.id)
        if user and challenge else []
    )

    return UserDashboardResponse(
        user=user,
        team=team,
        challenge=challenge,
        steps_this_week=steps_this_week
    )


@router.post("/me/profile-picture")
async def upload_profile_picture(
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Invalid image type")

    user_folder = f"user_{current_user.id}"
    user_path = os.path.join(BASE_MEDIA_PATH, user_folder)
    os.makedirs(user_path, exist_ok=True)

    filename = f"profile_{uuid.uuid4().hex}.webp"
    file_path = os.path.join(user_path, filename)

    content = await file.read()

    if file.content_type == "image/webp":
        with open(file_path, "wb") as f:
            f.write(content)
    else:
        image = Image.open(io.BytesIO(content)).convert("RGBA")
        image.save(file_path, "WEBP", quality=85, method=6)

    public_path = f"/media/profile_pictures/{user_folder}/{filename}"

    current_user.avatar_url = public_path
    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return {"path": public_path, "avatarUrl": public_path}
