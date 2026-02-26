"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Trophy, Loader2, PlayCircle,
    GraduationCap, Timer, BookOpen,
    BarChart3, Layers, ArrowRight, FileText, Sparkles, PenTool, Home
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs, where, getCountFromServer } from "firebase/firestore";
import { useAuth } from "@/contexts/auth-context";

// Категорії для підрахунку практичних питань
const QUESTION_CATEGORIES = [
    { col: 'questions_history' }, { col: 'questions_politics' },
    { col: 'questions_geography' }, { col: 'questions_culture' },
    { col: 'lessons_reading' }, { col: 'lessons_listening' },
    { col: 'lessons_speaking' }
];

// ВИПРАВЛЕНО: Правильна назва колекції для теорії згідно вашого коду
const THEORY_COLLECTION = 'theory_content';

export default function UserDashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ totalExams: 0, averageScore: 0, successRate: 0 });
    const [contentStats, setContentStats] = useState({ totalQuestions: 0, totalTheoryFiles: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboardData() {
            if (!user) return;

            try {
                // --- 1. СТАТИСТИКА КОРИСТУВАЧА (Екзамени) ---
                const qExam = query(
                    collection(db, "exam_results"),
                    where("userId", "==", user.uid),
                    orderBy("date", "desc"),
                    limit(50)
                );
                const examSnap = await getDocs(qExam);

                let totalScoreSum = 0;
                let validScoresCount = 0;
                let passedCount = 0;

                examSnap.forEach(doc => {
                    const data = doc.data();
                    let val = 0;
                    // Підтримка обох форматів запису результатів
                    if (data.scores) val = (data.scores.theory || 0) + (data.scores.totalLang || 0);
                    else if (typeof data.score === 'number') val = data.score;

                    if (!isNaN(val)) {
                        totalScoreSum += val;
                        validScoresCount++;
                    }

                    let isPassed = data.isPassed !== undefined ? data.isPassed : (val >= 60);
                    if (isPassed) passedCount++;
                });

                const avg = validScoresCount > 0 ? Math.round(totalScoreSum / validScoresCount) : 0;
                const success = validScoresCount > 0 ? Math.round((passedCount / validScoresCount) * 100) : 0;

                setStats({
                    totalExams: examSnap.size,
                    averageScore: avg,
                    successRate: success
                });

                // --- 2. СТАТИСТИКА КОНТЕНТУ (База знань) ---

                // А) Підрахунок питань (Practice)
                const questionCounts = await Promise.allSettled(
                    QUESTION_CATEGORIES.map(cat => getCountFromServer(collection(db, cat.col)))
                );
                let totalQ = 0;
                questionCounts.forEach(res => {
                    if (res.status === 'fulfilled') totalQ += res.value.data().count;
                });

                // Б) Підрахунок теорії (Theory)
                let totalT = 0;
                try {
                    const theoryCountSnap = await getCountFromServer(collection(db, THEORY_COLLECTION));
                    totalT = theoryCountSnap.data().count;
                } catch (e) {
                    console.warn("Theory collection check failed (might be empty).", e);
                }

                setContentStats({ totalQuestions: totalQ, totalTheoryFiles: totalT });

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
    }, [user]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
        </div>
    );

    return (
        <div className="w-full max-w-[1600px] mx-auto space-y-8 pb-20 p-4 sm:p-6 lg:p-8 font-sans">

            {/* 1. HEADER: ПРИВІТАННЯ ΚΑΙ ΚΟΥΜΠΙ АРХΙΚΗΣ */}
            <header className="py-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-serif mb-2">
                        Γεια σου, <span className="text-blue-600">{user?.displayName?.split(' ')[0] || "Σπουδαστή"}</span>! 👋
                    </h1>
                    <p className="text-slate-500 font-medium text-lg flex items-center gap-2">
                        Έτοιμοι για το επόμενο βήμα; <Sparkles size={18} className="text-yellow-500 fill-yellow-500" />
                    </p>
                </div>
                <Link
                    href="/"
                    className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm hover:shadow-md"
                >
                    <Home size={18} /> Αρχική Σελίδα
                </Link>
            </header>

            {/* 2. HERO SECTION (ВІДЕО) */}
            <section className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-blue-100/50 border border-blue-50/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-70 pointer-events-none"></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center relative z-10">

                    {/* VIDEO PLACEHOLDER */}
                    <div className="relative aspect-video bg-slate-900 rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/20 flex items-center justify-center group cursor-pointer border-4 border-white transition-transform hover:scale-[1.01]">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900 to-slate-800 opacity-80"></div>
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>

                        {/* Play Button */}
                        <div className="relative z-10 flex flex-col items-center gap-4 transition-transform duration-500 group-hover:scale-105">
                            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-lg group-hover:bg-white/20 transition-all">
                                <PlayCircle size={40} className="text-white fill-white/20" />
                            </div>
                            <span className="text-white font-black uppercase tracking-widest text-sm bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">
                                Οδηγός Πλατφόρμας
                            </span>
                        </div>
                    </div>

                    {/* MOTIVATIONAL TEXT */}
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-widest">
                            <GraduationCap size={16} /> Πιστοποίηση Ελληνομάθειας
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 leading-tight font-serif">
                            Ο δρόμος προς την <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">Επιτυχία</span>
                        </h2>
                        <p className="text-slate-600 font-medium leading-relaxed text-lg">
                            Η πλατφόρμα που σας προετοιμάζει ολοκληρωμένα για τις Εξετάσεις Πολιτογράφησης. Μελέτη, εξάσκηση και προσομοίωση σε ένα μέρος.
                        </p>
                    </div>
                </div>
            </section>

            {/* 3. MAIN ACTIONS (ΤΡΙ ΚНОПКИ) */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* THEORY CARD */}
                <Link href="/theory" className="group bg-gradient-to-br from-indigo-50 to-white p-8 rounded-[2.5rem] border border-indigo-100 shadow-sm hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden h-full flex flex-col justify-between min-h-[220px]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 group-hover:opacity-80 transition-opacity"></div>

                    <div>
                        <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-200"><BookOpen size={28} /></div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 font-serif">Θεωρία</h3>
                        <p className="text-slate-500 font-medium">Υλικό μελέτης και σημειώσεις.</p>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-indigo-700 font-black text-sm uppercase tracking-wider group-hover:gap-3 transition-all">
                        Μελέτη <ArrowRight size={16} />
                    </div>
                </Link>

                {/* PRACTICE CARD */}
                <Link href="/practice" className="group bg-gradient-to-br from-emerald-50 to-white p-8 rounded-[2.5rem] border border-emerald-100 shadow-sm hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden h-full flex flex-col justify-between min-h-[220px]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 group-hover:opacity-80 transition-opacity"></div>

                    <div>
                        <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-200"><PenTool size={28} /></div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 font-serif">Εξάσκηση</h3>
                        <p className="text-slate-500 font-medium">Ασκήσεις ανά κατηγορία.</p>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-emerald-700 font-black text-sm uppercase tracking-wider group-hover:gap-3 transition-all">
                        Εξάσκηση <ArrowRight size={16} />
                    </div>
                </Link>

                {/* EXAM CARD */}
                <Link href="/exam" className="group bg-slate-900 p-8 rounded-[2.5rem] shadow-xl shadow-slate-900/20 text-white relative overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col justify-between min-h-[220px]">
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -ml-16 -mb-16 group-hover:bg-yellow-400/10 transition-colors"></div>

                    <div>
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-sm text-yellow-400 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:bg-yellow-400 group-hover:text-slate-900 transition-all"><Timer size={28} /></div>
                        <h3 className="text-2xl font-black mb-2 font-serif text-white">Προσομοίωση</h3>
                        <p className="text-slate-400 font-medium group-hover:text-slate-300 transition-colors">Τελικό Τεστ σε πραγματικές συνθήκες.</p>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-yellow-400 font-black text-sm uppercase tracking-wider group-hover:gap-3 transition-all">
                        Ξεκινήστε <ArrowRight size={16} />
                    </div>
                </Link>
            </section>

            {/* 4. OVERVIEW & STATS (BENTO GRID) */}
            <section>
                <div className="flex items-center justify-between mb-6 px-2 mt-4">
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><BarChart3 size={20} className="text-slate-400" /> Επισκόπηση & Πόροι</h2>
                    {stats.totalExams > 0 && (
                        <Link href="/dashboard/stats" className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors group bg-blue-50 px-3 py-1 rounded-full border border-blue-100 hover:border-blue-200">
                            Αναλυτική Στατιστική <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* BLOCK 1: EXAM PERFORMANCE */}
                    <Link href="/dashboard/stats" className="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-purple-200 hover:shadow-md transition-all cursor-pointer relative overflow-hidden lg:col-span-1">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-2xl -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Trophy size={24} /></div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Η Πρόοδός μου</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stats.totalExams} Ολοκληρωμένα Τεστ</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl group-hover:bg-purple-50/50 transition-colors border border-slate-100 group-hover:border-purple-100">
                                <div className="text-2xl font-black text-slate-900 mb-1">{stats.averageScore}%</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Μέσος Όρος</div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl group-hover:bg-purple-50/50 transition-colors border border-slate-100 group-hover:border-purple-100">
                                <div className="text-2xl font-black text-slate-900 mb-1">{stats.successRate}%</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Επιτυχία</div>
                            </div>
                        </div>
                    </Link>

                    {/* BLOCK 2: QUESTIONS BASE */}
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl -ml-10 -mb-10 opacity-50"></div>
                        <div className="flex items-center gap-4 mb-4 relative z-10">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><Layers size={24} /></div>
                            <h3 className="text-lg font-black text-slate-900">Βάση Ερωτήσεων</h3>
                        </div>
                        <div className="relative z-10">
                            <div className="text-4xl font-black text-slate-900 mb-1 font-serif">{contentStats.totalQuestions}</div>
                            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                Διαθέσιμες Ασκήσεις <CheckCircle size={14} className="text-emerald-500" />
                            </div>
                        </div>
                    </div>

                    {/* BLOCK 3: THEORY FILES */}
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl -mr-10 -mb-10 opacity-50"></div>
                        <div className="flex items-center gap-4 mb-4 relative z-10">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><FileText size={24} /></div>
                            <h3 className="text-lg font-black text-slate-900">Υλικό Θεωρίας</h3>
                        </div>
                        <div className="relative z-10">
                            <div className="text-4xl font-black text-slate-900 mb-1 font-serif">{contentStats.totalTheoryFiles}</div>
                            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                Ενότητες & Αρχεία <CheckCircle size={14} className="text-blue-500" />
                            </div>
                        </div>
                    </div>

                </div>
            </section>

        </div>
    );
}

// Helper icons
import { CheckCircle } from "lucide-react";