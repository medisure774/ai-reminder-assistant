import axios from 'axios';

// Use environment variable for production (Render URL)
// This is critical for Vercel deployment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const assistantApi = {
    chat: (message) => api.post('/chat', { message }),
    getReminders: () => api.get('/reminders'),
    deleteReminder: (id) => api.delete(`/reminders/${id}`),
    getNotifications: () => api.get('/notifications'),
    markRead: (id) => api.post(`/notifications/${id}/read`),
    checkHealth: () => api.get('/'),
};

export default assistantApi;
