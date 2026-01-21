from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
import contextlib
import os
from datetime import datetime, timedelta, date

# Relative imports
from database import db
from parser import parser
from scheduler import scheduler, KOLKATA

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api")

# --- Pydantic Models ---
# ... (unchanged) ...

# ...

# --- Task Management ---

@app.post("/tasks", response_model=ChatResponse)
def create_task(task_data: TaskCreate):
    """Direct task creation endpoint (used by UI confirmation or manual add)"""
    try:
        # Parse ISO string to datetime
        try:
            # Incoming is UTC (from frontend new Date().toISOString())
            utc_dt = datetime.fromisoformat(task_data.run_time.replace('Z', '+00:00'))
            
            # Convert to configured timezone (Kolkata) or system local
            if KOLKATA:
                dt = utc_dt.astimezone(KOLKATA)
            else:
                dt = utc_dt.astimezone()

            # For DB, we store naive string (local time representation)
            # If dt is aware, strftime('%Y-%m-%d %H:%M:%S') creates the correct naive local string
            
        except ValueError:
            # Fallback for simple formats if ISO fails
            dt = datetime.strptime(task_data.run_time, "%Y-%m-%d %H:%M:%S")
            if KOLKATA:
                dt = KOLKATA.localize(dt)

        # For the DB, we pass the datetime object. 
        # The DB adapter converts it. If it's aware, it might format it with offset depending on logic.
        # But our DB code manually formatted it using .strftime('%Y...').
        # So passing 'dt' (aware) -> strftime (naive-looking string of local time) is correct.
        
        r_id = db.add_reminder(
            task=task_data.task,
            run_time=dt,
            repeat_type=task_data.repeat_type,
            description=task_data.description,
            priority=task_data.priority
        )
        # Scheduler handles aware datetimes correctly now
        scheduler.schedule_reminder(r_id, task_data.task, dt, task_data.repeat_type)
        
        return ChatResponse(
            type="reminder_created",
            message=f"Reminder set for {task_data.task}.",
            data={"id": r_id}
        )
    except Exception as e:
        logger.error(f"Create Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tasks/timeline")
def get_timeline():
    """Returns tasks grouped by Past, Today, Upcoming"""
    all_reminders = db.get_active_reminders()
    overdue = db.get_overdue_reminders()
    
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    past = []
    today = []
    upcoming = []
    
    # Process Overdue (from DB method which already filters run_time < now)
    for r in overdue:
         r['group'] = 'past'
         past.append(r)

    # Process Active/Snoozed
    for r in all_reminders:
        # DB active reminders are sorted by time.
        # We need to filter out ones that are already in 'overdue' list if overlaps exist?
        # Actually proper logic:
        # Past = Status Active AND Time < Now (handled by get_overdue_reminders)
        # Today = Time >= Now AND Time < Tomorrow
        # Upcoming = Time >= Tomorrow
        
        rt_str = r['run_time']
        if isinstance(rt_str, str):
            rt = datetime.strptime(rt_str.split('.')[0], '%Y-%m-%d %H:%M:%S')
        else:
            rt = rt_str
            
        if rt < now:
            # Should have been caught by overdue, but specific status check might differ
            # If status is 'snoozed', it might be in future
            continue
            
        if rt < today_end:
            r['group'] = 'today'
            today.append(r)
        else:
            r['group'] = 'upcoming'
            upcoming.append(r)

    return {
        "past": past,
        "today": today,
        "upcoming": upcoming
    }

@app.get("/tasks/calendar")
def get_calendar(month: int = Query(...), year: int = Query(...)):
    """Returns tasks for a specific month"""
    try:
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month + 1, 1)
            
        # Convert to strings for DB query
        start_str = start_date.strftime("%Y-%m-%d 00:00:00")
        end_str = end_date.strftime("%Y-%m-%d 00:00:00")
        
        tasks = db.get_reminders_by_date_range(start_str, end_str)
        return tasks
    except Exception as e:
        logger.error(f"Calendar Error: {e}")
        return []

@app.put("/tasks/{id}")
def update_task(id: int, update: TaskUpdate):
    data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    # consistency check for run_time
    if 'run_time' in data:
         try:
            utc_dt = datetime.fromisoformat(data['run_time'].replace('Z', '+00:00'))
            # Convert to local time
            if KOLKATA:
                dt = utc_dt.astimezone(KOLKATA)
            else:
                dt = utc_dt.astimezone()
            
            # Format to naive string for DB update
            data['run_time'] = dt.strftime('%Y-%m-%d %H:%M:%S')
         except:
            pass
            
    success = db.update_reminder(id, data)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # If time changed, reschedule
    if 'run_time' in data or 'task' in data or 'status' in data:
         # simplified reschedule: reload job if active
         reminders = db.get_active_reminders()
         r = next((x for x in reminders if x['id'] == id), None)
         if r:
             dt = datetime.strptime(r['run_time'], '%Y-%m-%d %H:%M:%S')
             if KOLKATA:
                 dt = KOLKATA.localize(dt)
                 
             scheduler.schedule_reminder(id, r['task'], dt, r['repeat_type'])
         else:
             scheduler.cancel_job(id)
             
    return {"status": "updated"}

@app.post("/tasks/{id}/complete")
def complete_task(id: int):
    # Logic similar to old endpoint but cleaner
    reminders = db.get_active_reminders()
    r = next((x for x in reminders if x['id'] == id), None)
    
    if not r:
        # Check if it was overdue
        overdue = db.get_overdue_reminders()
        r = next((x for x in overdue if x['id'] == id), None)

    if not r:
        return {"status": "error", "message": "Reminder not found"}

    if r['repeat_type'] == 'once':
        db.complete_reminder(id)
        scheduler.cancel_job(id)
        return {"status": "completed"}
    else:
        # Recurring logic
        rt = r['run_time']
        if isinstance(rt, str):
            rt = datetime.strptime(rt.split('.')[0], '%Y-%m-%d %H:%M:%S')
        
        next_run = rt
        if r['repeat_type'] == 'daily':
            next_run = rt + timedelta(days=1)
        elif r['repeat_type'] == 'weekly':
            next_run = rt + timedelta(weeks=1)
            
        # If next run is still in past (e.g. missed multiple days), push to future?
        # For simplicity, just add interval.
        if next_run < datetime.now():
            next_run = datetime.now() + timedelta(minutes=1) # basic fallback
            
        db.update_reminder_time(id, next_run)
        scheduler.schedule_reminder(id, r['task'], next_run, r['repeat_type'])
        return {"status": "next_scheduled", "next_run": next_run.isoformat()}

@app.post("/tasks/{id}/snooze")
def snooze_task(id: int, minutes: int = 10):
    snooze_until = datetime.now() + timedelta(minutes=minutes)
    db.snooze_reminder(id, snooze_until)
    
    # Reschedule
    # Need to fetch task info, might not be in active if it was overdue
    # Just force schedule a once-off job
    # We can query specific reminder but DB class doesn't have get_one yet.
    # Hack: use get_active or get_overdue
    all_r = db.get_active_reminders() + db.get_overdue_reminders()
    r = next((x for x in all_r if x['id'] == id), None)
    if r:
        scheduler.schedule_reminder(id, r['task'], snooze_until, 'once')
        return {"status": "snoozed", "until": snooze_until.isoformat()}
        
    return {"status": "error", "message": "Task not found"}

@app.delete("/tasks/{id}")
def delete_task(id: int):
    db.delete_reminder(id)
    scheduler.cancel_job(id)
    return {"status": "deleted"}

# --- Notifications ---

@app.get("/notifications")
def get_notifs():
    return db.get_unread_notifications()

@app.post("/notifications/{id}/read")
def read_notif(id: int):
    db.mark_notification_read(id)
    return {"status": "read"}
