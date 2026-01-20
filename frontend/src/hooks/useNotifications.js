import { useEffect, useRef } from 'react';
import assistantApi from '../api/assistantApi';
import useReminderStore from '../store/reminderStore';
import voiceOutput from '../utils/voiceOutput';

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
            setNotifications([{ id: 'perm-denied', message: "🚨 Browser notifications are blocked. Please enable them in your browser settings to receive alerts." }]);
        }
    };

    const showNotification = (notif) => {
        // Speak the notification aloud
        voiceOutput.speak(notif.message.replace('🔔', ''));

        if (Notification.permission === "granted") {
            try {
                // Audio feedback
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
                audio.play().catch(() => { });

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
            const [remindersRes, notifsRes] = await Promise.all([
                assistantApi.getReminders(),
                assistantApi.getNotifications()
            ]);

            setReminders(remindersRes.data);
            const unread = notifsRes.data || [];

            if (unread.length > 0) {
                setNotifications(unread);
                for (const notif of unread) {
                    showNotification(notif);
                    try {
                        await assistantApi.markRead(notif.id);
                    } catch (err) {
                        console.error("Failed to mark read:", err);
                    }
                }
                setTimeout(() => setNotifications([]), 8000);
            }
        } catch (error) {
            console.error("Sync error:", error);
        }
    };

    useEffect(() => {
        syncSystem();
        const interval = setInterval(syncSystem, 2000);
        return () => clearInterval(interval);
    }, []);

    return {
        permission: typeof window !== 'undefined' ? Notification.permission : 'default',
        requestPermission
    };
};

export default useNotifications;
