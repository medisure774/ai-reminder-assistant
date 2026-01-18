import { motion } from 'framer-motion';
import { Calendar, Trash2, Clock } from 'lucide-react';
import useReminderStore from '../store/reminderStore';
import assistantApi from '../api/assistantApi';

const ReminderBoard = () => {
    const { reminders, removeReminder } = useReminderStore();

    const handleDelete = async (id) => {
        try {
            await assistantApi.deleteReminder(id);
            removeReminder(id);
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
                <Calendar className="text-neon-cyan w-5 h-5" />
                <h3 className="font-bold text-lg">Active Nodes</h3>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar flex-1 items-start">
                {reminders.filter(r => r.status === 'active').map((r) => (
                    <motion.div
                        key={r.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="min-w-[280px] bg-white/5 border border-white/10 p-4 rounded-3xl relative group"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold pr-8">{r.task}</h4>
                            <button
                                onClick={() => handleDelete(r.id)}
                                className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-xl transition-all text-red-400 absolute top-2 right-2"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-neon-cyan">
                            <Clock className="w-3 h-3" />
                            {r.run_time}
                        </div>
                        <div className="mt-3 text-[10px] uppercase tracking-widest text-gray-500">
                            Frequency: {r.repeat_type}
                        </div>
                    </motion.div>
                ))}
                {reminders.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-gray-600 italic">
                        No active reminders found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReminderBoard;
