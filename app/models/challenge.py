from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Enum, case, func
from sqlalchemy.ext.hybrid import hybrid_property
from datetime import datetime, timezone
from app.db.base import Base


class Challenge(Base):
    __tablename__ = "challenges"

    MODE_TEAM = "team"
    MODE_INDIVIDUAL = "individual"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    start_location = Column(String(255), nullable=False)
    target_location = Column(String(255), nullable=False)
    distance = Column(Float, nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    creator_id = Column(Integer)
    team_id = Column(Integer)
    mode = Column(
        Enum(MODE_TEAM, MODE_INDIVIDUAL, name="challenge_mode", native_enum=False),
        nullable=False,
        default=MODE_TEAM,
    )
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    is_deleted = Column(Boolean, default=False)

    # ----------------------------
    # Computed (internal) state
    # ----------------------------
    @staticmethod
    def _ensure_utc(dt: datetime) -> datetime:
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)

    @hybrid_property
    def computed_state(self) -> str:
        now = datetime.now(timezone.utc)
        start_date = self._ensure_utc(self.start_date)
        end_date = self._ensure_utc(self.end_date)
        if now < start_date:
            return "incoming"
        elif now > end_date:
            return "closed"
        return "open"

    @computed_state.expression
    def computed_state(cls):
        return case(
            (cls.start_date > func.now(), "incoming"),
            (cls.end_date < func.now(), "closed"),
            else_="open",
        )

    # ----------------------------
    # API-facing alias (READ ONLY)
    # ----------------------------
    @property
    def state(self) -> str:
        return self.computed_state
