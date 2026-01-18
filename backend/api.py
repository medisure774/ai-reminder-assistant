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
    scheduler.start()
    scheduler.load_jobs_from_db()
    yield
    # Shutdown logic if needed

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
def health():
    return {"status": "online", "branding": "Medisure Plus"}

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
            # Parse user_now as ISO
            user_now = datetime.fromisoformat(req.local_time.replace('Z', '+00:00'))
            # server_now = datetime.now(user_now.tzinfo) # This line is not used
            delta = target_time - user_now.replace(tzinfo=target_time.tzinfo) # Both naive or both aware
            # If naive, make both naive for calculation
            if target_time.tzinfo is None:
                user_now_naive = user_now.replace(tzinfo=None)
                delta = target_time - user_now_naive
            
            # Application time on server
            target_time = datetime.now() + delta
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
                "repeat_type": result['repeat_type']
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
