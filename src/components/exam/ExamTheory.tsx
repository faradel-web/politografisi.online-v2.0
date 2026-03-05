"use client";

import { useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Save } from "lucide-react";
import Quiz, { Question } from "@/components/shared/Quiz";

interface ExamTheoryProps {
    data: Question[];
    answers: any;
    setAnswers: any;
}

export default function ExamTheory({ data, answers, setAnswers }: ExamTheoryProps) {
    // Локальний стейт компонента: яке питання зараз відкрите
    const [currentTheoryIndex, setCurrentTheoryIndex] = useState(0);
    // Локальний стейт для візуальної кнопки "Αποθήκευση розділ"
    const [sectionSaved, setSectionSaved] = useState(false);

    const q = data[currentTheoryIndex];
    if (!q) return null;

    const handleConfirm = () => {
        // Зберігаємо підтвердження в глобальний стейт
        setAnswers((prev: any) => ({
            ...prev,
            theoryConfirmed: { ...prev.theoryConfirmed, [currentTheoryIndex]: true }
        }));
        // Переходимо до наступного питання, якщо це не останнє
        if (currentTheoryIndex < data.length - 1) {
            setCurrentTheoryIndex(p => p + 1);
        }
    };

    return (
        <div className="flex flex-col space-y-8 pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* SIDEBAR: Навігація по питаннях */}
                <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm lg:sticky lg:top-24 overflow-x-auto lg:overflow-visible no-scrollbar">
                    <h3 className="font-black text-slate-400 mb-4 text-[10px] uppercase tracking-widest hidden lg:block">Πλοήγηση</h3>
                    <div className="flex lg:grid lg:grid-cols-5 gap-2 min-w-max lg:min-w-0">
                        {data.map((_, i) => {
                            const isConf = answers.theoryConfirmed[i];
                            const hasAns = answers.theory[i] !== undefined;
                            const s = isConf ? 'bg-emerald-500 border-emerald-500 text-white dark:bg-emerald-600 dark:border-emerald-600' :
                                hasAns ? 'bg-amber-100 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-900/50 dark:text-amber-400' : 'bg-slate-50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800 text-slate-400';
                            return (
                                <button
                                    key={i}
                                    onClick={() => setCurrentTheoryIndex(i)}
                                    className={`w-10 h-10 lg:w-auto lg:aspect-square rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center shrink-0 ${currentTheoryIndex === i ? 'ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-slate-900' : ''} ${s}`}
                                >
                                    {i + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* QUESTION AREA: Основна зона питання */}
                <div className="lg:col-span-9 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                    <div className="flex justify-between items-start mb-6 border-b border-slate-50 dark:border-slate-800 pb-4">
                        <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10 px-3 py-1 rounded-lg uppercase tracking-wide border border-blue-100 dark:border-blue-900/30">
                            {(q as any)._cat || "Θεωρία"}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600 font-mono text-xs">ID: {q.id?.substring(0, 6)}</span>
                    </div>

                    <div className="mb-8">
                        <Quiz
                            questions={[q]}
                            mode="exam"
                            hideSubmit={true}
                            savedAnswers={{ 0: answers.theory[currentTheoryIndex] }}
                            onAnswerUpdate={(ans) => {
                                setAnswers((prev: any) => ({
                                    ...prev,
                                    theory: { ...prev.theory, [currentTheoryIndex]: ans[0] }
                                }))
                            }}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-slate-100 dark:border-slate-800 mt-auto gap-4">
                        <button
                            disabled={currentTheoryIndex === 0}
                            onClick={() => setCurrentTheoryIndex(i => i - 1)}
                            className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-800 dark:text-slate-200 disabled:opacity-30 transition-colors w-full sm:w-auto justify-center p-3 rounded-xl hover:bg-slate-50 dark:bg-slate-950/50"
                        >
                            <ChevronLeft /> Προηγούμενο
                        </button>

                        <div className="flex flex-col-reverse sm:flex-row gap-4 w-full sm:w-auto justify-end">
                            <button
                                onClick={handleConfirm}
                                className="bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-md flex items-center justify-center gap-2 w-full sm:w-auto"
                            >
                                <CheckCircle2 size={18} /> {answers.theoryConfirmed[currentTheoryIndex] ? 'Ενημέρωση' : 'Επιβεβαίωση'}
                            </button>
                            <button
                                disabled={currentTheoryIndex === data.length - 1}
                                onClick={() => setCurrentTheoryIndex(i => i + 1)}
                                className="flex items-center justify-center gap-2 text-slate-900 dark:text-white font-bold hover:text-blue-600 disabled:opacity-30 transition-colors w-full sm:w-auto p-3 rounded-xl hover:bg-slate-50 dark:bg-slate-950/50"
                            >
                                Επόμενο <ChevronRight />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🔥 НОВА КНОПКА ЗБЕРЕЖЕННЯ РОЗДІЛУ (Вбудована в сітку, не плаваюча) 🔥 */}
            <div className="mt-4">
                <button
                    onClick={() => setSectionSaved(true)}
                    className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-2 ${sectionSaved ? 'bg-emerald-500 text-white cursor-default' : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.01]'}`}
                >
                    {sectionSaved ? <><CheckCircle2 /> Αποθηκεύτηκε</> : <><Save /> Αποθήκευση Ενότητας</>}
                </button>
            </div>
        </div>
    );
}