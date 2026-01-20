import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { assistantApi } from '../api/assistantApi';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tasks, setTasks] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const fetchTasks = async (date) => {
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        try {
            const res = await assistantApi.getCalendar(month, year);
            setTasks(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchTasks(currentDate);
    }, [currentDate]);

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    // Calendar building logic
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const getTasksForDay = (day) => {
        return tasks.filter(task => isSameDay(parseISO(task.run_time), day));
    };

    return (
        <div className="p-6 max-w-5xl mx-auto pb-24 h-screen flex flex-col">
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white">
                        {format(currentDate, 'MMMM yyyy')}
                    </h1>
                    <p className="text-white/50 text-sm">Plan your month ahead</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition">
                        <ChevronLeft />
                    </button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 rounded-full bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition text-sm font-bold">
                        Today
                    </button>
                    <button onClick={nextMonth} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition">
                        <ChevronRight />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-7 gap-4 mb-4 text-center">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-white/30 uppercase text-xs font-bold tracking-widest">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr">
                {calendarDays.map((day, idx) => {
                    const dayTasks = getTasksForDay(day);
                    const isCurrentMonth = isSameMonth(day, monthStart);

                    return (
                        <motion.div
                            key={day.toISOString()}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.01 }}
                            onClick={() => setSelectedDate(day)}
                            className={`
                                relative p-2 rounded-xl border min-h-[100px] flex flex-col gap-1 cursor-pointer transition-all
                                ${isCurrentMonth ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-transparent border-transparent opacity-30'}
                                ${isSameDay(day, new Date()) ? 'ring-1 ring-purple-500 bg-purple-500/10' : ''}
                            `}
                        >
                            <span className={`text-sm font-medium ${isSameDay(day, new Date()) ? 'text-purple-400' : 'text-white/60'}`}>
                                {format(day, 'd')}
                            </span>

                            <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] scrollbar-thin">
                                {dayTasks.slice(0, 3).map(task => (
                                    <div key={task.id} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-200 truncate border-l-2 border-blue-400">
                                        {task.task}
                                    </div>
                                ))}
                                {dayTasks.length > 3 && (
                                    <div className="text-[10px] text-white/30 pl-1">
                                        +{dayTasks.length - 3} more
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default Calendar;
