"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import {
    ArrowLeft, Loader2, Lock,
    BookOpen, Headphones, Mic,
    ScrollText, Landmark, Globe, Palette,
    PlayCircle, LayoutGrid, List as ListIcon,
    Shuffle, CheckCircle2, XCircle, CircleDashed,
    Zap, ArrowRight
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { GUEST_LIMITS } from "@/lib/constants";
import { getPracticeResultsForCategory } from "@/lib/progress";

// --- КОНФІГУРАЦІЯ КАТЕГОРІЙ ---
const CONFIG: Record<string, { col: string, title: string, type: 'grid' | 'list', icon: any }> = {
    'history': { col: 'questions_history', title: 'Ιστορία', type: 'grid', icon: ScrollText },
    'politics': { col: 'questions_politics', title: 'Πολιτικοί Θεσμοί', type: 'grid', icon: Landmark },
    'culture': { col: 'questions_culture', title: 'Πολιτισμός', type: 'grid', icon: Palette },
    'geography': { col: 'questions_geography', title: 'Γεωγραφία', type: 'grid', icon: Globe },
    'reading': { col: 'lessons_reading', title: 'Κατανόηση Γραπτού Λόγου', type: 'list', icon: BookOpen },
    'listening': { col: 'lessons_listening', title: 'Κατανόηση Προφορικού Λόγου', type: 'list', icon: Headphones },
    'speaking': { col: 'lessons_speaking', title: 'Παραγωγή Προφορικού Λόγου', type: 'list', icon: Mic },
};

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export default function CategoryIndexPage({ params }: { params: Promise<{ category: string }> }) {
    const { category } = use(params);
    const router = useRouter();

    const { loading: authLoading, isPremium, user } = useAuth();

    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<'list' | 'random'>('list');

    // Per-question results: { questionId: isCorrect }
    const [practiceResults, setPracticeResults] = useState<Record<string, boolean>>({});
    const [resultsLoading, setResultsLoading] = useState(false);

    const currentConfig = CONFIG[category];

    // Fetch questions
    useEffect(() => {
        async function fetchData() {
            if (!currentConfig) {
                setLoading(false);
                return;
            }
            try {
                const colRef = collection(db, currentConfig.col);
                const q = query(colRef, orderBy("order", "asc"));
                const snapshot = await getDocs(q);
                const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                docs.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
                setItems(docs);
            } catch (err) {
                console.error("Error fetching items:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [category, currentConfig]);

    // Fetch practice results for grid categories (when user is logged in)
    useEffect(() => {
        async function fetchResults() {
            if (!user?.uid || !currentConfig || currentConfig.type !== 'grid') return;
            setResultsLoading(true);
            try {
                const results = await getPracticeResultsForCategory(user.uid, category);
                setPracticeResults(results);
            } catch (e) {
                console.warn("Failed to load practice results:", e);
            } finally {
                setResultsLoading(false);
            }
        }
        if (!authLoading) fetchResults();
    }, [user?.uid, category, currentConfig, authLoading]);

    // Smart random start handler
    const handleStartRandom = useCallback(() => {
        if (items.length === 0) return;

        const isRestricted = !isPremium;
        const LIMIT = GUEST_LIMITS.CONTENT_ITEMS || 5;
        const availableItems = isRestricted ? items.slice(0, LIMIT) : items;

        // Split into priority groups
        const incorrect: any[] = [];
        const unanswered: any[] = [];
        const correct: any[] = [];

        availableItems.forEach(item => {
            const result = practiceResults[item.id];
            if (result === undefined) {
                unanswered.push(item);
            } else if (result === false) {
                incorrect.push(item);
            } else {
                correct.push(item);
            }
        });

        // Smart order: errors first, then unanswered, then correct
        const smartOrder = [
            ...shuffle(incorrect),
            ...shuffle(unanswered),
            ...shuffle(correct),
        ];

        if (smartOrder.length === 0) return;

        // Navigate to first question with order param
        const orderIds = smartOrder.map(q => q.id).join(',');
        router.push(`/practice/${category}/${smartOrder[0].id}?order=${encodeURIComponent(orderIds)}`);
    }, [items, practiceResults, isPremium, category, router]);

    if (!currentConfig) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Category not found</div>;

    if (loading || authLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950/50">
            <Loader2 className="animate-spin h-10 w-10 text-slate-300" />
        </div>
    );

    const isRestricted = !isPremium;
    const LIMIT = GUEST_LIMITS.CONTENT_ITEMS || 5;

    // Count stats for the smart random panel
    const availableItems = isRestricted ? items.slice(0, LIMIT) : items;
    const incorrectCount = availableItems.filter(item => practiceResults[item.id] === false).length;
    const unansweredCount = availableItems.filter(item => practiceResults[item.id] === undefined).length;
    const correctCount = availableItems.filter(item => practiceResults[item.id] === true).length;
    const totalAnswered = correctCount + incorrectCount;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto">

                {/* HEADER */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/practice" className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-100 dark:bg-slate-800 transition-all text-slate-400 hover:text-slate-900 dark:text-white shadow-sm">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <currentConfig.icon className="h-6 w-6 text-slate-400" />
                            {currentConfig.title}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                            {currentConfig.type === 'grid'
                                ? 'Επιλέξτε αριθμό ερώτησης'
                                : 'Επιλέξτε θέμα για εξάσκηση'
                            }
                        </p>
                    </div>
                </div>

                {/* БАНЕР ОБМЕЖЕННЯ */}
                {isRestricted && (
                    <div className="mb-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl flex items-center gap-3 text-sm animate-in fade-in zoom-in-95 duration-300">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full"><Lock size={16} /></div>
                        <div className="text-amber-800 dark:text-amber-300">
                            <strong>Περιορισμένη Πρόσβαση:</strong> Έχετε πρόσβαση μόνο στα πρώτα <strong>{LIMIT}</strong> θέματα.
                            <Link href="/profile" className="ml-1 underline font-bold hover:text-amber-950 dark:hover:text-amber-200">Αναβαθμίστε τη συνδρομή σας</Link> για πλήρη πρόσβαση.
                        </div>
                    </div>
                )}

                {items.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="inline-flex p-4 bg-slate-50 dark:bg-slate-950/50 rounded-full mb-4 text-slate-300">
                            <Lock size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Δεν βρέθηκαν δεδομένα</h3>
                        <p className="text-slate-400 text-sm mt-1">Η ενότητα είναι υπό κατασκευή.</p>
                    </div>
                ) : (
                    <>
                        {/* --- MODE TOGGLE (тільки для grid категорій) --- */}
                        {currentConfig.type === 'grid' && (
                            <div className="mb-6">
                                {/* Toggle tabs */}
                                <div className="inline-flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-sm">
                                    <button
                                        onClick={() => setMode('list')}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all ${mode === 'list'
                                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                                            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                            }`}
                                    >
                                        <LayoutGrid size={16} /> Λίστα
                                    </button>
                                    <button
                                        onClick={() => setMode('random')}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all ${mode === 'random'
                                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-200 dark:shadow-violet-900/30'
                                            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                            }`}
                                    >
                                        <Shuffle size={16} /> Τυχαία Σειρά
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* --- SMART RANDOM PANEL --- */}
                        {currentConfig.type === 'grid' && mode === 'random' && (
                            <div className="mb-8 bg-gradient-to-br from-violet-50 via-indigo-50 to-white dark:from-violet-950/40 dark:via-indigo-950/30 dark:to-slate-900 rounded-[2.5rem] border border-violet-100 dark:border-violet-900/30 shadow-sm p-8 relative overflow-hidden">
                                {/* Decorative bg */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-100 dark:bg-violet-900/20 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/30">
                                            <Zap size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Έξυπνη Τυχαία Σειρά</h3>
                                            <p className="text-sm font-bold text-violet-600 dark:text-violet-400">Προτεραιότητα στα λάθη & αναπάντητα</p>
                                        </div>
                                    </div>

                                    {/* Stats cards */}
                                    <div className="grid grid-cols-3 gap-3 mb-6">
                                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-red-100 dark:border-red-900/30 text-center">
                                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                                <XCircle size={16} className="text-red-500" />
                                                <span className="text-2xl font-black text-red-600 dark:text-red-400">{incorrectCount}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-red-400 dark:text-red-500 uppercase tracking-widest">Λάθη</p>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 text-center">
                                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                                <CircleDashed size={16} className="text-slate-400" />
                                                <span className="text-2xl font-black text-slate-600 dark:text-slate-300">{unansweredCount}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Αναπάντητα</p>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-900/30 text-center">
                                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                                <CheckCircle2 size={16} className="text-emerald-500" />
                                                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{correctCount}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-emerald-400 dark:text-emerald-500 uppercase tracking-widest">Σωστά</p>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    {totalAnswered > 0 && (
                                        <div className="mb-6">
                                            <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                                                <span>Πρόοδος</span>
                                                <span>{totalAnswered}/{availableItems.length} ({Math.round((totalAnswered / availableItems.length) * 100)}%)</span>
                                            </div>
                                            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                                                {correctCount > 0 && (
                                                    <div
                                                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                                                        style={{ width: `${(correctCount / availableItems.length) * 100}%` }}
                                                    />
                                                )}
                                                {incorrectCount > 0 && (
                                                    <div
                                                        className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500"
                                                        style={{ width: `${(incorrectCount / availableItems.length) * 100}%` }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Start button */}
                                    <button
                                        onClick={handleStartRandom}
                                        disabled={resultsLoading}
                                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white py-4 px-8 rounded-2xl font-black text-lg shadow-xl shadow-violet-200/50 dark:shadow-violet-900/30 hover:-translate-y-0.5 hover:shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {resultsLoading ? (
                                            <Loader2 className="animate-spin h-6 w-6" />
                                        ) : (
                                            <>
                                                <Shuffle size={22} />
                                                Ξεκινήστε ({incorrectCount + unansweredCount > 0 ? `${incorrectCount + unansweredCount} προτεραιότητας` : `${availableItems.length} ερωτήσεις`})
                                                <ArrowRight size={20} />
                                            </>
                                        )}
                                    </button>

                                    {/* Hint */}
                                    <p className="text-center text-xs font-medium text-violet-400 dark:text-violet-500 mt-3">
                                        💡 Πρώτα εμφανίζονται τα λάθη, μετά οι αναπάντητες και τέλος οι σωστές
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* --- ВАРІАНТ А: СІТКА (GRID) --- */}
                        {currentConfig.type === 'grid' && mode === 'list' && (
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2 mb-6 text-slate-400 text-xs font-black uppercase tracking-widest">
                                    <LayoutGrid size={16} /> Λίστα Ερωτήσεων
                                </div>
                                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                                    {items.map((item, index) => {
                                        const isLocked = isRestricted && index >= LIMIT;

                                        if (isLocked) {
                                            return (
                                                <div
                                                    key={item.id}
                                                    className="aspect-square flex items-center justify-center bg-slate-50 dark:bg-slate-950/50 text-slate-300 dark:text-slate-600 rounded-xl font-bold text-lg border border-slate-100 dark:border-slate-800 cursor-not-allowed relative group"
                                                >
                                                    <Lock size={16} className="absolute" />
                                                    <span className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none transition-opacity">
                                                        Locked
                                                    </span>
                                                </div>
                                            )
                                        }

                                        // Determine status color
                                        const result = practiceResults[item.id];
                                        let statusBorder = "border-slate-200 dark:border-slate-800";
                                        let statusIndicator = null;

                                        if (result === true) {
                                            statusBorder = "border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-100 dark:ring-emerald-900/30";
                                            statusIndicator = <CheckCircle2 size={10} className="text-emerald-500 absolute top-1 right-1" />;
                                        } else if (result === false) {
                                            statusBorder = "border-red-300 dark:border-red-700 ring-1 ring-red-100 dark:ring-red-900/30";
                                            statusIndicator = <XCircle size={10} className="text-red-500 absolute top-1 right-1" />;
                                        }

                                        return (
                                            <Link
                                                key={item.id}
                                                href={`/practice/${category}/${item.id}`}
                                                className={`aspect-square flex items-center justify-center bg-white dark:bg-slate-900 hover:bg-slate-900 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-white rounded-xl font-black text-lg transition-all border ${statusBorder} hover:border-slate-900 dark:hover:border-slate-600 hover:shadow-lg hover:-translate-y-1 relative`}
                                            >
                                                {statusIndicator}
                                                {item.order || index + 1}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* --- ВАРІАНТ Б: СПИСОК (LIST) --- */}
                        {currentConfig.type === 'list' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2 px-4 text-slate-400 text-xs font-black uppercase tracking-widest">
                                    <ListIcon size={16} /> Διαθέσιμα Μαθήματα
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {items.map((item, index) => {
                                        const isLocked = isRestricted && index >= LIMIT;

                                        if (isLocked) {
                                            return (
                                                <div
                                                    key={item.id}
                                                    className="group bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl flex items-start gap-5 cursor-not-allowed opacity-70 grayscale relative overflow-hidden"
                                                >
                                                    <div className="w-12 h-12 shrink-0 bg-slate-200 text-slate-400 rounded-2xl flex items-center justify-center">
                                                        <Lock size={20} />
                                                    </div>
                                                    <div className="flex-1 min-w-0 pt-1">
                                                        <h3 className="font-bold text-slate-400 text-lg leading-tight mb-2 break-words">
                                                            {item.title || `Θέμα ${item.order}`}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                                                            <span>Μόνο Premium</span>
                                                        </div>
                                                    </div>
                                                    <div className="absolute inset-0 bg-white dark:bg-slate-900/50 z-10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                                                        <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-full">Απαιτείται συνδρομή</span>
                                                    </div>
                                                </div>
                                            )
                                        }

                                        return (
                                            <Link
                                                key={item.id}
                                                href={`/practice/${category}/${item.id}`}
                                                className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-blue-200 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-start gap-5"
                                            >
                                                <div className="w-12 h-12 shrink-0 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    {item.order || index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0 pt-1">
                                                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg leading-tight mb-2 break-words group-hover:text-blue-600 transition-colors">
                                                        {item.title || `Θέμα ${item.order}`}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                        <PlayCircle size={14} />
                                                        <span>Έναρξη</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}