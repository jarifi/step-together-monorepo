# File: app/api/v1/router.py
from fastapi import APIRouter
from app.api.v1.endpoints import challenge_progress_endpoint, team_members_endpoint, auth, users_endpoint, challenges_endpoint, teams_endpoint, step_logs_endpoint, tickets_endpoint  # Import your routers here

router = APIRouter()

# Register routers
router.include_router(users_endpoint.router, prefix="/users", tags=["users"])
router.include_router(teams_endpoint.router, prefix="/teams", tags=["teams"])
router.include_router(team_members_endpoint.router, prefix="/team_members", tags=["team_members"])
router.include_router(challenges_endpoint.router, prefix="/challenges", tags=["challenges"])
router.include_router(challenge_progress_endpoint.router, prefix="/challenge_progress", tags=["challenge_progress"])
router.include_router(step_logs_endpoint.router, prefix="/step_logs", tags=["step_logs"])
router.include_router(tickets_endpoint.router, prefix="/tickets", tags=["tickets"])
router.include_router(auth.router, prefix="/auth", tags=["auth"])
