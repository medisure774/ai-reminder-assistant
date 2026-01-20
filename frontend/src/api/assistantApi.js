import axios from 'axios';

// Use environment variable for production (Render URL)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ai-buddy-backend-gsci.onrender.com';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const assistantApi = {
    // Chat & AI
    chat: (message, preview = false) => api.post('/chat', {
        message,
        preview,
        local_time: new Date().toISOString()
    }),

    // Task Management
    createTask: (data) => api.post('/tasks', data),
    getTimeline: () => api.get('/tasks/timeline'),
    getCalendar: (month, year) => api.get(`/tasks/calendar?month=${month}&year=${year}`),
    updateTask: (id, data) => api.put(`/tasks/${id}`, data),
    deleteTask: (id) => api.delete(`/tasks/${id}`),

    // Actions
    completeTask: (id) => api.post(`/tasks/${id}/complete`),
    snoozeTask: (id, minutes = 10) => api.post(`/tasks/${id}/snooze`, null, { params: { minutes } }),

    // Notifications & System
    getNotifications: () => api.get('/notifications'),
    markRead: (id) => api.post(`/notifications/${id}/read`),
    checkHealth: () => api.get('/health'),
};

export default assistantApi;
