import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, LayoutDashboard, History } from 'lucide-react';
import useReminderStore from '../store/reminderStore';
import ReminderCard from './ReminderCard';

const ReminderBoard = () => {
    const { reminders } = useReminderStore();

    const today = new Date().toDateString();

    const categorized = {
        today: (reminders || []).filter(r => r.status !== 'done' && new Date(r.run_time).toDateString() === today),
        upcoming: (reminders || []).filter(r => r.status !== 'done' && new Date(r.run_time).toDateString() !== today),
        done: (reminders || []).filter(r => r.status === 'done')
    };

    const Section = ({ title, items, icon: Icon }) => (
        <div className="flex flex-col gap-4 min-w-[320px] max-w-[400px]">
            <div className="flex items-center gap-2 px-2">
                <Icon className="text-neon-cyan w-4 h-4" />
                <h3 className="font-bold text-sm uppercase tracking-widest text-white/60">{title}</h3>
                <span className="ml-auto text-xs bg-white/5 px-2 py-0.5 rounded-full border border-white/10">{items.length}</span>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {items.map((r) => (
                        <ReminderCard key={r.id} reminder={r} />
                    ))}
                    {items.length === 0 && (
                        <div className="h-20 flex items-center justify-center border border-dashed border-white/5 rounded-[2rem] text-gray-600 text-xs italic">
                            Empty Node
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-neon-cyan/20 rounded-2xl border border-neon-cyan/40">
                        <LayoutDashboard className="text-neon-cyan w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="font-black text-2xl uppercase tracking-tighter">Command Center</h2>
                        <p className="text-[10px] text-neon-cyan uppercase tracking-[0.3em]">Lifecycle Management</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-10 overflow-x-auto pb-4 custom-scrollbar flex-1 items-start">
                <Section title="Today" items={categorized.today} icon={Calendar} />
                <Section title="Upcoming" items={categorized.upcoming} icon={LayoutDashboard} />
                <Section title="Resolved" items={categorized.done} icon={History} />
            </div>
        </div>
    );
};

export default ReminderBoard;
