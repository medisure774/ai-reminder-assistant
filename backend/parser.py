import dateparser
import dateparser.search
import re
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class ReminderParser:
    def __init__(self):
        self.settings = {
            'PREFER_DATES_FROM': 'future',
            'RELATIVE_BASE': datetime.now(),
            'RETURN_AS_TIMEZONE_AWARE': False
        }

    def parse(self, text: str, local_time_str: str = None):
        text = text.strip()
        # Sanitize common user error: 22:58 pm -> 22:58
        text = re.sub(r'([1-2][0-9]):([0-5][0-9])\s*pm', r'\1:\2', text, flags=re.IGNORECASE)
        # Use current time as relative base for every parse
        current_settings = self.settings.copy()
        if local_time_str:
            try:
                current_settings['RELATIVE_BASE'] = datetime.fromisoformat(local_time_str.replace('Z', '+00:00')).replace(tzinfo=None)
            except:
                current_settings['RELATIVE_BASE'] = datetime.now()
        else:
            current_settings['RELATIVE_BASE'] = datetime.now()

        # Pre-process common phrases that parser might miss in sentence
        text_proc = text.lower()
        if 'tomorrow morning' in text_proc:
            text = text.replace('tomorrow morning', 'at 9am tomorrow')
        elif 'tomorrow afternoon' in text_proc:
            text = text.replace('tomorrow afternoon', 'at 2pm tomorrow')
        elif 'tomorrow evening' in text_proc:
            text = text.replace('tomorrow evening', 'at 7pm tomorrow')
        elif 'tonight' in text_proc:
            text = text.replace('tonight', 'at 8pm today')
        
        # 1. Detect recurrence
        repeat_type = 'once'
        lower_text = text.lower()
        if 'every day' in lower_text or 'daily' in lower_text:
            repeat_type = 'daily'
        elif 'every week' in lower_text or 'weekly' in lower_text:
            repeat_type = 'weekly'
        
        # 2. Extract time
        try:
            dates = dateparser.search.search_dates(text, settings=current_settings)
        except Exception:
            dates = None

        if not dates:
            return {'error': "I couldn't quite catch the time. Try something like 'at 5pm' or 'tomorrow'."}
        
        matched_string, run_time = dates[-1]
        
        # 3. Extract Task
        clean_text = text.replace(matched_string, '')
        
        # Remove recurring keywords from task name
        clean_text = re.sub(r'(?i)\b(daily|every day|weekly|every week|every|day|week)\b', '', clean_text)
        
        clean_text = re.sub(r'(?i)^(remind me (to|at)?|remind|me)\s*', '', clean_text)
        clean_text = re.sub(r'(?i)\s*(to|on|at|at)\s*$', '', clean_text)
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()
        
        task = clean_text if clean_text else "Reminder"
        
        # 4. Detect if time is potentially vague
        is_vague = False
        if any(word in lower_text for word in ['later', 'sometime', 'soon']):
            is_vague = True

        logger.info(f"Parsed: matched='{matched_string}', run_time='{run_time}', task='{task}', repeat='{repeat_type}', vague={is_vague}")
        
        return {
            'task': task,
            'run_time': run_time,
            'repeat_type': repeat_type,
            'is_vague': is_vague,
            'matched_string': matched_string
        }

parser = ReminderParser()
