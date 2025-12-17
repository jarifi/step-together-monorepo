from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, case, func
from sqlalchemy.ext.hybrid import hybrid_property
from datetime import datetime
from app.db.base import Base


class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    start_location = Column(String(255), nullable=False)
    target_location = Column(String(255), nullable=False)
    distance = Column(Float, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    creator_id = Column(Integer)
    team_id = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_deleted = Column(Boolean, default=False)

    # ----------------------------
    # Computed (internal) state
    # ----------------------------
    @hybrid_property
    def computed_state(self) -> str:
        now = datetime.utcnow()
        if now < self.start_date:
            return "incoming"
        elif now > self.end_date:
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
