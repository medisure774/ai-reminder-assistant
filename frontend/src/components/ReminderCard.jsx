import { motion } from 'framer-motion';
import { Clock, CheckCircle, Bell, Trash2, Calendar } from 'lucide-react';
import assistantApi from '../api/assistantApi';
import useReminderStore from '../store/reminderStore';

const ReminderCard = ({ reminder }) => {
    const { completeReminder, snoozeReminder, removeReminder } = useReminderStore();

    const handleComplete = async () => {
        try {
            await assistantApi.completeReminder(reminder.id);
            completeReminder(reminder.id);
        } catch (err) {
            console.error("Failed to complete:", err);
        }
    };

    const handleSnooze = async () => {
        try {
            const res = await assistantApi.snoozeReminder(reminder.id, 10);
            snoozeReminder(reminder.id, res.data.until);
        } catch (err) {
            console.error("Failed to snooze:", err);
        }
    };

    const handleDelete = async () => {
        try {
            await assistantApi.deleteReminder(reminder.id);
            removeReminder(reminder.id);
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    const statusColors = {
        active: 'border-white/10 bg-white/5',
        snoozed: 'border-yellow-500/30 bg-yellow-500/5',
        done: 'border-green-500/30 bg-green-500/5 opacity-60'
    };

    const statusIcons = {
        active: <Bell className="w-4 h-4 text-neon-cyan" />,
        snoozed: <Clock className="w-4 h-4 text-yellow-500" />,
        done: <CheckCircle className="w-4 h-4 text-green-500" />
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`min-w-[300px] border p-5 rounded-[2rem] backdrop-blur-xl relative group transition-all duration-300 ${statusColors[reminder.status] || statusColors.active}`}
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-white/5 rounded-xl">
                        {statusIcons[reminder.status] || statusIcons.active}
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-gray-500">
                        {reminder.repeat_type}
                    </span>
                </div>
                <button
                    onClick={handleDelete}
                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-xl transition-all text-gray-400"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            <h4 className={`text-lg font-bold mb-4 ${reminder.status === 'done' ? 'line-through text-gray-500' : 'text-white'}`}>
                {reminder.task}
            </h4>

            <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2 text-sm text-neon-cyan">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(reminder.run_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div className="flex gap-2">
                    {reminder.status !== 'done' && (
                        <>
                            <button
                                onClick={handleSnooze}
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium transition-colors"
                            >
                                Snooze
                            </button>
                            <button
                                onClick={handleComplete}
                                className="px-3 py-1.5 bg-neon-cyan text-black rounded-xl text-xs font-bold hover:scale-105 transition-transform"
                            >
                                Done
                            </button>
                        </>
                    )}
                </div>
            </div>

            {reminder.status === 'snoozed' && (
                <div className="mt-3 pt-3 border-t border-white/5 text-[10px] text-yellow-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Snoozed until {new Date(reminder.snooze_until).toLocaleTimeString()}
                </div>
            )}
        </motion.div>
    );
};

export default ReminderCard;
