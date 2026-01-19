from apscheduler.schedulers.background import BackgroundScheduler
from datetime import date
from sqlalchemy.orm import Session
from app.models import Session as SessionModel, Notification
from app.email import send_email

def send_due_notifications(db: Session):
    today = date.today()
    due = db.query(SessionModel).filter(SessionModel.scheduled_for == today, SessionModel.status == "scheduled").all()
    for s in due:
        # find user email via topic->user
        user = s.topic.user
        if user and user.email:
            send_email(to=user.email, subject="Study Reminder", body=f"Your session (Day {s.day_index}) for '{s.topic.title}' is due today.")
            from datetime import datetime, timezone
            n = Notification(
                user_id=user.id, 
                topic_id=s.topic_id, 
                session_id=s.id, 
                method="email",
                sent_at=datetime.now(timezone.utc)
            )
            db.add(n)
    db.commit()

def start_scheduler():
    sched = BackgroundScheduler()
    # run daily at 8 AM server time
    sched.add_job(lambda: _run_job(), "cron", hour=8, minute=0)
    sched.start()

def _run_job():
    from app.db import SessionLocal
    db = SessionLocal()
    try:
        send_due_notifications(db)
    finally:
        db.close()