import os
import urllib.request
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.date import DateTrigger
from apscheduler.triggers.cron import CronTrigger
import logging
from datetime import datetime
from database import db

logger = logging.getLogger(__name__)

class SchedulerManager:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.is_running = False
        self.app_url = os.getenv("APP_URL")

    def start(self):
        if not self.is_running:
            self.scheduler.start()
            self.is_running = True
            logger.info("🚀 Scheduler started.")
            self.schedule_self_ping()

    def schedule_self_ping(self):
        if not self.app_url:
            logger.warning("⚠️  APP_URL environment variable not set. Self-ping job skipped.")
            return

        self.scheduler.add_job(
            self._self_ping_callback,
            trigger=IntervalTrigger(minutes=10),
            id="self_ping_job",
            replace_existing=True
        )
        logger.info(f"📡 Self-ping scheduled to {self.app_url} every 10 minutes.")

    def _self_ping_callback(self):
        health_url = f"{self.app_url.rstrip('/')}/health"
        try:
            # Simple GET request using standard library
            with urllib.request.urlopen(health_url, timeout=10) as response:
                if response.status == 200:
                    logger.info("💓 Self-ping success.")
                else:
                    logger.warning(f"❗ Self-ping status code: {response.status}")
        except Exception as e:
            logger.warning(f"❌ Self-ping failed: {e}")

    def schedule_reminder(self, reminder_id, task, run_time, repeat_type):
        job_id = f"reminder_{reminder_id}"
        
        trigger = None
        if repeat_type == 'daily':
            trigger = CronTrigger(hour=run_time.hour, minute=run_time.minute, second=run_time.second)
        elif repeat_type == 'weekly':
            trigger = CronTrigger(day_of_week=run_time.weekday(), hour=run_time.hour, minute=run_time.minute, second=run_time.second)
        else:
            trigger = DateTrigger(run_date=run_time)

        if self.scheduler.get_job(job_id):
             self.scheduler.remove_job(job_id)

        self.scheduler.add_job(
            self._job_callback,
            trigger=trigger,
            id=job_id,
            args=[reminder_id, task, repeat_type],
            replace_existing=True,
            misfire_grace_time=60 # Give it a minute to catch up
        )
        logger.info(f"Scheduled task '{task}' for {run_time} ({repeat_type})")

    def _job_callback(self, reminder_id, task, repeat_type):
        logger.info(f"🔔 TRIGGERED: {task}")
        db.add_notification(f"🔔 Reminder: {task}")
        if repeat_type == 'once':
            db.update_status(reminder_id, 'done')

    def cancel_job(self, reminder_id):
        job_id = f"reminder_{reminder_id}"
        try:
            self.scheduler.remove_job(job_id)
        except Exception:
            pass

    def load_jobs_from_db(self):
        reminders = db.get_active_reminders()
        now = datetime.now()
        for r in reminders:
            try:
                rt = r['run_time']
                if isinstance(rt, str):
                    rt = datetime.strptime(rt.split('.')[0], '%Y-%m-%d %H:%M:%S')
                if r['repeat_type'] == 'once' and rt < now:
                    db.update_status(r['id'], 'done')
                    continue
                self.schedule_reminder(r['id'], r['task'], rt, r['repeat_type'])
            except Exception as e:
                logger.error(f"Failed to load job {r['id']}: {e}")

scheduler = SchedulerManager()
