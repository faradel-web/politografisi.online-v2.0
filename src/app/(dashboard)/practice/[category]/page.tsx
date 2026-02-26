"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import {
    ArrowLeft, Loader2, Lock,
    BookOpen, Headphones, Mic,
    ScrollText, Landmark, Globe, Palette,
    PlayCircle, LayoutGrid, List as ListIcon
} from "lucide-react";
// Імпорти для обмежень
import { useAuth } from "@/contexts/auth-context";
import { GUEST_LIMITS } from "@/lib/constants";

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

export default function CategoryIndexPage({ params }: { params: Promise<{ category: string }> }) {
    const { category } = use(params);

    // --- UPDATED: Отримуємо isPremium замість перевірки ролі вручну
    const { loading: authLoading, isPremium } = useAuth();

    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const currentConfig = CONFIG[category];

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

    if (!currentConfig) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Category not found</div>;

    if (loading || authLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="animate-spin h-10 w-10 text-slate-300" />
        </div>
    );

    // --- UPDATED: Визначаємо обмеження на основі Premium статусу
    // Якщо НЕ преміум (Гість або Прострочений студент) -> Обмежуємо
    const isRestricted = !isPremium;
    const LIMIT = GUEST_LIMITS.CONTENT_ITEMS || 5;

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto">

                {/* HEADER */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/practice" className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all text-slate-400 hover:text-slate-900 shadow-sm">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <currentConfig.icon className="h-6 w-6 text-slate-400" />
                            {currentConfig.title}
                        </h1>
                        <p className="text-slate-500 font-medium text-sm">
                            {currentConfig.type === 'grid'
                                ? 'Επιλέξτε αριθμό ερώτησης'
                                : 'Επιλέξτε θέμα για εξάσκηση'
                            }
                        </p>
                    </div>
                </div>

                {/* --- UPDATED: БАНЕР ОБМЕЖЕННЯ --- */}
                {isRestricted && (
                    <div className="mb-8 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-sm animate-in fade-in zoom-in-95 duration-300">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-full"><Lock size={16} /></div>
                        <div className="text-amber-800">
                            <strong>Περιορισμένη Πρόσβαση:</strong> Έχετε πρόσβαση μόνο στα πρώτα <strong>{LIMIT}</strong> θέματα.
                            <Link href="/profile" className="ml-1 underline font-bold hover:text-amber-950">Αναβαθμίστε τη συνδρομή σας</Link> για πλήρη πρόσβαση.
                        </div>
                    </div>
                )}

                {items.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4 text-slate-300">
                            <Lock size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Δεν βρέθηκαν δεδομένα</h3>
                        <p className="text-slate-400 text-sm mt-1">Η ενότητα είναι υπό κατασκευή.</p>
                    </div>
                ) : (
                    <>
                        {/* --- ВАРІАНТ А: СІТКА (GRID) --- */}
                        {currentConfig.type === 'grid' && (
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                                <div className="flex items-center gap-2 mb-6 text-slate-400 text-xs font-black uppercase tracking-widest">
                                    <LayoutGrid size={16} /> Λίστα Ερωτήσεων
                                </div>
                                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                                    {items.map((item, index) => {
                                        // --- UPDATED: Логіка блокування ---
                                        const isLocked = isRestricted && index >= LIMIT;

                                        if (isLocked) {
                                            return (
                                                <div
                                                    key={item.id}
                                                    className="aspect-square flex items-center justify-center bg-slate-50 text-slate-300 rounded-xl font-bold text-lg border border-slate-100 cursor-not-allowed relative group"
                                                >
                                                    <Lock size={16} className="absolute" />
                                                    <span className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none transition-opacity">
                                                        Locked
                                                    </span>
                                                </div>
                                            )
                                        }

                                        return (
                                            <Link
                                                key={item.id}
                                                href={`/practice/${category}/${item.id}`}
                                                className="aspect-square flex items-center justify-center bg-white hover:bg-slate-900 text-slate-600 hover:text-white rounded-xl font-black text-lg transition-all border border-slate-200 hover:border-slate-900 hover:shadow-lg hover:-translate-y-1"
                                            >
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
                                        // --- UPDATED: Логіка блокування ---
                                        const isLocked = isRestricted && index >= LIMIT;

                                        if (isLocked) {
                                            return (
                                                <div
                                                    key={item.id}
                                                    className="group bg-slate-50 border border-slate-100 p-6 rounded-3xl flex items-start gap-5 cursor-not-allowed opacity-70 grayscale relative overflow-hidden"
                                                >
                                                    <div className="w-12 h-12 shrink-0 bg-slate-200 text-slate-400 rounded-2xl flex items-center justify-center">
                                                        <Lock size={20} />
                                                    </div>
                                                    <div className="flex-1 min-w-0 pt-1">
                                                        <h3 className="font-bold text-slate-400 text-lg leading-tight mb-2 truncate">
                                                            {item.title || `Θέμα ${item.order}`}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                                                            <span>Μόνο Premium</span>
                                                        </div>
                                                    </div>
                                                    {/* Watermark overlay */}
                                                    <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                                                        <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-full">Απαιτείται συνδρομή</span>
                                                    </div>
                                                </div>
                                            )
                                        }

                                        return (
                                            <Link
                                                key={item.id}
                                                href={`/practice/${category}/${item.id}`}
                                                className="group bg-white border border-slate-100 hover:border-blue-200 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-start gap-5"
                                            >
                                                <div className="w-12 h-12 shrink-0 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    {item.order || index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0 pt-1">
                                                    <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2 truncate group-hover:text-blue-600 transition-colors">
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