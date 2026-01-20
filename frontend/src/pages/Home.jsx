import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, LogOut, Send, Bell, Settings, MapPin, Activity, Cpu } from 'lucide-react';
import AssistantAvatar from '../components/AssistantAvatar';
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
    const [pendingReminder, setPendingReminder] = useState(null);
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Welcome. How can I assist you today?' }
    ]);
    const chatEndRef = useRef(null);

    const { reminders, setReminders, notifications } = useReminderStore();
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
                const isPositive = lower.includes('yes') || lower.includes('ok') || lower.includes('sure') || lower.includes('confirm');

                if (isPositive && pendingReminder) {
                    // Use new createTask API directly
                    const res = await assistantApi.createTask(pendingReminder);
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        text: res.data.message,
                        type: 'success'
                    }]);
                    if (isVoice) voiceOutput.speak(res.data.message);
                } else if (lower.includes('cancel') || lower.includes('no')) {
                    const msg = "Okay, canceled.";
                    setMessages(prev => [...prev, { role: 'assistant', text: msg }]);
                    voiceOutput.speak(msg);
                } else {
                    // If user says something else, maybe re-parse? For now, just cancel or assume new command?
                    // Let's assume new command if not confirming.
                    setIsConfirming(false);
                    setPendingReminder(null);
                    // Recursive call? allow one level of recursion
                    // processMessage(text, isVoice); 
                    // Risk of loop. Just reset for now.
                    const msg = "I didn't get a confirmation. I've reset. What can I do?";
                    setMessages(prev => [...prev, { role: 'assistant', text: msg }]);
                }

                setIsConfirming(false);
                setPendingReminder(null);
            } else {
                const res = await assistantApi.chat(text, false);

                if (res.data.type === 'confirmation_card') {
                    setIsConfirming(true);
                    setPendingReminder({
                        // Adapt payload to TaskCreate model
                        task: res.data.data.task,
                        run_time: res.data.data.run_time,
                        repeat_type: res.data.data.repeat_type,
                        // We can add description/priority if we parse it later
                    });

                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        text: res.data.message,
                        type: 'confirmation_card',
                        payload: res.data.data
                    }]);

                    // Trigger Voice
                    if (isVoice) {
                        voiceOutput.speak(res.data.message, () => {
                            // Optional: auto-listen for confirmation
                            // startListening();
                        });
                    }
                } else {
                    setMessages(prev => [...prev, { role: 'assistant', text: res.data.message }]);
                    if (isVoice) voiceOutput.speak(res.data.message);
                }
            }
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'assistant', text: "I'm having trouble reaching my brain components." }]);
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

    // Get the latest assistant message to display prominently
    const latestAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');

    return (
        <div className="flex h-screen w-full flex-col bg-background-dark text-white font-body selection:bg-primary/30 overflow-hidden">
            {/* Top Navigation */}
            <header className="flex items-center justify-between border-b border-white/10 bg-background-dark/50 backdrop-blur-md px-8 py-4 z-50">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-background-dark shadow-[0_0_15px_rgba(0,191,255,0.5)]">
                            <span className="material-symbols-outlined font-bold">rocket_launch</span>
                        </div>
                        <h2 className="font-display text-xl font-bold tracking-tight">AI BUDDY</h2>
                    </div>
                    <nav className="hidden md:flex items-center gap-6">
                        <button className="text-primary transition-colors text-sm font-medium">Command Center</button>
                        <button className="text-white/60 hover:text-primary transition-colors text-sm font-medium" onClick={requestPermission}>Notifications</button>
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-white/5 px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                        <div className={`size-2 bg-primary rounded-full shadow-[0_0_8px_#00bfff] ${isListening ? 'animate-ping' : 'animate-pulse'}`}></div>
                        <span className="text-xs font-mono text-primary uppercase tracking-widest">{isListening ? 'Voice Active' : 'System Online'}</span>
                    </div>
                    <button onClick={handleLogout} className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-red-400 transition-colors">
                        <LogOut className="w-5 h-5" />
                    </button>
                    <div className="size-10 rounded-full bg-cover bg-center border border-primary/30" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDSO2Ii6t6l56zKScmPehX76mEyPNgEnsmM8WGjdNHW1L0FCSPaks7N_df3TaznDq3AvYFHvySmcVkbeanjG2Zm7IjLhnXKnOlGTlY8Hvjb_gbdiBcW9SgCrJ0I-vgInlj0cOHBP4TIlmFW84FCF3MeCZeiAO_Y5895cPJsOwU4xP4Qn52bXGW-uk09s88hSlrO-Dj6y3BgY6aVFNCrKNIXhdUfq_mU5kvwoEzm8sHHMJTND3Jq8_xG47AMnVq-cFZnsKTNMDPDeKA')" }}></div>
                </div>
            </header>

            <main className="flex flex-1 overflow-hidden">
                {/* Left Panel: AI Token & Avatar */}
                <aside className="w-1/3 border-r border-white/10 flex flex-col items-center justify-center relative bg-black/20">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,191,255,0.05)_0%,transparent_70%)] pointer-events-none"></div>

                    {/* Reactive 3D AI Token Container */}
                    <div className="relative flex flex-col items-center w-full">
                        <div className="relative size-80 flex items-center justify-center">
                            {/* Replaced generic token with AssistantAvatar */}
                            <AssistantAvatar isThinking={isThinking} isConfirming={isConfirming} />
                        </div>

                        <div className="mt-8 text-center">
                            <p className={`font-display text-2xl font-bold tracking-widest uppercase ${isThinking ? 'text-primary animate-pulse' : 'text-white'}`}>
                                {isThinking ? "Thinking..." : isConfirming ? "Awaiting Input" : "Standby"}
                            </p>
                            <p className="text-white/40 font-mono text-xs mt-2">BUDDY STATUS: {isThinking ? 'PROCESSING REQUEST' : 'READY'}</p>
                        </div>

                        {/* Brain Activity HUD */}
                        <div className="mt-16 grid grid-cols-3 gap-8 px-8 w-full max-w-sm">
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">Logic Ops</span>
                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        animate={{ width: isThinking ? ["20%", "80%", "40%"] : "20%" }}
                                        transition={{ duration: 0.5, repeat: isThinking ? Infinity : 0 }}
                                        className="h-full bg-primary shadow-[0_0_8px_#00bfff]"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">Memory Link</span>
                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        animate={{ width: isThinking ? ["30%", "60%", "30%"] : "40%" }}
                                        transition={{ duration: 0.8, repeat: isThinking ? Infinity : 0 }}
                                        className="h-full bg-primary shadow-[0_0_8px_#00bfff]"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">Neural Flux</span>
                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        animate={{ width: isListening ? ["10%", "90%", "10%"] : "10%" }}
                                        transition={{ duration: 0.2, repeat: isListening ? Infinity : 0 }}
                                        className="h-full bg-primary shadow-[0_0_8px_#00bfff]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Center/Main Panel: Interaction */}
                <section className="flex-1 flex flex-col items-center justify-start p-12 overflow-y-auto relative">
                    <div className="w-full max-w-2xl space-y-8 pb-32">
                        {/* Header Info */}
                        <div className="flex flex-col gap-2 mb-8">
                            <h1 className="font-display text-4xl font-black tracking-tighter text-white">COMMAND CENTER</h1>
                            <p className="text-white/50 text-lg">Mission control for your personal productivity.</p>
                        </div>

                        {/* Recent Chat History (Last few messages) */}
                        <div className="space-y-4 mb-4 opacity-70 hover:opacity-100 transition-opacity">
                            {messages.slice(-3, -1).map((m, i) => (
                                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`p-4 rounded-xl text-sm ${m.role === 'user' ? 'bg-white/10 text-white' : 'glass-panel text-white/80'}`}>
                                        {m.text}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* AI Message (Latest) */}
                        {latestAssistantMessage && (
                            <motion.div
                                key={latestAssistantMessage.text}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-start gap-4 mb-10"
                            >
                                <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/30 shrink-0">
                                    <span className="material-symbols-outlined">smart_toy</span>
                                </div>
                                <div className="flex flex-col gap-2 w-full">
                                    <p className="text-primary/70 text-xs font-bold uppercase tracking-widest">AI BUDDY</p>
                                    <div className="glass-panel px-6 py-4 rounded-2xl rounded-tl-none border-l-4 border-l-primary">
                                        <p className="text-white/90 leading-relaxed text-lg">{latestAssistantMessage.text}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Confirmation Glass Card - Show only when confirming a reminder */}
                        <AnimatePresence>
                            {isConfirming && pendingReminder && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="glass-panel p-8 rounded-[2rem] border-primary/20 shadow-2xl relative group overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-20">
                                        <span className="material-symbols-outlined text-6xl rotate-12">alarm</span>
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-primary text-xs font-bold tracking-[0.3em] mb-4 uppercase">System Prompt</p>
                                        <h2 className="font-display text-3xl font-bold tracking-tight text-white mb-8">INITIALIZE REMINDER?</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                                <div className="flex items-center gap-2 text-primary/60 mb-1">
                                                    <span className="material-symbols-outlined text-sm">assignment</span>
                                                    <span class="text-[10px] font-bold uppercase">Task</span>
                                                </div>
                                                <p className="text-white font-medium truncate" title={pendingReminder.task}>{pendingReminder.task}</p>
                                            </div>
                                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                                <div className="flex items-center gap-2 text-primary/60 mb-1">
                                                    <span className="material-symbols-outlined text-sm">schedule</span>
                                                    <span class="text-[10px] font-bold uppercase">Time</span>
                                                </div>
                                                <p className="text-white font-medium">
                                                    {new Date(pendingReminder.run_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                </p>
                                            </div>
                                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                                <div className="flex items-center gap-2 text-primary/60 mb-1">
                                                    <span className="material-symbols-outlined text-sm">sync</span>
                                                    <span class="text-[10px] font-bold uppercase">Repeat</span>
                                                </div>
                                                <p className="text-white font-medium capitalize">{pendingReminder.repeat || 'None'}</p>
                                            </div>
                                        </div>
                                        {/* Action Bar */}
                                        <div className="flex flex-wrap gap-4">
                                            <button
                                                onClick={() => processMessage('Yes')}
                                                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-primary h-14 rounded-2xl text-background-dark font-bold hover:shadow-[0_0_30px_rgba(0,191,255,0.4)] transition-all active:scale-95 group"
                                            >
                                                <span className="material-symbols-outlined font-bold">check_circle</span>
                                                <span>CONFIRM</span>
                                            </button>
                                            <button
                                                onClick={() => processMessage('No')}
                                                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-white/5 border border-white/10 h-14 rounded-2xl text-red-500 font-bold hover:bg-red-500/10 hover:border-red-500/30 transition-all"
                                            >
                                                <span className="material-symbols-outlined">close</span>
                                                <span>CANCEL</span>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div ref={chatEndRef} className="h-4" />
                    </div>

                    {/* Integrated Input Section at Bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 pt-20 bg-gradient-to-t from-background-dark via-background-dark to-transparent z-20 flex justify-center">
                        <form onSubmit={handleSend} className="w-full max-w-2xl relative">
                            <div className={`glass-panel rounded-full flex items-center p-2 pr-4 transition-all ${isListening ? 'border-primary shadow-[0_0_20px_rgba(0,191,255,0.2)]' : 'border-white/10 hover:border-white/20'}`}>
                                <button
                                    type="button"
                                    onClick={startListening}
                                    className={`p-3 rounded-full transition-all mr-2 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                                >
                                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                </button>
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={isListening ? "Listening..." : "Type a command or reminder..."}
                                    className="flex-1 bg-transparent border-none text-white placeholder:text-white/30 focus:ring-0 text-lg px-2"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    className="p-3 bg-white/5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                            {/* Hints */}
                            <div className="flex justify-center gap-4 mt-4 opacity-50">
                                <span className="text-[10px] uppercase tracking-widest font-mono flex items-center gap-2">
                                    <span className="material-symbols-outlined text-xs">keyboard_return</span> ENTER TO SEND
                                </span>
                            </div>
                        </form>
                    </div>
                </section>
            </main>

            {/* Dynamic Status Bar */}
            <footer className="h-10 border-t border-white/10 bg-background-dark/80 backdrop-blur-md px-6 flex items-center justify-between text-[10px] font-mono text-white/40 tracking-widest z-50">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-primary/40"></span>
                        <span>LATENCY: 14ms</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-primary/40"></span>
                        <span>NEURAL LOAD: 24%</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span>COORD: 34.0522° N, 118.2437° W</span>
                    <span className="text-primary/60">03:42:12 UTC</span>
                </div>
            </footer>
        </div>
    );
};

export default Home;

