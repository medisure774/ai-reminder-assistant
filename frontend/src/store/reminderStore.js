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
}));

export default useReminderStore;
