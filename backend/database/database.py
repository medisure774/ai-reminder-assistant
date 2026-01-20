import sqlite3
import logging
import os
import json
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
        
        # Check if table exists to decide on migration or simple creation
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='reminders'")
        table_exists = cursor.fetchone()

        if not table_exists:
            # Create fresh if not exists
            self._create_reminders_table(cursor)
        else:
            # Check for new columns and migrate if necessary
            # For this 'production-grade' upgrade, if the schema is too different, 
            # we might just want to back up and recreate, or alter table.
            # Let's check for a key new column 'description'
            cursor.execute("PRAGMA table_info(reminders)")
            columns = [info[1] for info in cursor.fetchall()]
            if 'description' not in columns:
                logger.info("⚡ Migrating database schema...")
                try:
                    cursor.execute("ALTER TABLE reminders ADD COLUMN description TEXT")
                    cursor.execute("ALTER TABLE reminders ADD COLUMN is_recurring BOOLEAN DEFAULT 0")
                    cursor.execute("ALTER TABLE reminders ADD COLUMN priority INTEGER DEFAULT 1")
                    cursor.execute("ALTER TABLE reminders ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP")
                    # repeat_payload might already exist if previously added, but let's check
                    if 'repeat_payload' not in columns:
                        cursor.execute("ALTER TABLE reminders ADD COLUMN repeat_payload TEXT")
                    
                    logger.info("✅ Migration successful.")
                except Exception as e:
                    logger.error(f"Migration failed: {e}. You might need to reset the DB.")
        
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

    def _create_reminders_table(self, cursor):
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task TEXT NOT NULL,
                description TEXT,
                run_time DATETIME NOT NULL,
                repeat_type TEXT DEFAULT 'once', -- 'once', 'daily', 'weekly', 'custom'
                repeat_payload TEXT, -- JSON for custom repeats
                is_recurring BOOLEAN DEFAULT 0,
                priority INTEGER DEFAULT 1, -- 1=Normal, 2=High
                status TEXT DEFAULT 'active', -- 'active', 'done', 'cancelled', 'snoozed'
                snooze_until DATETIME,
                completion_time DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')

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
        cursor.execute("SELECT id, message FROM notifications WHERE is_read = 0 ORDER BY created_at DESC")
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

    # --- Task / Reminder Methods ---

    def add_reminder(self, task, run_time, repeat_type='once', description=None, priority=1):
        conn = self._get_conn()
        cursor = conn.cursor()
        # Handle datetime objects
        run_time_str = run_time if isinstance(run_time, str) else run_time.strftime('%Y-%m-%d %H:%M:%S')
        is_recurring = repeat_type != 'once'
        
        cursor.execute('''
            INSERT INTO reminders (task, run_time, repeat_type, status, description, is_recurring, priority)
            VALUES (?, ?, ?, 'active', ?, ?, ?)
        ''', (task, run_time_str, repeat_type, description, is_recurring, priority))
        
        reminder_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return reminder_id

    def update_reminder(self, reminder_id, data: dict):
        """Generic update method for tasks."""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        fields = []
        values = []
        for key, value in data.items():
            fields.append(f"{key} = ?")
            values.append(value)
        
        # Always update 'updated_at'
        fields.append("updated_at = CURRENT_TIMESTAMP")
        
        if not fields:
            return False

        values.append(reminder_id)
        sql = f"UPDATE reminders SET {', '.join(fields)} WHERE id = ?"
        
        cursor.execute(sql, values)
        conn.commit()
        conn.close()
        return True

    def get_active_reminders(self):
        """Get all scheduled valid reminders."""
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM reminders WHERE status IN ('active', 'snoozed') ORDER BY run_time ASC")
        rows = cursor.fetchall()
        conn.close()
        return [self._row_to_dict(r) for r in rows]

    def get_reminders_by_date_range(self, start_date_str, end_date_str):
        """For Calendar View."""
        conn = self._get_conn()
        cursor = conn.cursor()
        # run_time is stored as YYYY-MM-DD HH:MM:SS
        cursor.execute('''
            SELECT * FROM reminders 
            WHERE run_time >= ? AND run_time <= ? AND status != 'cancelled'
            ORDER BY run_time ASC
        ''', (start_date_str, end_date_str))
        rows = cursor.fetchall()
        conn.close()
        return [self._row_to_dict(r) for r in rows]

    def get_overdue_reminders(self):
        """For 'Past' section in Timeline."""
        conn = self._get_conn()
        cursor = conn.cursor()
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute('''
            SELECT * FROM reminders 
            WHERE run_time < ? AND status = 'active'
            ORDER BY run_time DESC
        ''', (now,))
        rows = cursor.fetchall()
        conn.close()
        return [self._row_to_dict(r) for r in rows]

    def update_reminder_time(self, reminder_id: int, run_time):
        conn = self._get_conn()
        cursor = conn.cursor()
        rt_str = run_time if isinstance(run_time, str) else run_time.strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute("UPDATE reminders SET run_time = ?, status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (rt_str, reminder_id))
        conn.commit()
        conn.close()

    def update_status(self, reminder_id, status):
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("UPDATE reminders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (status, reminder_id))
        conn.commit()
        conn.close()

    def delete_reminder(self, reminder_id):
        self.update_status(reminder_id, 'cancelled')

    def complete_reminder(self, reminder_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute("UPDATE reminders SET status = 'done', completion_time = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (now, reminder_id))
        conn.commit()
        conn.close()

    def snooze_reminder(self, reminder_id, snooze_until):
        conn = self._get_conn()
        cursor = conn.cursor()
        s_str = snooze_until if isinstance(snooze_until, str) else snooze_until.strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute("UPDATE reminders SET status = 'snoozed', snooze_until = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (s_str, reminder_id))
        conn.commit()
        conn.close()

    def _row_to_dict(self, row):
        return {
            'id': row[0],
            'task': row[1],
            'description': row[2],
            'run_time': row[3], 
            'repeat_type': row[4],
            'repeat_payload': row[5],
            'is_recurring': row[6],
            'priority': row[7],
            'status': row[8],
            'snooze_until': row[9],
            'completion_time': row[10],
            'created_at': row[11],
            'updated_at': row[12] if len(row) > 12 else None
        }

# Global DB instance
db = Database()
