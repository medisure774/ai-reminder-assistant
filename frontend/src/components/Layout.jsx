import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Clock, MessageSquare, LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { voiceOutput } from '../utils/voiceOutput';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const NotificationToast = ({ message, onClose }) => (
    <motion.div
        initial={{ opacity: 0, y: -20, x: 20 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-900/90 to-purple-900/90 border border-blue-500/30 backdrop-blur-md shadow-2xl shadow-blue-500/20 max-w-xs pointer-events-auto"
    >
        <div className="p-2 rounded-full bg-blue-500/20 text-blue-300">
            <MessageSquare size={16} />
        </div>
        <div className="flex-1">
            <h4 className="text-sm font-semibold text-white">Reminder</h4>
            <p className="text-xs text-blue-100/80 mt-1 leading-relaxed">{message}</p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white">
            <X size={14} />
        </button>
    </motion.div>
);


const SidebarLink = ({ to, icon: Icon, label }) => {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                ${isActive
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] border border-purple-500/30'
                    : 'text-white/50 hover:text-white hover:bg-white/5'}
            `}
        >
            <Icon size={20} />
            <span className="font-medium">{label}</span>
        </NavLink>
    );
};

const Layout = ({ children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();

    // Notification Polling & Setup
    React.useEffect(() => {
        // Request visual notification permission
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }

        const pollNotifications = async () => {
            try {
                const res = await fetch(`${API_URL}/notifications`);
                if (!res.ok) return;
                const data = await res.json();

                if (data.length > 0) {
                    data.forEach(note => {
                        // 1. Voice Output
                        voiceOutput.speak(note.message);

                        // 2. Device Notification
                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification("AI BUDDY", {
                                body: note.message,
                                icon: '/icon.png' // optional path
                            });
                        }

                        // 3. Mark as read immediately to avoid re-triggering (or handle via state logic specifically)
                        fetch(`${API_URL}/notifications/${note.id}/read`, { method: 'POST' });

                        // 4. Add to local state for Toast
                        setNotifications(prev => [...prev, { id: note.id, message: note.message }]);
                    });
                }
            } catch (err) {
                console.error("Notification poll error:", err);
            }
        };

        const interval = setInterval(pollNotifications, 5000);
        return () => clearInterval(interval);
    }, []);

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn');
        navigate('/login');
    };

    return (
        <div className="flex min-h-screen bg-[#030712] text-white overflow-hidden relative">
            {/* Background Effects */}
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
            <div className="blob blob-3"></div>

            {/* Notification Toasts Container */}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {notifications.map(n => (
                        <NotificationToast
                            key={n.id}
                            message={n.message}
                            onClose={() => removeNotification(n.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-white/10 h-screen sticky top-0 p-6 z-20 backdrop-blur-2xl bg-[#030712]/60">
                <div className="flex items-center gap-3 mb-12">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 animate-spin-slow"></div>
                    <h1 className="text-2xl font-black tracking-tight">
                        AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">BUDDY</span>
                    </h1>
                </div>

                <nav className="flex-1 space-y-2">
                    <SidebarLink to="/home" icon={MessageSquare} label="Chat Assistant" />
                    <SidebarLink to="/timeline" icon={Clock} label="Timeline" />
                    <SidebarLink to="/calendar" icon={Calendar} label="Calendar" />
                </nav>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all mt-auto"
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full z-30 px-6 py-4 glass-panel border-b border-white/10 flex justify-between items-center bg-[#030712]/80 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600"></div>
                    <span className="font-bold text-lg">AI BUDDY</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-20 bg-[#030712] pt-24 px-6 md:hidden"
                    >
                        <nav className="space-y-4">
                            <SidebarLink to="/home" icon={MessageSquare} label="Chat Assistant" />
                            <SidebarLink to="/timeline" icon={Clock} label="Timeline" />
                            <SidebarLink to="/calendar" icon={Calendar} label="Calendar" />
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 text-red-400 bg-red-500/10 rounded-xl"
                            >
                                <LogOut size={20} />
                                <span>Logout</span>
                            </button>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 relative overflow-x-hidden md:ml-0 pt-20 md:pt-0">
                <div className="max-w-7xl mx-auto w-full min-h-screen">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
