"use client";

import { useState, useEffect } from "react";
import { CheckCircle, BookOpenCheck, Loader2, RotateCcw } from "lucide-react";
import { updateTheoryProgress, isTheoryLessonRead, removeTheoryProgress } from "@/lib/progress";

interface MarkAsReadButtonProps {
    userId: string;
    lessonId: string;
}

export default function MarkAsReadButton({ userId, lessonId }: MarkAsReadButtonProps) {
    const [status, setStatus] = useState<"idle" | "loading" | "read" | "justMarked">("loading");

    useEffect(() => {
        let cancelled = false;

        async function checkStatus() {
            setStatus("loading");
            try {
                const alreadyRead = await isTheoryLessonRead(userId, lessonId);
                if (!cancelled) {
                    setStatus(alreadyRead ? "read" : "idle");
                }
            } catch {
                if (!cancelled) setStatus("idle");
            }
        }

        if (userId && lessonId) {
            checkStatus();
        }

        return () => { cancelled = true; };
    }, [userId, lessonId]);

    const handleMarkAsRead = async () => {
        if (status === "read" || status === "justMarked" || status === "loading") return;

        setStatus("loading");
        try {
            await updateTheoryProgress(userId, lessonId);
            setStatus("justMarked");
            setTimeout(() => setStatus("read"), 2000);
        } catch (error) {
            console.error("Failed to mark as read:", error);
            setStatus("idle");
        }
    };

    // Скидання — щоб студент міг перечитати урок і знову позначити
    const handleReset = async () => {
        setStatus("loading");
        try {
            await removeTheoryProgress(userId, lessonId);
            setStatus("idle");
        } catch (error) {
            console.error("Failed to reset progress:", error);
            setStatus("read");
        }
    };

    // --- СТАН: завантаження ---
    if (status === "loading") {
        return (
            <div className="mt-8 sm:mt-10 flex justify-center">
                <div className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400 dark:text-slate-500 mx-auto" />
                </div>
            </div>
        );
    }

    // --- СТАН: щойно позначено (2 сек анімація) ---
    if (status === "justMarked") {
        return (
            <div className="mt-8 sm:mt-10 flex justify-center">
                <div className="relative px-5 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-200 dark:border-emerald-800/50 flex items-center gap-3 shadow-lg shadow-emerald-100/50 dark:shadow-emerald-900/20 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/0 via-emerald-100/50 to-emerald-100/0 dark:from-emerald-900/0 dark:via-emerald-900/20 dark:to-emerald-900/0 animate-pulse" />
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center animate-bounce shadow-md shadow-emerald-200 dark:shadow-emerald-900/30">
                            <CheckCircle className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="font-black text-emerald-800 dark:text-emerald-300 text-sm">Μπράβο! 🎉</p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400/80 font-medium">Το μάθημα σημειώθηκε ως ολοκληρωμένο</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- СТАН: прочитано раніше — показуємо підтвердження + кнопку "Ξαναδιάβασε" ---
    if (status === "read") {
        return (
            <div className="mt-8 sm:mt-10 flex justify-center px-4">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    {/* Підтвердження факту прочитання */}
                    <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30">
                        <CheckCircle className="h-5 w-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">Ολοκληρώθηκε ✓</span>
                    </div>

                    {/* Кнопка скидання — щоб перечитати і заново позначити */}
                    <button
                        onClick={handleReset}
                        className="group flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all text-sm font-bold touch-manipulation min-h-[44px]"
                        title="Διάβασε ξανά και σημείωσε ως μη ολοκληρωμένο"
                    >
                        <RotateCcw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                        <span>Ξαναδιάβασε</span>
                    </button>
                </div>
            </div>
        );
    }

    // --- СТАН: ще не прочитано (idle) ---
    return (
        <div className="mt-8 sm:mt-10 flex justify-center px-4">
            <button
                onClick={handleMarkAsRead}
                className="group relative w-full sm:w-auto px-6 sm:px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-blue-200/50 dark:shadow-blue-900/30 hover:from-blue-700 hover:to-indigo-700 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:shadow-md transition-all duration-200 flex items-center justify-center gap-3 overflow-hidden touch-manipulation min-h-[48px]"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <BookOpenCheck className="h-5 w-5 relative z-10" />
                <span className="relative z-10">Σημείωσε ως Μελετημένο</span>
            </button>
        </div>
    );
}
