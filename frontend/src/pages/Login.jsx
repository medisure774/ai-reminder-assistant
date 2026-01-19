import { motion } from 'framer-motion';
import LoginForm from '../components/LoginForm';
import AssistantAvatar from '../components/AssistantAvatar';

const Login = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a12] relative overflow-hidden"
        >
            {/* Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-cyan opacity-5 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-purple opacity-5 blur-[120px]" />

            <div className="flex flex-col md:flex-row items-center gap-12 max-w-5xl w-full z-10">
                <div className="flex-1 text-center md:text-left">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-24 h-24 bg-white/5 backdrop-blur-3xl rounded-[2rem] p-5 border border-white/10 mb-6 flex items-center justify-center glow-cyan-subtle mx-auto md:mx-0 shadow-2xl"
                    >
                        <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain rounded-2xl grayscale hover:grayscale-0 transition-all duration-500" />
                    </motion.div>
                    <motion.h1
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="text-6xl font-black mb-4 tracking-tighter leading-tight"
                    >
                        Welcome Back <br />
                        <span className="text-neon-cyan">Medisure Plus</span>
                    </motion.h1>
                    <motion.p
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-400 text-lg mb-8 uppercase tracking-widest text-xs font-bold"
                    >
                        Secure access to intelligent system node.
                    </motion.p>
                    <LoginForm />
                </div>

                <div className="flex-1 w-full max-w-sm h-[400px] flex items-center justify-center">
                    <AssistantAvatar />
                </div>
            </div>

            <div className="absolute bottom-6 right-6 flex items-center gap-2 text-xs text-neon-cyan opacity-40">
                <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
                Medisure Plus Secure Node
            </div>
        </motion.div>
    );
};

export default Login;
