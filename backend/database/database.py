import sqlite3
import logging
import os
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Resolve DB path relative to this file for production stability (Render/Vercel safe)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "reminders_web.db")

class Database:
    def __init__(self, db_path=DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_conn(self):
        return sqlite3.connect(self.db_path, check_same_thread=False)

    def _init_db(self):
        """Initialize the database with the required schema."""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task TEXT NOT NULL,
                run_time DATETIME NOT NULL,
                repeat_type TEXT DEFAULT 'once', -- 'once', 'daily', 'weekly'
                status TEXT DEFAULT 'active', -- 'active', 'done', 'cancelled'
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info(f"Database initialized at {self.db_path}")

    def add_notification(self, message):
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO notifications (message) VALUES (?)", (message,))
        conn.commit()
        conn.close()
        logger.info(f"Notification added: {message}")

    def get_unread_notifications(self):
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT id, message FROM notifications WHERE is_read = 0")
        rows = cursor.fetchall()
        
        notifications = [{'id': r[0], 'message': r[1]} for r in rows]
        conn.close()
        return notifications

    def mark_notification_read(self, notification_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("UPDATE notifications SET is_read = 1 WHERE id = ?", (notification_id,))
        conn.commit()
        conn.close()

    def mark_all_notifications_read(self):
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("UPDATE notifications SET is_read = 1 WHERE is_read = 0")
        conn.commit()
        conn.close()

    def add_reminder(self, task, run_time, repeat_type='once'):
        conn = self._get_conn()
        cursor = conn.cursor()
        # Handle datetime objects
        run_time_str = run_time if isinstance(run_time, str) else run_time.strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute('''
            INSERT INTO reminders (task, run_time, repeat_type, status)
            VALUES (?, ?, ?, 'active')
        ''', (task, run_time_str, repeat_type))
        reminder_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return reminder_id

    def get_active_reminders(self):
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM reminders WHERE status = 'active' ORDER BY run_time ASC")
        rows = cursor.fetchall()
        
        reminders = []
        for r in rows:
            reminders.append({
                'id': r[0],
                'task': r[1],
                'run_time': r[2], 
                'repeat_type': r[3],
                'status': r[4],
                'created_at': r[5]
            })
        conn.close()
        return reminders

    def update_status(self, reminder_id, status):
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("UPDATE reminders SET status = ? WHERE id = ?", (status, reminder_id))
        conn.commit()
        conn.close()

    def delete_reminder(self, reminder_id):
        self.update_status(reminder_id, 'cancelled')

# Global DB instance
db = Database()
