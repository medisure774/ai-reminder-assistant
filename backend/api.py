from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import logging
import contextlib
import os
from datetime import datetime

# Relative imports from the database package
from database import db
from parser import parser
from scheduler import scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api")

class ChatRequest(BaseModel):
    message: str
    preview: Optional[bool] = False
    local_time: Optional[str] = None

class ChatResponse(BaseModel):
    type: str # 'reminder_created', 'text', 'error', 'preview'
    message: str
    data: Optional[dict] = None

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start scheduler and load jobs
    logger.info("📦 Backend initializing...")
    scheduler.start()
    scheduler.load_jobs_from_db()
    logger.info("✅ Startup complete. System ready.")
    yield
    # Shutdown logic if needed
    logger.info("🛑 Backend shutting down.")

app = FastAPI(title="AI BUDDY API", lifespan=lifespan)

# CORS: Production Ready
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For MVP, allow all; change to your Vercel URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "online", "branding": "AI BUDDY", "message": "Backend is active."}

@app.get("/health")
def health():
    """Lightweight endpoint for uptime checks."""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    user_text = req.message.lower().strip()
    
    # Check for silencers
    if user_text in ['done', 'ok', 'stop', 'thanks', 'thank you', 'okay']:
        db.mark_all_notifications_read()
        return ChatResponse(type="text", message="👍 Notifications silenced.")

    result = parser.parse(req.message, req.local_time)
    if 'error' in result:
        return ChatResponse(type="error", message=result['error'])
    
    # Calculate target time for server (Render is UTC)
    # If we have local_time, result['run_time'] is relative to that.
    target_time = result['run_time']
    if req.local_time:
        try:
            # Parse user_now as ISO (it's formatted as sv/ISO on frontend now)
            user_now = datetime.fromisoformat(req.local_time)
            
            # Both must be naive for delta
            user_now_naive = user_now.replace(tzinfo=None)
            target_time_naive = target_time.replace(tzinfo=None)
            
            delta = target_time_naive - user_now_naive
            
            # Application time on server
            target_time = datetime.now() + delta
            logger.info(f"Time Sync: UserNow={user_now_naive}, Target={target_time_naive}, Delta={delta}, ServerSchedule={target_time}")
        except Exception as e:
            logger.error(f"Time conversion error: {e}")
            # Fallback to naive target_time
            # If an error occurs, target_time remains result['run_time']
    # If in preview mode, don't save to DB yet
    if req.preview:
        pretty_time = result['run_time'].strftime("%I:%M %p")
        return ChatResponse(
            type="preview",
            message=f"Should I set a reminder for {result['task']} at {pretty_time}?",
            data={
                "task": result['task'],
                "run_time": result['run_time'].isoformat(),
                "repeat_type": result['repeat_type'],
                "is_vague": result['is_vague'],
                "matched_string": result['matched_string']
            }
        )
    
    try:
        r_id = db.add_reminder(result['task'], target_time, result['repeat_type'])
        scheduler.schedule_reminder(r_id, result['task'], target_time, result['repeat_type'])
        
        return ChatResponse(
            type="reminder_created",
            message=f"I've set a reminder for {result['task']}.",
            data={
                "id": r_id,
                "task": result['task'],
                "pretty_time": result['run_time'].strftime("%I:%M %p, %b %d")
            }
        )
    except Exception as e:
        logger.error(f"API Error: {e}")
        return ChatResponse(type="error", message="Failed to process reminder.")

@app.get("/reminders")
def list_reminders():
    return db.get_active_reminders()

@app.delete("/reminders/{r_id}")
def delete_reminder(r_id: int):
    db.delete_reminder(r_id)
    scheduler.cancel_job(r_id)
    return {"status": "deleted"}

@app.get("/notifications")
def get_notifs():
    return db.get_unread_notifications()

@app.post("/notifications/{n_id}/read")
def read_notif(n_id: int):
    db.mark_notification_read(n_id)
    logger.info(f"Notification {n_id} marked as read.")
    return {"status": "read"}

@app.post("/reminders/{r_id}/complete")
def complete_reminder(r_id: int):
    db.complete_reminder(r_id)
    scheduler.cancel_job(r_id)
    return {"status": "completed"}

@app.post("/reminders/{r_id}/snooze")
def snooze_reminder(r_id: int, minutes: int = 10):
    # Calculate snooze time
    from datetime import timedelta
    snooze_until = datetime.now() + timedelta(minutes=minutes)
    
    # Update DB
    db.snooze_reminder(r_id, snooze_until)
    
    # Get current reminder info to re-schedule
    reminders = db.get_active_reminders() # This might be inefficient, but works for MVP
    r = next((x for x in reminders if x['id'] == r_id), None)
    
    if r:
        scheduler.schedule_reminder(r_id, r['task'], snooze_until, 'once') # Snooze is always a 'once' trigger
        return {"status": "snoozed", "until": snooze_until.isoformat()}
    
    return {"status": "error", "message": "Reminder not found"}
