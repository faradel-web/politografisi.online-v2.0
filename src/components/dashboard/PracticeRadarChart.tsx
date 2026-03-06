"use client";

import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';
import { PenTool } from 'lucide-react';
import { useTheme } from 'next-themes';

// Маппінг ID категорій → Грецькі назви (скорочені для RadarChart)
const CATEGORY_LABELS: Record<string, string> = {
    history: "Ιστορία",
    politics: "Θεσμοί",
    geography: "Γεωγρ.",
    culture: "Πολιτισμ.",
    reading: "Ανάγν.",
    listening: "Ακρόαση",
    speaking: "Ομιλία",
};

// Повні назви для tooltip
const CATEGORY_FULL_LABELS: Record<string, string> = {
    history: "Ιστορία",
    politics: "Πολιτικοί Θεσμοί",
    geography: "Γεωγραφία",
    culture: "Πολιτισμός",
    reading: "Ανάγνωση & Γραφή",
    listening: "Ακρόαση",
    speaking: "Ομιλία",
};

// Порядок відображення на діаграмі
const CATEGORY_ORDER = ["history", "politics", "geography", "culture", "reading", "listening", "speaking"];

interface PracticeRadarChartProps {
    stats: Record<string, { correct: number; incorrect: number }>;
}

export default function PracticeRadarChart({ stats }: PracticeRadarChartProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    // Перевірка, чи є взагалі дані
    const hasData = Object.keys(stats).length > 0 &&
        Object.values(stats).some(s => (s.correct + s.incorrect) > 0);

    // Підготовка даних для Radar
    const data = CATEGORY_ORDER.map(catId => {
        const s = stats[catId];
        const total = s ? s.correct + s.incorrect : 0;
        const percentage = total > 0 ? Math.round((s.correct / total) * 100) : 0;

        return {
            subject: CATEGORY_LABELS[catId] || catId,
            fullName: CATEGORY_FULL_LABELS[catId] || catId,
            value: percentage,
            correct: s?.correct || 0,
            incorrect: s?.incorrect || 0,
            total,
            fullMark: 100,
        };
    });

    // Загальна статистика для підпису
    const totalCorrect = Object.values(stats).reduce((sum, s) => sum + (s.correct || 0), 0);
    const totalIncorrect = Object.values(stats).reduce((sum, s) => sum + (s.incorrect || 0), 0);
    const totalAll = totalCorrect + totalIncorrect;
    const overallPercentage = totalAll > 0 ? Math.round((totalCorrect / totalAll) * 100) : 0;

    // Кольори адаптовані під тему
    const colors = {
        grid: isDark ? '#334155' : '#e2e8f0',       // slate-700 / slate-200
        tickFill: isDark ? '#94a3b8' : '#64748b',   // slate-400 / slate-500
        radarStroke: isDark ? '#34d399' : '#10b981', // emerald-400 / emerald-500
        radarFill: isDark ? '#34d399' : '#10b981',
    };

    // --- EMPTY STATE ---
    if (!hasData) {
        return (
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                        <PenTool size={20} />
                    </div>
                    <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider">Εξάσκηση</h3>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                        <PenTool size={24} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500">Δεν υπάρχουν δεδομένα</p>
                    <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Ολοκληρώστε την πρώτη σας εξάσκηση<br />για ανάλυση δεξιοτήτων</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm h-full flex flex-col relative overflow-hidden group">
            {/* Декоративний фон */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/10 rounded-full blur-2xl -ml-10 -mt-10 opacity-50 group-hover:opacity-80 transition-opacity" />

            {/* Header */}
            <div className="flex items-center justify-between mb-1 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                        <PenTool size={20} />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider">Εξάσκηση</h3>
                        <p className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest">
                            {overallPercentage}% Επιτυχία · {totalAll} Ερωτ.
                        </p>
                    </div>
                </div>
            </div>

            {/* Radar Chart */}
            <div className="flex-1 relative z-10 min-h-[160px] sm:min-h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="60%" data={data}>
                        <PolarGrid stroke={colors.grid} strokeDasharray="4 4" />

                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: colors.tickFill, fontSize: 9, fontWeight: 700 }}
                        />

                        <PolarRadiusAxis
                            angle={90}
                            domain={[0, 100]}
                            tick={false}
                            axisLine={false}
                        />

                        <Radar
                            name="Επίδοση"
                            dataKey="value"
                            stroke={colors.radarStroke}
                            strokeWidth={2.5}
                            fill={colors.radarFill}
                            fillOpacity={isDark ? 0.2 : 0.15}
                            isAnimationActive={true}
                            animationDuration={800}
                        />

                        <Tooltip
                            cursor={false}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                        <div className="bg-white dark:bg-slate-800 p-3 border border-slate-100 dark:border-slate-700 shadow-xl rounded-xl text-sm">
                                            <p className="font-black text-slate-800 dark:text-white mb-1.5">{d.fullName}</p>
                                            <div className="space-y-1">
                                                <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                                                    {d.value}% Επιτυχία
                                                </p>
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                                    ✓ {d.correct} Σωστές · ✗ {d.incorrect} Λάθος
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
