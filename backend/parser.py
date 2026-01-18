import dateparser
import dateparser.search
import re
from datetime import datetime

class ReminderParser:
    def __init__(self):
        self.settings = {
            'PREFER_DATES_FROM': 'future',
            'RELATIVE_BASE': datetime.now(),
            'RETURN_AS_TIMEZONE_AWARE': False
        }

    def parse(self, text: str):
        text = text.strip()
        
        # 1. Detect recurrence
        repeat_type = 'once'
        lower_text = text.lower()
        if 'every day' in lower_text or 'daily' in lower_text:
            repeat_type = 'daily'
        elif 'every week' in lower_text or 'weekly' in lower_text:
            repeat_type = 'weekly'
        
        # 2. Extract time
        try:
            dates = dateparser.search.search_dates(text, settings=self.settings)
        except Exception:
            dates = None

        if not dates:
            return {'error': "I couldn't quite catch the time. Try something like 'at 5pm' or 'tomorrow'."}
        
        matched_string, run_time = dates[-1]
        
        # 3. Extract Task
        clean_text = text.replace(matched_string, '')
        clean_text = re.sub(r'(?i)^(remind me (to|at)?|remind|me)\s*', '', clean_text)
        clean_text = re.sub(r'(?i)\s*(to|on|at)\s*$', '', clean_text)
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()
        
        task = clean_text if clean_text else "Reminder"
        
        return {
            'task': task,
            'run_time': run_time,
            'repeat_type': repeat_type
        }

parser = ReminderParser()
