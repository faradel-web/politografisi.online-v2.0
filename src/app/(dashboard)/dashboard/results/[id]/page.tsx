"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
    Loader2, ArrowLeft, BookOpen, PlayCircle,
    Mic, PenTool, Sparkles, CheckCircle, XCircle,
    AlignLeft, ListChecks
} from "lucide-react";
import GreeceMap from "@/components/shared/GreeceMap";

// --- ТИПІЗАЦІЯ ---
type ResultData = {
    id: string;
    date: any;
    score: number;
    isPassed: boolean;
    answers: {
        theory: Record<string, any>;
        readingA: Record<string, any>;
        readingB: Record<string, any>;
        listeningA: Record<string, any>;
        listeningB: Record<string, any>;
        essay?: string;
        speakingUrl0?: string;
        speakingUrlRandom?: string;
    };
    examSnapshot: any;
    aiFeedback?: {
        theory?: Record<string, any>; // 🔥 Додано фідбек теорії
        writing?: { score: number; feedback: string; };
        speaking?: { score: number; feedback: string; };
    };
    scores?: {
        theory: number;
        reading: number;
        writing: number;
        listening: number;
        speaking: number;
        totalLang: number;
        grandTotal?: number;
    };
};

type MobileView = 'content' | 'questions';

export default function ExamResultDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [result, setResult] = useState<ResultData | null>(null);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<'theory' | 'reading' | 'listening' | 'speaking'>('theory');
    const [mobileView, setMobileView] = useState<MobileView>('content');

    useEffect(() => {
        async function fetchData() {
            try {
                if (!id) return;
                const docRef = doc(db, "exam_results", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    let finalScore = data.score;
                    if (data.scores?.grandTotal !== undefined) {
                        finalScore = data.scores.grandTotal;
                    } else if (data.scores) {
                        finalScore = (data.scores.theory || 0) + (data.scores.totalLang || 0);
                    }

                    const resultData: ResultData = {
                        id: docSnap.id,
                        date: data.date,
                        score: Math.round(finalScore * 10) / 10,
                        isPassed: data.isPassed,
                        answers: data.answers || data.userAnswers || {},
                        examSnapshot: data.examSnapshot || {},
                        aiFeedback: data.aiFeedback,
                        scores: data.scores
                    };
                    setResult(resultData);
                }
            } catch (error) { console.error("Error loading result:", error); }
            finally { setLoading(false); }
        }
        fetchData();
    }, [id]);

    // --- 🔥 HELPER: ПЕРЕВІРКА ПРАВИЛЬНОСТІ ТА БАЛІВ ---
    const calculateQuestionScore = (q: any, ans: any, idx: number, section: 'theory' | 'readingA' | 'readingB' | 'listeningA' | 'listeningB') => {
        let isCorrect = false;
        let score = 0;
        let maxScore = 2; // Default for theory

        const type = (q.type || 'SINGLE').toUpperCase();

        if (section.startsWith('reading')) maxScore = 1;
        else if (section.startsWith('listening')) maxScore = 1.5;

        if (ans === undefined || ans === null) return { isCorrect, score, maxScore };

        // 🟢 MAP
        if (type.includes('MAP')) {
            if (Array.isArray(ans) && q.points) {
                let hits = 0;
                q.points.forEach((target: any, i: number) => {
                    const userPt = ans[i];
                    if (userPt) {
                        const dist = Math.sqrt(Math.pow(userPt.lat - target.lat, 2) + Math.pow(userPt.lng - target.lng, 2));
                        if (dist <= (Number(q.tolerance) || 30)) hits++;
                    }
                });
                isCorrect = hits === q.points.length;
                score = Math.min((hits / q.points.length) * maxScore, maxScore);
            }
            return { isCorrect: score === maxScore, score, maxScore };
        }

        // 🟠 OPEN (ШІ)
        if (type.includes('OPEN') || type.includes('SHORT')) {
            const aiScore = result?.aiFeedback?.theory?.[idx]?.score;
            if (aiScore !== undefined) {
                score = Math.min(Number(aiScore) || 0, maxScore);
                isCorrect = score > 0;
            } else {
                isCorrect = !!ans;
                score = isCorrect ? maxScore : 0;
            }
            return { isCorrect, score, maxScore };
        }

        // 🔵 MULTI
        if (type.includes('MULTI')) {
            if (Array.isArray(ans) && q.correctIndices) {
                const rightPicks = ans.filter((x: number) => q.correctIndices.includes(x)).length;
                const wrongPicks = ans.filter((x: number) => !q.correctIndices.includes(x)).length;
                const netCorrect = Math.max(0, rightPicks - wrongPicks);
                score = (netCorrect / q.correctIndices.length) * maxScore;
                isCorrect = score === maxScore;
            }
            return { isCorrect, score, maxScore };
        }

        // 🟣 MATCHING
        if (type.includes('MATCH')) {
            if (q.pairs) {
                let hits = 0;
                q.pairs.forEach((p: any, i: number) => { if (ans[i] === p.right) hits++; });
                score = (hits / q.pairs.length) * maxScore;
                isCorrect = score === maxScore;
            }
            return { isCorrect, score, maxScore };
        }

        // 🟡 STANDARD
        if (type === 'SINGLE') {
            isCorrect = q.correctAnswerIndex === ans;
            if (isCorrect) score = maxScore;
        }
        else if (type === 'TRUE_FALSE') {
            if (q.items) {
                let hits = 0;
                q.items.forEach((item: any, i: number) => {
                    const userVal = ans[i] ?? ans[String(i)];
                    if (userVal === item.isTrue) hits++;
                });
                score = (hits / q.items.length) * maxScore;
                isCorrect = score === maxScore;
            }
        }
        else if (type === 'FILL_GAP') {
            if (q.textParts) {
                let hits = 0;
                let totalGaps = 0;
                q.textParts.forEach((text: any) => {
                    const gapsCount = Math.max(1, (text.match(/_{2,}/g) || []).length);
                    for (let g = 0; g < gapsCount; g++) {
                        const correctData = q.correctAnswers?.[String(totalGaps)];
                        const userVal = String(ans[String(totalGaps)] || "").trim().toLowerCase();
                        let isCorrect = false;

                        if (Array.isArray(correctData)) {
                            isCorrect = correctData.some(v => String(v).trim().toLowerCase() === userVal);
                        } else {
                            isCorrect = String(correctData || "").trim().toLowerCase() === userVal;
                        }

                        if (isCorrect) hits++;
                        totalGaps++;
                    }
                });
                score = totalGaps > 0 ? (hits / totalGaps) * maxScore : 0;
                isCorrect = score === maxScore;
            }
        }

        return { isCorrect, score, maxScore };
    };

    const MobileTabs = () => (
        <div className="lg:hidden flex border-b border-slate-200 dark:border-slate-800 mb-6 bg-white dark:bg-slate-900 sticky top-[73px] z-10 shadow-sm">
            <button
                onClick={() => setMobileView('content')}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 ${mobileView === 'content' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}
            >
                <AlignLeft size={16} /> Περιεχόμενο
            </button>
            <button
                onClick={() => setMobileView('questions')}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 ${mobileView === 'questions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}
            >
                <ListChecks size={16} /> Ερωτήσεις
            </button>
        </div>
    );

    const renderQuestionResult = (q: any, userAnswer: any, idx: number, section: 'theory' | 'readingA' | 'readingB' | 'listeningA' | 'listeningB') => {
        const type = (q.type || 'SINGLE').toUpperCase();
        const { isCorrect, score, maxScore } = calculateQuestionScore(q, userAnswer, idx, section);

        // Visual styling for borders based on score
        let borderStyle = 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30';
        if (score === maxScore) borderStyle = 'bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30';
        else if (score > 0) borderStyle = 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30'; // Partial points

        return (
            <div key={idx} className={`p-4 sm:p-6 rounded-[1.5rem] border-2 mb-6 ${borderStyle}`}>
                <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${score === maxScore ? 'bg-green-200 dark:bg-green-900/40 text-green-800 dark:text-green-300' : score > 0 ? 'bg-amber-200 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300' : 'bg-red-200 dark:bg-red-900/40 text-red-800 dark:text-red-300'}`}>
                            {idx + 1}
                        </span>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base sm:text-lg leading-snug break-words">{q.question}</h4>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        {score === maxScore
                            ? <div className="text-green-600 dark:text-green-400 flex items-center gap-1 font-bold text-[10px] sm:text-xs bg-green-100 dark:bg-green-900/30 px-2 sm:px-3 py-1 rounded-full shrink-0"><CheckCircle size={14} /> <span className="hidden sm:inline">Σωστό</span></div>
                            : score > 0
                                ? <div className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-bold text-[10px] sm:text-xs bg-amber-100 dark:bg-amber-900/30 px-2 sm:px-3 py-1 rounded-full shrink-0"><CheckCircle size={14} /> <span className="hidden sm:inline">Μερικώς Σωστό</span></div>
                                : <div className="text-red-600 dark:text-red-400 flex items-center gap-1 font-bold text-[10px] sm:text-xs bg-red-100 dark:bg-red-900/30 px-2 sm:px-3 py-1 rounded-full shrink-0"><XCircle size={14} /> <span className="hidden sm:inline">Λάθος</span></div>
                        }
                        <div className="text-xs font-black text-slate-500 dark:text-slate-400 mr-1 mt-1">{score}/{maxScore} pts</div>
                    </div>
                </div>

                {q.imageUrl && !type.includes('MAP') && <img src={q.imageUrl} className="max-h-48 rounded-lg border mb-4 bg-white dark:bg-slate-900 object-contain w-full sm:w-auto" alt="" />}

                {/* 🔥 F. OPEN QUESTIONS (Ανοιχτές ερωτήσεις AI) */}
                {(type.includes('OPEN') || type.includes('SHORT')) && (
                    <div className="space-y-4">
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 break-words">
                            <span className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Η απάντησή σας:</span>
                            {userAnswer || <span className="italic opacity-50">Δεν δόθηκε απάντηση.</span>}
                        </div>

                        {(() => {
                            const feedback = result?.aiFeedback?.theory?.[idx];
                            if (feedback) {
                                return (
                                    <div className={`p-4 rounded-2xl border-2 ${feedback.score === 2 ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-700' : feedback.score === 1 ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-700' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-700'}`}>
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-purple-500" /> AI Αξιολόγηση
                                            </h4>
                                            <span className={`font-black px-3 py-1 rounded-lg text-sm ${feedback.score === 2 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300' : feedback.score === 1 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'}`}>
                                                {feedback.score}/2
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{feedback.feedback}</p>
                                        {feedback.improvedAnswer && (
                                            <div className="text-sm bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800/60">
                                                <span className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Πρότυπο Απάντησης:</span>
                                                <span className="italic text-slate-600 dark:text-slate-400">{feedback.improvedAnswer}</span>
                                            </div>
                                        )}
                                    </div>
                                )
                            }

                            if (q.modelAnswer) {
                                return (
                                    <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <span className="block text-xs font-bold text-slate-400 mb-1 uppercase">Πρότυπο Απάντησης:</span>
                                        <span className="text-sm text-slate-700 dark:text-slate-300">{q.modelAnswer}</span>
                                    </div>
                                )
                            }
                            return null;
                        })()}
                    </div>
                )}

                {/* A. SINGLE CHOICE & MULTI */}
                {(type.includes('SINGLE') || type.includes('MULTI')) && (
                    <div className="grid gap-2">
                        {(q.options || []).map((opt: string, i: number) => {
                            const isMulti = type.includes('MULTI');
                            let isSelected = false;
                            let isTarget = false;

                            if (isMulti) {
                                isSelected = Array.isArray(userAnswer) && userAnswer.includes(i);
                                isTarget = q.correctIndices?.includes(i);
                            } else {
                                isSelected = userAnswer === i;
                                isTarget = q.correctAnswerIndex === i;
                            }

                            let style = "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400";
                            if (isTarget) style = "bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300 font-bold";
                            else if (isSelected) style = "bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 font-bold";

                            return (
                                <div key={i} className={`p-3 rounded-xl border flex items-center gap-3 ${style}`}>
                                    <div className="w-6 h-6 rounded-full border flex items-center justify-center text-xs shrink-0">
                                        {['A', 'B', 'C', 'D'][i] || i + 1}
                                    </div>
                                    <span className="leading-snug text-sm sm:text-base">{opt}</span>
                                    {isSelected && <span className="text-xs ml-auto font-bold">(Επιλογή)</span>}
                                    {isTarget && <span className="text-xs ml-auto font-bold">✓</span>}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* B. TRUE / FALSE */}
                {type.includes('TRUE') && (
                    <div className="space-y-2">
                        {(q.items || []).map((item: any, i: number) => {
                            const userVal = userAnswer?.[i] ?? userAnswer?.[String(i)];
                            const correctVal = item.isTrue;
                            const correct = userVal === correctVal;

                            return (
                                <div key={i} className={`p-3 rounded-xl border flex justify-between items-center ${correct ? 'bg-white dark:bg-slate-900 border-green-200' : 'bg-white dark:bg-slate-900 border-red-200'}`}>
                                    <div className="flex items-center gap-3">
                                        {item.imageUrl && <img src={item.imageUrl} className="w-10 h-10 rounded border" alt="" />}
                                        <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">{item.text}</span>
                                    </div>
                                    <div className="flex gap-2 text-[10px] sm:text-xs font-bold shrink-0">
                                        <span className={userVal === true ? (correctVal ? "text-green-600 bg-green-50 px-2 py-1 rounded" : "text-red-500 bg-red-50 px-2 py-1 rounded") : "text-slate-300 px-2 py-1"}>ΣΩΣΤΟ</span>
                                        <span className={userVal === false ? (correctVal === false ? "text-green-600 bg-green-50 px-2 py-1 rounded" : "text-red-500 bg-red-50 px-2 py-1 rounded") : "text-slate-300 px-2 py-1"}>ΛΑΘΟΣ</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* C. FILL GAP */}
                {type.includes('FILL') && (
                    <div className="space-y-4">
                        {(() => {
                            let totalGaps = 0;
                            return (q.textParts || []).map((text: string, partIdx: number) => {
                                const gapsCount = Math.max(1, (text.match(/_{2,}/g) || []).length);

                                return (
                                    <div key={partIdx} className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed shadow-sm">
                                        <p className="mb-4 text-sm sm:text-base font-serif break-words">{text}</p>

                                        <div className="flex flex-col gap-3">
                                            {Array.from({ length: gapsCount }).map((_, localIdx) => {
                                                const currentGapKey = String(totalGaps++);

                                                const userVal = userAnswer?.[currentGapKey] || "---";
                                                const correctData = q.correctAnswers?.[currentGapKey];
                                                const correctVal = Array.isArray(correctData) ? correctData.join(', ') : (correctData || "");

                                                const cleanUserVal = String(userVal).trim().toLowerCase();
                                                let isCorrect = false;

                                                if (Array.isArray(correctData)) {
                                                    isCorrect = correctData.some(v => String(v).trim().toLowerCase() === cleanUserVal);
                                                } else {
                                                    isCorrect = String(correctData || "").trim().toLowerCase() === cleanUserVal;
                                                }

                                                return (
                                                    <div key={currentGapKey} className="flex flex-col gap-1 w-full bg-slate-50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                                        {gapsCount > 1 && <span className="text-[10px] font-bold text-slate-400 uppercase">Κενό {localIdx + 1}</span>}
                                                        <div className="flex items-center gap-2 text-sm flex-wrap">
                                                            <span className="text-slate-400 font-bold">Απάντηση:</span>
                                                            <span className={`font-bold px-2 py-1 rounded ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                {userVal}
                                                            </span>
                                                            {!isCorrect && correctVal && (
                                                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded font-bold border border-slate-200 dark:border-slate-800 shadow-sm">
                                                                    Σωστό: {correctVal}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                )}

                {/* D. MATCHING */}
                {type.includes('MATCH') && (
                    <div className="space-y-2">
                        {(q.pairs || []).map((pair: any, i: number) => {
                            const userVal = userAnswer?.[i];
                            const correctVal = pair.right;
                            const correct = userVal === correctVal;

                            return (
                                <div key={i} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border gap-2 ${correct ? 'bg-white dark:bg-slate-900 border-green-200' : 'bg-white dark:bg-slate-900 border-red-200'}`}>
                                    <div className="flex items-center gap-2 flex-1">
                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded text-xs font-bold">{i + 1}</span>
                                        {pair.leftImg && <img src={pair.leftImg} className="w-8 h-8 rounded" alt="" />}
                                        <span className="font-bold text-sm text-slate-700 dark:text-slate-300 break-words">{pair.left}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-bold text-sm px-2 py-1 rounded ${correct ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{userVal || "---"}</span>
                                        {!correct && <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded">({pair.right})</span>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* E. MAP */}
                {type.includes('MAP') && (
                    <div className="space-y-4">
                        <div className="h-[300px] sm:h-[400px] border-4 border-white dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm relative">
                            <GreeceMap
                                markers={[
                                    ...(Array.isArray(userAnswer) ? userAnswer : []).map((userPt: any, i: number) => {
                                        const target = q.points?.[i];
                                        let color = '#ef4444';
                                        let label = 'Η επιλογή σας';

                                        if (target) {
                                            const dist = Math.sqrt(Math.pow(userPt.lat - target.lat, 2) + Math.pow(userPt.lng - target.lng, 2));
                                            if (dist <= (Number(q.tolerance) || 30)) {
                                                color = '#10b981';
                                                label = '✅ ' + target.label;
                                            }
                                        }
                                        return { ...userPt, color, label };
                                    }),
                                    ...(q.points || []).flatMap((target: any, i: number) => {
                                        const userPt = Array.isArray(userAnswer) ? userAnswer[i] : null;
                                        let showCorrect = true;

                                        if (userPt) {
                                            const dist = Math.sqrt(Math.pow(userPt.lat - target.lat, 2) + Math.pow(userPt.lng - target.lng, 2));
                                            if (dist <= (Number(q.tolerance) || 30)) showCorrect = false;
                                        }

                                        return showCorrect ? [{
                                            lat: target.lat,
                                            lng: target.lng,
                                            color: '#10b981',
                                            label: target.label + " (Σωστό)"
                                        }] : [];
                                    })
                                ]}
                            />
                        </div>
                        <div className="text-center text-xs font-bold text-slate-400 flex justify-center gap-4">
                            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full"></div> Λάθος επιλογή</span>
                            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div> Σωστή απάντηση</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950/50"><Loader2 className="animate-spin text-blue-600 h-10 w-10" /></div>;
    if (!result || !result.examSnapshot) return <div className="p-20 text-center text-slate-500 dark:text-slate-400 font-medium">Δεν βρέθηκαν δεδομένα εξέτασης.</div>;

    const { examSnapshot, answers, aiFeedback } = result;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 pb-20 font-sans">

            <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-4 sticky top-0 z-20 shadow-sm">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link href="/dashboard/stats" className="flex items-center text-slate-500 dark:text-slate-400 hover:text-blue-600 font-bold text-sm transition-colors group">
                        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" /> <span className="hidden sm:inline">Επιστροφή</span>
                    </Link>
                    <div className="text-sm font-bold text-slate-400 font-mono">
                        {result.date?.toDate ? new Date(result.date.toDate()).toLocaleDateString('el-GR') : ''}
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-4 sm:p-8 space-y-6 sm:space-y-8">

                <div className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 -mr-20 -mt-20 pointer-events-none ${result.isPassed ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div className="z-10 text-center md:text-left">
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">Αποτελέσματα</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base">Αναλυτική ανασκόπηση των απαντήσεων.</p>
                    </div>
                    <div className={`z-10 flex items-center gap-4 sm:gap-6 px-6 py-4 rounded-3xl border-2 ${result.isPassed ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                        <div className="text-right">
                            <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">Σύνολο</div>
                            <div className="text-3xl sm:text-4xl font-black">{Math.round(result.score)}/100</div>
                        </div>
                        <div className="flex flex-col items-center">
                            {result.isPassed ? <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" /> : <XCircle className="h-8 w-8 sm:h-10 sm:w-10 text-red-600" />}
                            <div className="text-[10px] font-black uppercase mt-1 tracking-widest">{result.isPassed ? 'ΕΠΙΤΥΧΙΑ' : 'ΑΠΟΤΥΧΙΑ'}</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-blue-600">
                            <BookOpen size={16} />
                            <span className="font-bold text-sm text-slate-700 dark:text-slate-300">Θεωρία</span>
                        </div>
                        <div className="flex items-end gap-1">
                            <span className="text-2xl font-black text-slate-900 dark:text-white">{result.scores?.theory || 0}</span>
                            <span className="text-sm text-slate-400 font-bold mb-1">/40</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-orange-600">
                            <PenTool size={16} />
                            <span className="font-bold text-sm text-slate-700 dark:text-slate-300">Ανάγνωση & Έκθεση</span>
                        </div>
                        <div className="flex items-end gap-1">
                            <span className="text-2xl font-black text-slate-900 dark:text-white">{(result.scores?.reading || 0) + (result.scores?.writing || 0)}</span>
                            <span className="text-sm text-slate-400 font-bold mb-1">/30</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-purple-600">
                            <PlayCircle size={16} />
                            <span className="font-bold text-sm text-slate-700 dark:text-slate-300">Ακουστική</span>
                        </div>
                        <div className="flex items-end gap-1">
                            <span className="text-2xl font-black text-slate-900 dark:text-white">{result.scores?.listening || 0}</span>
                            <span className="text-sm text-slate-400 font-bold mb-1">/15</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-emerald-600">
                            <Mic size={16} />
                            <span className="font-bold text-sm text-slate-700 dark:text-slate-300">Ομιλία</span>
                        </div>
                        <div className="flex items-end gap-1">
                            <span className="text-2xl font-black text-slate-900 dark:text-white">{result.scores?.speaking || 0}</span>
                            <span className="text-sm text-slate-400 font-bold mb-1">/15</span>
                        </div>
                    </div>
                </div>

                <div className="flex bg-slate-200 dark:bg-slate-800 p-1.5 rounded-2xl w-fit overflow-x-auto max-w-full no-scrollbar">
                    {[
                        { id: 'theory', l: 'Θεωρία', i: BookOpen },
                        { id: 'reading', l: 'Ανάγνωση', i: PenTool },
                        { id: 'listening', l: 'Ακουστική', i: PlayCircle },
                        { id: 'speaking', l: 'Ομιλία', i: Mic }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id as any); setMobileView('content'); }}
                            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300'}`}
                        >
                            <tab.i className="h-4 w-4" /> {tab.l}
                        </button>
                    ))}
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {/* 1. THEORY */}
                    {activeTab === 'theory' && (
                        <div className="space-y-2">
                            {examSnapshot.theory?.map((q: any, i: number) => renderQuestionResult(q, answers.theory?.[i], i, 'theory'))}
                        </div>
                    )}

                    {/* 2. READING */}
                    {activeTab === 'reading' && (
                        <>
                            <MobileTabs />
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                <div className={`${mobileView === 'content' ? 'block' : 'hidden'} lg:block`}>
                                    {examSnapshot.reading?.data && (
                                        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm lg:sticky lg:top-24">
                                            <h3 className="font-black text-lg sm:text-xl mb-6 text-slate-900 dark:text-white flex gap-2 items-center border-b pb-4"><BookOpen /> Κείμενο</h3>
                                            <div className="prose prose-slate max-w-none text-slate-700 dark:text-slate-300 break-words font-medium leading-relaxed">
                                                {examSnapshot.reading.data.textContent}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className={`space-y-2 ${mobileView === 'questions' ? 'block' : 'hidden'} lg:block`}>
                                    {examSnapshot.reading?.partA?.map((q: any, i: number) => renderQuestionResult(q, answers.readingA?.[i], i, 'readingA'))}
                                    {examSnapshot.reading?.partB?.map((q: any, i: number) => renderQuestionResult(q, answers.readingB?.[i], i + 50, 'readingB'))}

                                    <div className="bg-orange-50 dark:bg-orange-900/10 p-6 sm:p-8 rounded-[2.5rem] border border-orange-100 dark:border-orange-900/30 mt-8">
                                        <h3 className="font-black text-orange-900 dark:text-orange-400 mb-6 flex items-center gap-2 text-xl"><PenTool /> Έκθεση</h3>
                                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-orange-100 dark:border-orange-900/30 text-slate-700 dark:text-slate-300 break-words mb-6 shadow-sm min-h-[100px]">
                                            {answers.essay || "Δεν δόθηκε απάντηση."}
                                        </div>
                                        {aiFeedback?.writing ? (
                                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-orange-200 dark:border-orange-900/50 shadow-sm">
                                                <div className="flex justify-between items-center mb-4 border-b border-orange-50 dark:border-orange-900/30 pb-3">
                                                    <h4 className="font-bold text-orange-800 dark:text-orange-400 flex gap-2"><Sparkles className="text-purple-500 fill-purple-500" /> AI Αξιολόγηση</h4>
                                                    <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 px-4 py-1.5 rounded-xl font-black border border-orange-200 dark:border-orange-900/50">{aiFeedback.writing.score}/12</span>
                                                </div>
                                                <p className="text-slate-600 dark:text-slate-400 italic leading-relaxed text-sm">{aiFeedback.writing.feedback}</p>
                                            </div>
                                        ) : (
                                            <div className="text-center text-slate-400 text-sm font-bold bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-dashed border-orange-200 dark:border-orange-900/50">
                                                Δεν ζητήθηκε αξιολόγηση AI
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* 3. LISTENING */}
                    {activeTab === 'listening' && (
                        <>
                            <MobileTabs />
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                                <div className={`${mobileView === 'content' ? 'block' : 'hidden'} lg:block lg:col-span-1`}>
                                    {examSnapshot.listening?.data && (
                                        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm lg:sticky lg:top-24">
                                            <h3 className="font-black text-lg sm:text-xl mb-6 text-purple-900 dark:text-purple-400 flex gap-2 items-center"><PlayCircle /> Ακουστικό</h3>
                                            {examSnapshot.listening.data.audioUrl && (
                                                <audio controls src={examSnapshot.listening.data.audioUrl} className="w-full mb-6 accent-purple-600 dark:accent-purple-500" />
                                            )}
                                            {examSnapshot.listening.data.transcript && (
                                                <div className="p-6 bg-purple-50/50 dark:bg-purple-900/10 rounded-2xl text-sm text-slate-700 dark:text-slate-300 border border-purple-100 dark:border-purple-900/30 leading-loose break-words">
                                                    <strong className="block mb-2 text-purple-900 dark:text-purple-400">Τρανσκριπτικό:</strong>
                                                    {examSnapshot.listening.data.transcript}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className={`space-y-2 ${mobileView === 'questions' ? 'block' : 'hidden'} lg:block lg:col-span-2`}>
                                    {examSnapshot.listening?.partA?.map((q: any, i: number) => renderQuestionResult(q, answers.listeningA?.[i], i, 'listeningA'))}
                                    {examSnapshot.listening?.partB?.map((q: any, i: number) => renderQuestionResult(q, answers.listeningB?.[i], i + 50, 'listeningB'))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* 4. SPEAKING */}
                    {activeTab === 'speaking' && (
                        <div className="space-y-8">
                            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                                <h3 className="font-black text-lg sm:text-xl mb-4 text-emerald-900 dark:text-emerald-400 flex gap-2 items-center"><Mic /> Task 1: General</h3>
                                <p className="text-slate-700 dark:text-slate-300 font-medium mb-6 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 break-words">{examSnapshot.speaking?.lesson0?.prompt}</p>
                                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/30">
                                    <div className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400 mb-2 tracking-widest">Η ηχογράφησή σας</div>
                                    {answers.speakingUrl0 ? (
                                        <audio controls src={answers.speakingUrl0} className="w-full accent-emerald-600 dark:accent-emerald-500" />
                                    ) : <div className="text-slate-400 font-bold text-sm">Δεν ηχογραφήθηκε</div>}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                                <h3 className="font-black text-lg sm:text-xl mb-4 text-emerald-900 dark:text-emerald-400 flex gap-2 items-center"><Mic /> Task 2: Topic</h3>
                                <p className="text-slate-700 dark:text-slate-300 font-medium mb-6 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 break-words">{examSnapshot.speaking?.lessonRandom?.prompt}</p>
                                {examSnapshot.speaking?.lessonRandom?.imageUrls && (
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        {examSnapshot.speaking.lessonRandom.imageUrls.map((url: string, i: number) => (
                                            <img key={i} src={url} className="rounded-xl border border-slate-200 dark:border-slate-800 h-40 object-cover w-full bg-slate-100 dark:bg-slate-800" alt="" />
                                        ))}
                                    </div>
                                )}
                                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/30 mb-6">
                                    <div className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400 mb-2 tracking-widest">Η ηχογράφησή σας</div>
                                    {answers.speakingUrlRandom ? (
                                        <audio controls src={answers.speakingUrlRandom} className="w-full accent-emerald-600 dark:accent-emerald-500" />
                                    ) : <div className="text-slate-400 font-bold text-sm">Δεν ηχογραφήθηκε</div>}
                                </div>
                                {aiFeedback?.speaking ? (
                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/30">
                                        <div className="flex justify-between items-center mb-4 border-b border-emerald-50 dark:border-emerald-900/10 pb-3">
                                            <h4 className="font-bold text-emerald-800 dark:text-emerald-400 flex gap-2"><Sparkles className="text-purple-500 fill-purple-500" /> AI Αξιολόγηση</h4>
                                            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 px-4 py-1.5 rounded-xl font-black border border-emerald-200 dark:border-emerald-900/30">{aiFeedback.speaking.score}/15</span>
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-400 italic leading-relaxed text-sm">{aiFeedback.speaking.feedback}</p>
                                    </div>
                                ) : (
                                    <div className="text-center text-slate-400 text-sm font-bold bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                                        Δεν ζητήθηκε αξιολόγηση AI
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}