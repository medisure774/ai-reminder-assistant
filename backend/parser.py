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
            'RETURN_AS_TIMEZONE_AWARE': False,
            'PARSERS': ['relative-time', 'absolute-time'] 
        }

    def parse(self, text: str, local_time_str: str = None):
        text = text.strip()
        # Sanitize common user error: 22:58 pm -> 22:58
        text = re.sub(r'([1-2][0-9]):([0-5][0-9])\s*pm', r'\1:\2', text, flags=re.IGNORECASE)
        
        # Use current time as relative base for every parse
        current_settings = self.settings.copy()
        if local_time_str:
            try:
                # Handle simplified ISO format often sent by JS
                base_time = datetime.fromisoformat(local_time_str.replace('Z', '+00:00')).replace(tzinfo=None)
                current_settings['RELATIVE_BASE'] = base_time
            except Exception as e:
                logger.warning(f"Failed to parse local_time '{local_time_str}', using server time. Error: {e}")
                current_settings['RELATIVE_BASE'] = datetime.now()
        else:
            current_settings['RELATIVE_BASE'] = datetime.now()

        # Pre-process common phrases that parser might miss in sentence
        text_proc = text.lower()
        
        # Improved mappings
        phrase_map = {
            'tomorrow morning': 'at 9am tomorrow',
            'tomorrow afternoon': 'at 2pm tomorrow', 
            'tomorrow evening': 'at 7pm tomorrow',
            'tonight': 'at 8pm today',
            'later': 'in 4 hours', # basic default
            'this evening': 'at 6pm today',
            'next week': 'next monday at 9am'
        }
        
        for phrase, replacement in phrase_map.items():
            if phrase in text_proc:
                 # Only replace if it's not part of a larger time context? 
                 # dateparser is smart, but let's help it.
                 # Regex safe replacement?
                 text = re.sub(f"\\b{phrase}\\b", replacement, text, flags=re.IGNORECASE)

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
        
        # Taking the last detected date often works best for "remind me on [date]"
        matched_string, run_time = dates[-1]
        
        # 3. Extract Task
        clean_text = text.replace(matched_string, '')
        
        # Remove recurring keywords from task name
        clean_text = re.sub(r'(?i)\b(daily|every day|weekly|every week|every|day|week)\b', '', clean_text)
        
        clean_text = re.sub(r'(?i)^(remind me (to|at)?|remind|me)\s*', '', clean_text)
        clean_text = re.sub(r'(?i)\s*(to|on|at|at)\s*$', '', clean_text)
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()
        
        task = clean_text if clean_text else "Reminder"
        if len(task) > 1:
            task = task[0].upper() + task[1:]
        
        # 4. Detect if time is potentially vague
        is_vague = False
        if any(word in lower_text for word in ['later', 'sometime', 'soon']):
            is_vague = True
        
        # Safety check: if run_time is in the past, maybe they meant tomorrow?
        # But dateparser PREFER_DATES_FROM='future' usually handles this.
        if run_time < current_settings['RELATIVE_BASE']:
             # Double check - if it was just seconds ago, it's fine (processing delay)
             # If hours ago, likely misinterpretation.
             pass 

        logger.info(f"Parsed: matched='{matched_string}', run_time='{run_time}', task='{task}', repeat='{repeat_type}', vague={is_vague}")
        
        return {
            'task': task,
            'run_time': run_time,
            'repeat_type': repeat_type,
            'is_vague': is_vague,
            'matched_string': matched_string
        }

parser = ReminderParser()
