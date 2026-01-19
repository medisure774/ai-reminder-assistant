import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Intro = () => {
    const navigate = useNavigate();
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 88) {
                    clearInterval(interval);
                    return 88;
                }
                return prev + 1;
            });
        }, 30);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex h-screen w-full flex-col items-center justify-center stardust-bg overflow-hidden text-white"
        >
            {/* Header Metadata */}
            <div className="absolute top-8 left-10 flex flex-col gap-1 opacity-60">
                <p className="text-primary text-[10px] tracking-widest font-bold uppercase">System Initialization</p>
                <p className="text-white text-xs font-mono">NODE_OS // CORE.v2.4</p>
            </div>

            <div className="absolute top-8 right-10 flex items-center gap-4 opacity-60">
                <div className="text-right">
                    <p className="text-white text-[10px] tracking-tight font-mono uppercase">Temporal Sync</p>
                    <p className="text-white text-xs font-mono">LOC: 37.7749° N, 122.4194° W</p>
                </div>
                <div className="h-8 w-px bg-primary/30"></div>
                <span className="material-symbols-outlined text-primary text-xl">sensors</span>
            </div>

            {/* Central 3D Token Visual */}
            <div className="relative flex flex-col items-center justify-center mb-12">
                <div className="relative size-64 flex items-center justify-center">
                    {/* Rotating Outer Ring */}
                    <div className="absolute inset-0 rounded-full token-ring opacity-40 animate-spin-slow"></div>
                    {/* Counter-Rotating Inner Ring */}
                    <div className="absolute inset-4 rounded-full border border-dashed border-primary/20 animate-spin-reverse-slow"></div>

                    {/* The Core Token */}
                    <div className="relative size-40 rounded-full bg-gradient-to-br from-primary/40 to-transparent flex items-center justify-center glow-pulse overflow-hidden">
                        <div className="absolute inset-0 bg-primary/10 backdrop-blur-md"></div>
                        <div className="relative z-10 size-24 text-white opacity-90 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13.8261 17.4264C16.7203 18.1174 20.2244 18.5217 24 18.5217C27.7756 18.5217 31.2797 18.1174 34.1739 17.4264C36.9144 16.7722 39.9967 15.2331 41.3563 14.1648L24.8486 40.6391C24.4571 41.267 23.5429 41.267 23.1514 40.6391L6.64374 14.1648C8.00331 15.2331 11.0856 16.7722 13.8261 17.4264Z" fill="currentColor"></path>
                                <path clipRule="evenodd" d="M39.998 12.236C39.9944 12.2537 39.9875 12.2845 39.9748 12.3294C39.9436 12.4399 39.8949 12.5741 39.8346 12.7175C39.8168 12.7597 39.7989 12.8007 39.7813 12.8398C38.5103 13.7113 35.9788 14.9393 33.7095 15.4811C30.9875 16.131 27.6413 16.5217 24 16.5217C20.3587 16.5217 17.0125 16.131 14.2905 15.4811C12.0012 14.9346 9.44505 13.6897 8.18538 12.8168C8.17384 12.7925 8.16216 12.767 8.15052 12.7408C8.09919 12.6249 8.05721 12.5114 8.02977 12.411C8.00356 12.3152 8.00039 12.2667 8.00004 12.2612C8.00004 12.261 8 12.2607 8.00004 12.2612C8.00004 12.2359 8.0104 11.9233 8.68485 11.3686C9.34546 10.8254 10.4222 10.2469 11.9291 9.72276C14.9242 8.68098 19.1919 8 24 8C28.8081 8 33.0758 8.68098 36.0709 9.72276C37.5778 10.2469 38.6545 10.8254 39.3151 11.3686C39.9006 11.8501 39.9857 12.1489 39.998 12.236ZM4.95178 15.2312L21.4543 41.6973C22.6288 43.5809 25.3712 43.5809 26.5457 41.6973L43.0534 15.223C43.0709 15.1948 43.0878 15.1662 43.104 15.1371L41.3563 14.1648C43.104 15.1371 43.1038 15.1374 43.104 15.1371L43.1051 15.135L43.1065 15.1325L43.1101 15.1261L43.1199 15.1082C43.1276 15.094 43.1377 15.0754 43.1497 15.0527C43.1738 15.0075 43.2062 14.9455 43.244 14.8701C43.319 14.7208 43.4196 14.511 43.5217 14.2683C43.6901 13.8679 44 13.0689 44 12.2609C44 10.5573 43.003 9.22254 41.8558 8.2791C40.6947 7.32427 39.1354 6.55361 37.385 5.94477C33.8654 4.72057 29.133 4 24 4C18.867 4 14.1346 4.72057 10.615 5.94478C8.86463 6.55361 7.30529 7.32428 6.14419 8.27911C4.99695 9.22255 3.99999 10.5573 3.99999 12.2609C3.99999 13.1275 4.29264 13.9078 4.49321 14.3607C4.60375 14.6102 4.71348 14.8196 4.79687 14.9689C4.83898 15.0444 4.87547 15.1065 4.9035 15.1529C4.91754 15.1762 4.92954 15.1957 4.93916 15.2111L4.94662 15.223L4.95178 15.2312ZM35.9868 18.996L24 38.22L12.0131 18.996C12.4661 19.1391 12.9179 19.2658 13.3617 19.3718C16.4281 20.1039 20.0901 20.5217 24 20.5217C27.9099 20.5217 31.5719 20.1039 34.6383 19.3718C35.082 19.2658 35.5339 19.1391 35.9868 18.996Z" fill="currentColor" fillRule="evenodd"></path>
                            </svg>
                        </div>
                        {/* Internal Floating Particles */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                            <div className="absolute size-2 bg-white rounded-full blur-[2px] animate-ping" style={{ animationDelay: '0.2s' }}></div>
                            <div className="absolute size-1 bg-primary rounded-full blur-[1px] animate-ping" style={{ animationDelay: '0.8s' }}></div>
                        </div>
                    </div>
                </div>
                {/* Shadow/Glow Base */}
                <div className="absolute -bottom-10 size-60 bg-primary/10 blur-[60px] rounded-full"></div>
            </div>

            {/* Text Reveal Section */}
            <div className="text-center z-10 px-4">
                <h1 className="text-white tracking-[0.15em] text-[48px] md:text-[64px] font-bold leading-none mb-4 flex items-center justify-center gap-4">
                    <span>AI</span>
                    <span className="text-primary">BUDDY</span>
                </h1>
                <p className="text-[#8dbece] text-lg font-light tracking-widest uppercase opacity-80">
                    Your Personal Reminder Intelligence
                </p>
            </div>

            {/* Progress & Interaction Container */}
            <div className="mt-16 w-full max-w-md px-10 flex flex-col items-center gap-8">
                {/* Progress Bar */}
                <div className="w-full flex flex-col gap-3 group">
                    <div className="flex gap-6 justify-between items-end">
                        <p className="text-primary/70 text-[10px] font-mono tracking-widest uppercase animate-pulse">Calibrating Temporal Logic...</p>
                        <p className="text-white text-sm font-mono leading-none">{progress}%</p>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden border border-white/10">
                        <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-primary/50 to-primary glow-pulse"
                            style={{ width: `${progress}%` }}
                        ></motion.div>
                    </div>
                </div>

                {/* Interaction Button */}
                <motion.button
                    onClick={() => navigate('/login')}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: progress >= 88 ? 1 : 0, y: progress >= 88 ? 0 : 20 }}
                    className="glass-panel group relative flex items-center justify-center gap-4 px-10 py-5 rounded-full overflow-hidden transition-all duration-500 hover:border-primary/60 hover:shadow-[0_0_30px_rgba(0,191,255,0.2)]"
                >
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="text-white font-bold tracking-[0.2em] text-sm uppercase">Initialize Neural Core</span>
                    <div className="flex items-center justify-center size-8 rounded-full bg-primary/20 text-primary">
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </div>
                </motion.button>
            </div>

            {/* Footer Information */}
            <div className="absolute bottom-10 flex flex-col items-center gap-4 opacity-40">
                <div className="flex items-center gap-6 text-[10px] font-mono text-white tracking-widest">
                    <span className="flex items-center gap-2"><span className="size-1.5 bg-green-500 rounded-full"></span> ENCRYPTED</span>
                    <span className="flex items-center gap-2"><span className="size-1.5 bg-green-500 rounded-full"></span> NEURAL_LINK ACTIVE</span>
                    <span className="flex items-center gap-2"><span className="size-1.5 bg-primary rounded-full animate-pulse"></span> PENDING AUTH</span>
                </div>
                <p className="text-[9px] text-white/50 tracking-tighter">© 2026 AI BUDDY OPERATIONS. ALL RIGHTS RESERVED.</p>
            </div>

            {/* Abstract Decorative Elements */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                {/* Scanline Effect */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-white/[0.02] to-transparent h-[2px] w-full animate-bounce-slow opacity-20"></div>
                {/* Edge Shadows */}
                <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]"></div>
            </div>
        </motion.div>
    );
};

export default Intro;
