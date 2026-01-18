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
            const unread = notifsRes.data;
            if (unread && unread.length > 0) {
                setNotifications(unread);

                // Process each unread notification
                for (const notif of unread) {
                    showNotification(notif);
                    // Mark as read on backend
                    await assistantApi.markRead(notif.id);
                }
            }
        } catch (error) {
            console.error("Sync error:", error);
        }
    };

    useEffect(() => {
        requestPermission();

        // Initial sync
        syncSystem();

        // Start polling
        const interval = setInterval(syncSystem, 5000);

        return () => clearInterval(interval);
    }, []);
};

export default useNotifications;
