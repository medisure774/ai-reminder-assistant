import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Intro = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/login');
        }, 5000);
        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="flex flex-col items-center justify-center h-screen bg-[#0a0a12] text-center"
        >
            <motion.h1
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="text-6xl font-extrabold tracking-tighter text-neon-cyan mb-4"
            >
                AI BUDDY
            </motion.h1>
            <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="text-xl text-gray-400 font-light"
            >
                Created by <span className="text-white font-semibold">Medisure Plus</span>
            </motion.p>

            <motion.div
                initial={{ width: 0 }}
                animate={{ width: "200px" }}
                transition={{ delay: 1.5, duration: 3 }}
                className="h-1 bg-neon-cyan mt-8 rounded-full shadow-[0_0_10px_#00f3ff]"
            />
        </motion.div>
    );
};

export default Intro;
