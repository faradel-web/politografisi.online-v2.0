"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, query, orderBy, limit, getDocs } from "firebase/firestore";
import {
    ArrowLeft, Save, Loader2, List, AlignLeft, RefreshCcw, ToggleLeft,
    CheckSquare, FileText, Bug, Image as ImageIcon
} from "lucide-react";
import { QuestionType } from "@/types/exam-types";

// --- НАЛАШТУВАННЯ ---
const COLLECTION_NAME = "questions_politics";
const PAGE_TITLE = "Πολιτική (Updated Editor)";

// --- ТИПИ ---
const EDITOR_MODES = [
    { id: 'SINGLE', label: 'Τεστ (1 απάντηση)', icon: List },
    { id: 'MULTI', label: 'Πολλαπλή επιλογή', icon: CheckSquare },
    { id: 'MATCHING', label: 'Αντιστοίχιση', icon: RefreshCcw },
    { id: 'FILL_GAP', label: 'Κενά', icon: AlignLeft },
    { id: 'TRUE_FALSE', label: 'True / False', icon: ToggleLeft },
    { id: 'OPEN', label: 'Ανοιχτό Ερώτημα', icon: FileText },
];

export default function PoliticsEditorPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold dark:text-slate-400">Φόρτωση...</div>}>
            <EditorContent />
        </Suspense>
    );
}

function EditorContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("id");

    const [isSaving, setIsSaving] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showDebug, setShowDebug] = useState(false);
    const [rawData, setRawData] = useState<any>(null);

    // --- STATE ---
    const [order, setOrder] = useState<number>(1);
    const [mode, setMode] = useState<QuestionType>('SINGLE');
    const [questionText, setQuestionText] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    const [options, setOptions] = useState<string[]>(["", "", "", ""]);
    const [correctIndices, setCorrectIndices] = useState<number[]>([0]);
    const [pairs, setPairs] = useState<{ left: string, right: string }[]>([{ left: "", right: "" }, { left: "", right: "" }]);
    const [sentences, setSentences] = useState<string[]>([""]);
    const [blankAnswers, setBlankAnswers] = useState<string[]>([""]);
    const [wordBank, setWordBank] = useState<string[]>([]);
    const [tfItems, setTfItems] = useState<{ text: string, isTrue: boolean }[]>([{ text: "", isTrue: true }, { text: "", isTrue: true }]);
    const [modelAnswer, setModelAnswer] = useState("");

    const padArray = (arr: any[], len: number, fill: any) => {
        const res = [...(arr || [])];
        while (res.length < len) res.push(fill);
        return res;
    };

    useEffect(() => {
        const init = async () => {
            try {
                if (editId) {
                    const snap = await getDoc(doc(db, COLLECTION_NAME, editId));
                    if (snap.exists()) {
                        const data = snap.data();
                        setRawData(data);
                        setOrder(data.order || 1);
                        setQuestionText(data.question || data.question_text || "");
                        setImageUrl(data.imageUrl || "");

                        let type = data.type || 'SINGLE';
                        if (type === 'multiple-choice') type = 'SINGLE';
                        if (type === 'multiple-choice-multiple') type = 'MULTI';
                        if (type === 'matching') type = 'MATCHING';
                        if (type.includes('fill')) type = 'FILL_GAP';
                        if (type.includes('true')) type = 'TRUE_FALSE';
                        if (type.includes('open')) type = 'OPEN';

                        setMode(type as QuestionType);

                        if (type === 'SINGLE' || type === 'MULTI') {
                            setOptions(padArray(data.options || [], 4, ""));
                            if (data.correctIndices) setCorrectIndices(data.correctIndices);
                            else if (data.correctAnswerIndex !== undefined) setCorrectIndices([data.correctAnswerIndex]);
                        }
                        if (type === 'MATCHING') {
                            if (data.pairs) setPairs(padArray(data.pairs, 4, { left: "", right: "" }));
                        }
                        if (type === 'FILL_GAP') {
                            setSentences(data.textParts || data.sentences || [""]);
                            if (data.correctAnswers && !Array.isArray(data.correctAnswers)) {
                                setBlankAnswers(Object.values(data.correctAnswers));
                            } else {
                                setBlankAnswers(data.correctAnswers || []);
                            }
                            setWordBank(data.wordBank || data.options || []);
                        }
                        if (type === 'TRUE_FALSE') {
                            if (data.items) setTfItems(data.items);
                            else if (data.statements) {
                                setTfItems(data.statements.map((s: string, i: number) => ({
                                    text: s,
                                    isTrue: data.correctBooleans ? data.correctBooleans[i] : true
                                })));
                            }
                        }
                        if (type === 'OPEN') {
                            setModelAnswer(data.modelAnswer || data.correctAnswer || "");
                        }
                    }
                } else {
                    const q = query(collection(db, COLLECTION_NAME), orderBy("order", "desc"), limit(1));
                    const snap = await getDocs(q);
                    if (!snap.empty) setOrder(snap.docs[0].data().order + 1);
                }
            } catch (e) { console.error(e); }
            finally { setIsLoaded(true); }
        };
        init();
    }, [editId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const baseDoc: any = {
                order: Number(order),
                type: mode,
                question: questionText,
                imageUrl: imageUrl || null,
                updatedAt: serverTimestamp(),
                category: 'politics'
            };

            if (mode === 'SINGLE') {
                baseDoc.options = options.filter(o => o.trim());
                baseDoc.correctAnswerIndex = correctIndices[0];
            }
            else if (mode === 'MULTI') {
                baseDoc.options = options.filter(o => o.trim());
                baseDoc.correctIndices = correctIndices;
            }
            else if (mode === 'MATCHING') {
                baseDoc.pairs = pairs.filter(p => p.left.trim() && p.right.trim());
            }
            else if (mode === 'FILL_GAP') {
                baseDoc.textParts = sentences.filter(s => s.trim());
                baseDoc.mode = wordBank.length > 0 ? 'GLOBAL' : 'TYPING';
                baseDoc.wordBank = wordBank.filter(w => w.trim());
                const answersMap: any = {};
                blankAnswers.forEach((ans, i) => { if (ans) answersMap[i] = ans; });
                baseDoc.correctAnswers = answersMap;
            }
            else if (mode === 'TRUE_FALSE') {
                baseDoc.items = tfItems.filter(i => i.text.trim());
            }
            else if (mode === 'OPEN') {
                baseDoc.modelAnswer = modelAnswer;
            }

            if (editId) {
                await updateDoc(doc(db, COLLECTION_NAME, editId), baseDoc);
                alert("Ενημερώθηκε με επιτυχία!");
            } else {
                await addDoc(collection(db, COLLECTION_NAME), { ...baseDoc, createdAt: serverTimestamp() });
                if (confirm("Δημιουργήθηκε! Να προστεθεί κι άλλο;")) {
                    setOrder(prev => prev + 1);
                    setQuestionText("");
                } else {
                    router.push('/admin/manage');
                }
            }
        } catch (e: any) {
            alert("Σφάλμα: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isLoaded) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 h-8 w-8" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 font-sans pb-40 transition-colors">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <Link href="/admin/manage" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-bold transition-colors"><ArrowLeft size={18} /> Πίσω</Link>
                    <div className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">{COLLECTION_NAME}</div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-start mb-4">
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white">{PAGE_TITLE}</h1>
                            <input type="number" value={order} onChange={e => setOrder(Number(e.target.value))} className="w-20 p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-600 rounded-xl font-black text-center dark:text-white" />
                        </div>

                        <div className="space-y-4">
                            <textarea value={questionText} onChange={e => setQuestionText(e.target.value)} placeholder="Κείμενο ερώτησης..." className="w-full p-4 bg-slate-50 dark:bg-slate-800 border dark:border-slate-600 rounded-2xl text-lg font-bold outline-none dark:text-white dark:placeholder-slate-500" />
                            <div className="flex gap-2">
                                <ImageIcon className="text-slate-400 dark:text-slate-500" />
                                <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="URL εικόνας (προαιρετικό)" className="flex-1 bg-transparent outline-none text-sm dark:text-slate-300 dark:placeholder-slate-500" />
                            </div>
                        </div>
                    </div>

                    {/* MODE SELECTOR */}
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {EDITOR_MODES.map((m) => (
                            <button key={m.id} type="button" onClick={() => setMode(m.id as QuestionType)} className={`p-4 rounded-xl font-bold text-xs border-2 flex flex-col items-center gap-2 transition-colors ${mode === m.id ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-transparent dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'}`}>
                                <m.icon size={20} /> {m.label}
                            </button>
                        ))}
                    </div>

                    {/* DYNAMIC FIELDS */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700">

                        {(mode === 'SINGLE' || mode === 'MULTI') && (
                            <div className="space-y-3">
                                {options.map((opt, i) => (
                                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${correctIndices.includes(i) ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 dark:border-emerald-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                                        <button type="button" onClick={() => {
                                            if (mode === 'SINGLE') setCorrectIndices([i]);
                                            else setCorrectIndices(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
                                        }} className="w-8 h-8 rounded bg-white dark:bg-slate-700 border dark:border-slate-600 flex items-center justify-center font-bold dark:text-white">{['A', 'B', 'C', 'D'][i]}</button>
                                        <input value={opt} onChange={e => { const n = [...options]; n[i] = e.target.value; setOptions(n) }} className="flex-1 bg-transparent outline-none dark:text-white dark:placeholder-slate-500" placeholder={`Επιλογή ${i + 1}`} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {mode === 'MATCHING' && (
                            <div className="space-y-3">
                                {pairs.map((p, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input value={p.left} onChange={e => { const n = [...pairs]; n[i].left = e.target.value; setPairs(n) }} className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-700 dark:text-white dark:placeholder-slate-500" placeholder="Αριστερό τμήμα" />
                                        <input value={p.right} onChange={e => { const n = [...pairs]; n[i].right = e.target.value; setPairs(n) }} className="flex-1 p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl border border-emerald-100 dark:border-emerald-800 dark:text-white dark:placeholder-slate-500" placeholder="Δεξί τμήμα" />
                                    </div>
                                ))}
                                <button type="button" onClick={() => setPairs([...pairs, { left: "", right: "" }])} className="text-xs font-bold text-blue-500 dark:text-blue-400">+ Προσθήκη Ζεύγους</button>
                            </div>
                        )}

                        {mode === 'FILL_GAP' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500">Πρόταση</label>
                                    {sentences.map((s, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input value={s} onChange={e => { const n = [...sentences]; n[i] = e.target.value; setSentences(n) }} className="flex-[3] p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-700 dark:text-white dark:placeholder-slate-500" placeholder="Κείμενο (χρησιμοποιήστε (1))..." />
                                            <input value={blankAnswers[i]} onChange={e => { const n = [...blankAnswers]; n[i] = e.target.value; setBlankAnswers(n) }} className="flex-1 p-3 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-xl font-bold dark:text-white dark:placeholder-slate-500" placeholder="Απάντηση" />
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => { setSentences([...sentences, ""]); setBlankAnswers([...blankAnswers, ""]) }} className="text-xs font-bold text-blue-500 dark:text-blue-400">+ Προσθήκη Πρότασης</button>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500">Τράπεζα λέξεων (Προαιρετικά)</label>
                                    <input value={wordBank.join(", ")} onChange={e => setWordBank(e.target.value.split(",").map(s => s.trim()))} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-700 dark:text-white dark:placeholder-slate-500" placeholder="Λέξεις χωρισμένες με κόμμα..." />
                                </div>
                            </div>
                        )}

                        {mode === 'TRUE_FALSE' && (
                            <div className="space-y-3">
                                {tfItems.map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                        <input value={item.text} onChange={e => { const n = [...tfItems]; n[i].text = e.target.value; setTfItems(n) }} className="flex-1 bg-transparent outline-none dark:text-white dark:placeholder-slate-500" placeholder="Δήλωση..." />
                                        <button type="button" onClick={() => { const n = [...tfItems]; n[i].isTrue = !n[i].isTrue; setTfItems(n) }} className={`px-3 py-1 rounded text-xs font-bold ${item.isTrue ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                            {item.isTrue ? "TRUE" : "FALSE"}
                                        </button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => setTfItems([...tfItems, { text: "", isTrue: true }])} className="text-xs font-bold text-blue-500 dark:text-blue-400">+ Προσθήκη</button>
                            </div>
                        )}

                        {mode === 'OPEN' && (
                            <textarea value={modelAnswer} onChange={e => setModelAnswer(e.target.value)} className="w-full p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800 min-h-[150px] dark:text-white dark:placeholder-slate-500" placeholder="Πρότυπη απάντηση..." />
                        )}

                    </div>

                    <button disabled={isSaving} className="w-full py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors">
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save />} Αποθήκευση
                    </button>
                </form>

                <div className="mt-8 border-t dark:border-slate-700 pt-4">
                    <button onClick={() => setShowDebug(!showDebug)} className="text-xs font-bold text-slate-400 flex gap-2 items-center"><Bug size={14} /> Debug Data</button>
                    {showDebug && <pre className="mt-2 p-4 bg-slate-900 text-slate-300 rounded-xl text-xs overflow-auto">{JSON.stringify(rawData, null, 2)}</pre>}
                </div>
            </div>
        </div>
    );
}