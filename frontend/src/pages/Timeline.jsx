import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { assistantApi } from '../api/assistantApi';
import { format, isToday, isPast, isTomorrow, parseISO } from 'date-fns';
import { CheckCircle2, Clock, Calendar as CalIcon, AlertCircle, Trash2 } from 'lucide-react';

const TaskItem = ({ task, onComplete, onDelete }) => {
    const isOverdue = task.group === 'past';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`
                relative group flex items-center justify-between p-4 mb-3 rounded-xl 
                backdrop-blur-md border border-white/5 shadow-lg
                ${isOverdue ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 hover:bg-white/10'}
                transition-all duration-300
            `}
        >
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={() => onComplete(task.id)}
                    className={`
                        p-2 rounded-full transition-all duration-300
                        ${isOverdue ? 'text-red-400 hover:bg-red-500/20' : 'text-emerald-400 hover:bg-emerald-500/20'}
                    `}
                >
                    <CheckCircle2 size={24} />
                </button>

                <div className="flex flex-col">
                    <span className={`text-lg font-medium ${task.status === 'done' ? 'line-through text-white/30' : 'text-white'}`}>
                        {task.task}
                    </span>
                    <div className="flex items-center gap-2 text-sm text-white/50">
                        <Clock size={14} />
                        <span>{format(parseISO(task.run_time), 'h:mm a')}</span>
                        {task.repeat_type !== 'once' && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs uppercase tracking-wider">
                                {task.repeat_type}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <button
                onClick={() => onDelete(task.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-white/30 hover:text-red-400 transition-all"
            >
                <Trash2 size={18} />
            </button>
        </motion.div>
    );
};

const SectionData = ({ title, tasks, icon: Icon, onComplete, onDelete, color }) => (
    <div className="mb-8">
        <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${color}`}>
            <Icon size={20} />
            {title} ({tasks.length})
        </h3>
        <div className="space-y-2">
            <AnimatePresence>
                {tasks.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-8 text-center text-white/20 border border-dashed border-white/10 rounded-xl"
                    >
                        No tasks here
                    </motion.div>
                ) : (
                    tasks.map(task => (
                        <TaskItem key={task.id} task={task} onComplete={onComplete} onDelete={onDelete} />
                    ))
                )}
            </AnimatePresence>
        </div>
    </div>
);

const Timeline = () => {
    const [data, setData] = useState({ past: [], today: [], upcoming: [] });
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await assistantApi.getTimeline();
            setData(res.data);
        } catch (e) {
            console.error("Failed to load timeline", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Refresh every minute to keep times accurate
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleComplete = async (id) => {
        // Optimistic update
        // We'll just refreshing data for simplicity in MVP, or complex filtering locally.
        // Let's refresh for correctness with recurring tasks logic on backend
        await assistantApi.completeTask(id);
        fetchData();
    };

    const handleDelete = async (id) => {
        await assistantApi.deleteTask(id);
        fetchData();
    };

    return (
        <div className="p-6 max-w-4xl mx-auto pb-24">
            <header className="mb-10">
                <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                    Your Timeline
                </h1>
                <p className="text-white/60 mt-2">Manage your past, present, and future tasks.</p>
            </header>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                </div>
            ) : (
                <div className="space-y-2">
                    {data.past.length > 0 && (
                        <SectionData
                            title="Overdue & Past"
                            tasks={data.past}
                            icon={AlertCircle}
                            color="text-red-400"
                            onComplete={handleComplete}
                            onDelete={handleDelete}
                        />
                    )}

                    <SectionData
                        title="Today"
                        tasks={data.today}
                        icon={CheckCircle2}
                        color="text-emerald-400"
                        onComplete={handleComplete}
                        onDelete={handleDelete}
                    />

                    <SectionData
                        title="Upcoming"
                        tasks={data.upcoming}
                        icon={CalIcon}
                        color="text-blue-400"
                        onComplete={handleComplete}
                        onDelete={handleDelete}
                    />
                </div>
            )}
        </div>
    );
};

export default Timeline;
