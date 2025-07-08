from sqlalchemy import Column, Integer, DateTime, ForeignKey
from app.db.base import Base

class StepLog(Base):
    __tablename__ = "step_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    challenge_id = Column(Integer, ForeignKey("challenges.id"))
    team_id = Column(Integer, ForeignKey("teams.id"))
    date = Column(DateTime, nullable=False)
    number_of_steps = Column(Integer, nullable=False)
    
# from sqlalchemy import Column, Integer, DateTime, ForeignKey
# from datetime import datetime
# from app.database import Base

# class StepLog(Base):
#     __tablename__ = "step_logs"

#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("users.id"), nullable=False)        # Added ForeignKey
#     challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False) # Added ForeignKey
#     team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)        # Added ForeignKey
#     date = Column(DateTime, default=datetime.utcnow)
#     number_of_steps = Column(Integer, nullable=False)