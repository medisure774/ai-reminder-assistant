import { useEffect, useRef } from 'react';
import assistantApi from '../api/assistantApi';
import useReminderStore from '../store/reminderStore';

const useNotifications = () => {
    const { setNotifications, setReminders } = useReminderStore();
    const permissionRequested = useRef(false);

    const requestPermission = async () => {
        if (!("Notification" in window)) return;

        if (Notification.permission === "default" && !permissionRequested.current) {
            permissionRequested.current = true;
            try {
                await Notification.requestPermission();
            } catch (err) {
                console.error("Error requesting notification permission:", err);
            }
        } else if (Notification.permission === "denied") {
            // Show a internal notification to the user that they blocked notifications
            setNotifications([{ id: 'perm-denied', message: "🚨 Browser notifications are blocked. Please enable them in your browser settings to receive alerts." }]);
        }
    };

    const showNotification = (notif) => {
        if (Notification.permission === "granted") {
            try {
                // Audio feedback (optional but nice)
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
                audio.play().catch(() => { }); // Ignore if blocked by browser

                new Notification("AI BUDDY", {
                    body: notif.message,
                    icon: "/logo.jpg",
                    tag: `notif-${notif.id}`,
                    requireInteraction: true
                });
            } catch (err) {
                console.error("Error showing notification:", err);
            }
        }
    };

    const syncSystem = async () => {
        try {
            // 1. Get current reminders and notifications
            const [remindersRes, notifsRes] = await Promise.all([
                assistantApi.getReminders(),
                assistantApi.getNotifications()
            ]);

            // 2. Update reminders list
            setReminders(remindersRes.data);

            // 3. Handle notifications
            const unread = notifsRes.data || [];

            // Always update store to clear toasts if empty
            setNotifications(unread);

            if (unread.length > 0) {
                // Process each unread notification
                for (const notif of unread) {
                    // Show browser notification
                    showNotification(notif);

                    // Mark as read on backend
                    try {
                        await assistantApi.markRead(notif.id);
                        console.log(`Notification ${notif.id} marked as read`);
                    } catch (err) {
                        console.error("Failed to mark notification as read:", err);
                    }
                }

                // After processing all and marking as read, 
                // we should probably clear the store after a few seconds
                // so the toast doesn't just hang there.
                setTimeout(() => {
                    setNotifications([]);
                }, 8000);
            }
        } catch (error) {
            console.error("Sync error:", error);
        }
    };

    useEffect(() => {
        // Initial sync
        syncSystem();

        // Start polling
        const interval = setInterval(syncSystem, 5000);

        return () => clearInterval(interval);
    }, []);

    return {
        permission: typeof window !== 'undefined' ? Notification.permission : 'default',
        requestPermission
    };
};

export default useNotifications;
