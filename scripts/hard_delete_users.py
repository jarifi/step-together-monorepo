import sys
import os
from datetime import datetime, timedelta

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.session import SessionLocal
from app.models.user import User 

def perform_hard_delete():
    db = SessionLocal()
    try:
        threshold_date = datetime.now() - timedelta(minutes=10)

        expired_users = db.query(User).filter(
            User.is_deleted == True,
            User.updated_at < threshold_date
        ).all()

        if expired_users:
            user_count = len(expired_users)
            for user in expired_users:
                db.delete(user) 
            
            db.commit()
            print(f"[{datetime.now()}] SUCCESS: {user_count} User und alle zugehörigen Daten gelöscht.")
        else:
            print(f"[{datetime.now()}] INFO: Keine abgelaufenen User gefunden.")

    except Exception as e:
        db.rollback()
        print(f"[{datetime.now()}] ERROR: {str(e)}")

    finally:
        db.close()

if __name__ == "__main__":
    perform_hard_delete()