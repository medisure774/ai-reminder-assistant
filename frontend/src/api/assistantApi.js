import axios from 'axios';

// Use environment variable for production (Render URL)
// This is critical for Vercel deployment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ai-buddy-backend-gsci.onrender.com';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const assistantApi = {
    chat: (message, preview = false) => api.post('/chat', {
        message,
        preview,
        local_time: new Date().toLocaleString('sv').replace(' ', 'T')
    }),
    getReminders: () => api.get('/reminders'),
    deleteReminder: (id) => api.delete(`/reminders/${id}`),
    completeReminder: (id) => api.post(`/reminders/${id}/complete`),
    snoozeReminder: (id, minutes = 10) => api.post(`/reminders/${id}/snooze`, null, { params: { minutes } }),
    getNotifications: () => api.get('/notifications'),
    markRead: (id) => api.post(`/notifications/${id}/read`),
    checkHealth: () => api.get('/'),
};

export default assistantApi;
