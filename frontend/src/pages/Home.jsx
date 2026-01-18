import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Send, Bell, List } from 'lucide-react';
import AssistantAvatar from '../components/AssistantAvatar';
import ReminderBoard from '../components/ReminderBoard';
import assistantApi from '../api/assistantApi';
import useReminderStore from '../store/reminderStore';

const Home = () => {
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Welcome, Medisure Plus. How can I assist you today?' }
    ]);
    const chatEndRef = useRef(null);

    const { setReminders, setNotifications, notifications } = useReminderStore();

    const fetchStatus = async () => {
        try {
            const [r, n] = await Promise.all([
                assistantApi.getReminders(),
                assistantApi.getNotifications()
            ]);
            setReminders(r.data);
            setNotifications(n.data);
        } catch (err) {
            console.error("Poll error:", err);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn');
        window.location.href = '/login';
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsThinking(true);

        try {
            const res = await assistantApi.chat(userMsg);
            setMessages(prev => [...prev, { role: 'assistant', text: res.data.message }]);
            fetchStatus();
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', text: "Error connecting to system node." }]);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#0a0a12] p-6 gap-6">
            {/* Header */}
            <header className="flex justify-between items-center bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-3xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neon-cyan/20 rounded-full flex items-center justify-center border border-neon-cyan/40">
                        <Bell className="text-neon-cyan w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg">AI Assistant</h2>
                        <p className="text-xs text-neon-cyan uppercase tracking-widest">Active System</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="p-3 hover:bg-red-500/20 rounded-full transition-colors text-red-400"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </header>

            {/* Main Content Area */}
            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Left: Avatar Panel */}
                <div className="w-[30%] bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] flex flex-col items-center justify-center p-8 relative">
                    <AssistantAvatar isThinking={isThinking} />
                    <div className="text-center mt-8">
                        <h3 className="text-xl font-bold text-neon-cyan">Medisure Node</h3>
                        <p className="text-sm text-gray-500 mt-2">Awaiting your directives...</p>
                    </div>
                </div>

                {/* Right: Chat Panel */}
                <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] flex flex-col p-6">
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {messages.map((m, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] p-4 rounded-3xl ${m.role === 'user'
                                        ? 'bg-neon-cyan text-black font-medium rounded-br-none'
                                        : 'bg-white/10 text-white border border-white/10 rounded-bl-none'
                                    }`}>
                                    {m.text}
                                </div>
                            </motion.div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleSend} className="mt-6 relative">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me anything..."
                            className="w-full bg-white/5 border border-white/10 p-5 pr-16 rounded-full focus:outline-none focus:border-neon-cyan transition-colors"
                        />
                        <button className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-neon-cyan text-black rounded-full hover:scale-105 transition-transform">
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>

            {/* Bottom: Reminder Board */}
            <div className="h-[30%] bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] overflow-hidden">
                <ReminderBoard />
            </div>

            {/* Toast Notifications */}
            <AnimatePresence>
                {notifications.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed top-12 right-12 z-50 p-6 glass rounded-3xl border-neon-purple/50 glow-purple"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                            <div>
                                <h4 className="font-bold text-neon-purple">New Alert</h4>
                                <p className="text-sm">{notifications[0].message}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Home;
