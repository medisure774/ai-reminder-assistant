import { create } from 'zustand';

export const useReminderStore = create((set) => ({
    reminders: [],
    notifications: [],
    setReminders: (reminders) => set({ reminders }),
    setNotifications: (notifications) => set({ notifications }),
    removeReminder: (id) =>
        set((state) => ({
            reminders: state.reminders.filter((r) => r.id !== id),
        })),
    completeReminder: (id) =>
        set((state) => ({
            reminders: state.reminders.map((r) =>
                r.id === id ? { ...r, status: 'done' } : r
            ),
        })),
    snoozeReminder: (id, until) =>
        set((state) => ({
            reminders: state.reminders.map((r) =>
                r.id === id ? { ...r, status: 'snoozed', snooze_until: until } : r
            ),
        })),
}));

export default useReminderStore;
