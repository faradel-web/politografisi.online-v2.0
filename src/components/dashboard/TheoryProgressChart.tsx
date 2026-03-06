"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { BookOpen } from 'lucide-react';
import { useTheme } from 'next-themes';

interface TheoryProgressChartProps {
    totalTopics: number;
    completedTopics: number;
}

export default function TheoryProgressChart({ totalTopics, completedTopics }: TheoryProgressChartProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    const percentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    const remaining = totalTopics - completedTopics;

    // Кольори для діаграми адаптовані під dark/light тему
    const COLORS = {
        completed: isDark ? '#818cf8' : '#6366f1', // indigo-400 / indigo-500
        remaining: isDark ? '#334155' : '#e2e8f0',  // slate-700 / slate-200
    };

    const data = [
        { name: 'Μελετημένα', value: completedTopics },
        { name: 'Υπολειπόμενα', value: remaining > 0 ? remaining : 0 },
    ];

    // --- EMPTY STATE ---
    if (totalTopics === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                        <BookOpen size={20} />
                    </div>
                    <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider">Θεωρία</h3>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                        <BookOpen size={24} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500">Δεν υπάρχει υλικό</p>
                    <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Θα ενημερωθεί σύντομα</p>
                </div>
            </div>
        );
    }

    // --- Визначення кольору та повідомлення за прогресом ---
    let statusText = "Ξεκινήστε τη μελέτη!";
    let statusColor = "text-slate-400 dark:text-slate-500";
    if (percentage > 0 && percentage < 50) {
        statusText = "Καλή αρχή! 💪";
        statusColor = "text-indigo-500 dark:text-indigo-400";
    } else if (percentage >= 50 && percentage < 100) {
        statusText = "Σχεδόν έτοιμοι! 🔥";
        statusColor = "text-indigo-600 dark:text-indigo-400";
    } else if (percentage === 100) {
        statusText = "Ολοκληρώθηκε! 🏆";
        statusColor = "text-emerald-600 dark:text-emerald-400";
    }

    return (
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm h-full flex flex-col relative overflow-hidden group">
            {/* Декоративний фон */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-2xl -mr-10 -mt-10 opacity-50 group-hover:opacity-80 transition-opacity" />

            {/* Header */}
            <div className="flex items-center gap-3 mb-2 relative z-10">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                    <BookOpen size={20} />
                </div>
                <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider">Θεωρία</h3>
                    <p className={`text-[10px] font-bold ${statusColor} uppercase tracking-widest`}>{statusText}</p>
                </div>
            </div>

            {/* Donut Chart */}
            <div className="flex-1 flex items-center justify-center relative z-10 min-h-[160px] sm:min-h-[180px]">
                <div className="relative w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius="60%"
                                outerRadius="82%"
                                startAngle={90}
                                endAngle={-270}
                                paddingAngle={completedTopics > 0 && remaining > 0 ? 3 : 0}
                                dataKey="value"
                                stroke="none"
                                isAnimationActive={true}
                                animationBegin={0}
                                animationDuration={1000}
                            >
                                <Cell fill={COLORS.completed} />
                                <Cell fill={COLORS.remaining} />
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Текст всередині кола */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none">
                            {percentage}%
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">
                            {completedTopics} / {totalTopics}
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom text */}
            <div className="text-center relative z-10 mt-1">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500">
                    {completedTopics === 0
                        ? "Ξεκινήστε τη μελέτη σας"
                        : `${completedTopics} από ${totalTopics} ενότητες μελετήθηκαν`
                    }
                </p>
            </div>
        </div>
    );
}
