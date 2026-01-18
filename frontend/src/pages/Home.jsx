import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, LogOut, Send, Bell, List } from 'lucide-react';
import AssistantAvatar from '../components/AssistantAvatar';
import ReminderBoard from '../components/ReminderBoard';
import assistantApi from '../api/assistantApi';
import useReminderStore from '../store/reminderStore';
import useNotifications from '../hooks/useNotifications';
import voiceInput from '../utils/voiceInput';
import voiceOutput from '../utils/voiceOutput';

const Home = () => {
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [lastVoiceCommand, setLastVoiceCommand] = useState('');

    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Welcome, Medisure Plus. How can I assist you today?' }
    ]);
    const chatEndRef = useRef(null);

    const { setReminders, notifications } = useReminderStore();
    const { permission, requestPermission } = useNotifications();

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn');
        window.location.href = '/login';
    };

    const processMessage = async (text, isVoice = false) => {
        if (!text.trim()) return;

        setMessages(prev => [...prev, { role: 'user', text }]);
        setIsThinking(true);

        try {
            if (isConfirming) {
                const lower = text.toLowerCase();
                if (lower.includes('yes') || lower.includes('ok') || lower.includes('yeah') || lower.includes('sure')) {
                    const res = await assistantApi.chat(lastVoiceCommand, false);
                    setMessages(prev => [...prev, { role: 'assistant', text: res.data.message }]);
                    if (isVoice) voiceOutput.speak(res.data.message);
                } else {
                    const msg = "Okay, I've canceled that reminder.";
                    setMessages(prev => [...prev, { role: 'assistant', text: msg }]);
                    if (isVoice) voiceOutput.speak(msg);
                }
                setIsConfirming(false);
                setLastVoiceCommand('');
            } else {
                const res = await assistantApi.chat(text, isVoice);
                setMessages(prev => [...prev, { role: 'assistant', text: res.data.message }]);

                if (isVoice && res.data.type === 'preview') {
                    setIsConfirming(true);
                    setLastVoiceCommand(text);
                    voiceOutput.speak(res.data.message, () => {
                        startListening();
                    });
                } else if (isVoice) {
                    voiceOutput.speak(res.data.message);
                }
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', text: "Error connecting to system node." }]);
        } finally {
            setIsThinking(false);
        }
    };

    const handleSend = (e) => {
        e.preventDefault();
        const text = input;
        setInput('');
        processMessage(text, false);
    };

    const startListening = () => {
        if (isListening) return;
        setIsListening(true);
        voiceInput.start(
            (transcript) => {
                setIsListening(false);
                processMessage(transcript, true);
            },
            (err) => {
                setIsListening(false);
                console.error("Voice Error:", err);
            },
            () => setIsListening(false)
        );
    };

    // Sync notifications to chat history
    useEffect(() => {
        if (notifications.length > 0) {
            notifications.forEach(notif => {
                const isDuplicate = messages.some(m => m.text === notif.message && m.role === 'assistant');
                if (!isDuplicate) {
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        text: notif.message,
                        isAlert: true
                    }]);
                }
            });
        }
    }, [notifications]);

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

            {/* Notification Permission Banner */}
            {permission === 'default' && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-neon-cyan/20 border border-neon-cyan p-4 rounded-2xl flex items-center justify-between glow-cyan mx-4"
                >
                    <div className="flex items-center gap-3">
                        <Bell className="text-neon-cyan w-6 h-6 animate-bounce" />
                        <div>
                            <p className="font-bold text-neon-cyan">Alerts are Disabled</p>
                            <p className="text-sm opacity-80">Enable desktop notifications to receive real-time voice and text alerts.</p>
                        </div>
                    </div>
                    <button
                        onClick={requestPermission}
                        className="bg-neon-cyan text-black px-6 py-2 rounded-xl text-sm font-bold hover:scale-105 transition-transform shadow-lg"
                    >
                        Enable Now
                    </button>
                </motion.div>
            )}

            {/* Main Content Area */}
            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Left: Avatar Panel */}
                <div className="w-[30%] bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] flex flex-col items-center justify-center p-8 relative">
                    <AssistantAvatar isThinking={isThinking} />
                    <div className="text-center mt-8">
                        <h3 className="text-xl font-bold text-neon-cyan">Medisure Node</h3>
                        <p className="text-sm text-gray-500 mt-2">{isListening ? "Listening to voice..." : isConfirming ? "Waiting for confirmation..." : "Ready for instructions"}</p>
                    </div>
                </div>

                {/* Right: Chat Panel */}
                <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] flex flex-col p-6">
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {messages.map((m, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] p-4 rounded-3xl ${m.role === 'user'
                                    ? 'bg-neon-cyan text-black font-bold shadow-[0_0_15px_rgba(0,255,242,0.3)] rounded-br-none'
                                    : m.isAlert
                                        ? 'bg-red-500/20 text-red-100 border-2 border-red-500/50 rounded-bl-none shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                                        : 'bg-white/10 text-white border border-white/10 rounded-bl-none'
                                    }`}>
                                    {m.text}
                                </div>
                            </motion.div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleSend} className="mt-6 flex items-center gap-3">
                        <div className="relative flex-1">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={isListening ? "Listening..." : isConfirming ? "Say Yes or No..." : "Ask me anything..."}
                                className={`w-full bg-white/5 border ${isListening ? 'border-neon-cyan animate-pulse shadow-[0_0_15px_rgba(0,255,242,0.2)]' : 'border-white/10'} p-5 pr-16 rounded-full focus:outline-none focus:border-neon-cyan transition-all`}
                            />
                            <button
                                type="submit"
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-neon-cyan text-black rounded-full hover:scale-105 transition-transform"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={startListening}
                            className={`p-5 rounded-full transition-all ${isListening
                                ? 'bg-red-500 text-white animate-bounce shadow-[0_0_25px_rgba(239,68,68,0.6)]'
                                : isConfirming
                                    ? 'bg-neon-cyan text-black shadow-[0_0_20px_rgba(0,255,242,0.5)]'
                                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                                }`}
                        >
                            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
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
                {notifications.length > 0 && notifications[0].id !== 'perm-denied' && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                        className="fixed bottom-32 right-12 z-[100] p-6 bg-red-600 text-white rounded-[30px] shadow-[0_0_40px_rgba(255,0,0,0.5)] border-2 border-white/20 flex flex-col gap-2 min-w-[300px]"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                                <Bell className="text-white w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-black text-xl uppercase tracking-tighter">New Reminder</h4>
                                <p className="text-white/90 font-medium">{notifications[0].message}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Home;
