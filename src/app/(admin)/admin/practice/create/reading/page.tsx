"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
    ArrowLeft, Save, Loader2, BookOpen, CheckSquare, Type,
    Plus, Trash2, Image as ImageIcon,
    X, Bug, FileJson, Sparkles, PenTool
} from "lucide-react";
import { QuestionType } from "@/types/exam-types"; // Standard

// --- TYPES FOR READING ---
const READING_QUESTION_TYPES = [
    { label: "Επιλογή (Single Choice)", value: "SINGLE" },
    { label: "True / False", value: "TRUE_FALSE" },
    { label: "Συμπλήρωση Λέξης (Fill Gap)", value: "FILL_GAP" },
    { label: "Αντιστοίχιση", value: "MATCHING" },
];

export default function ReadingEditorPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Φόρτωση...</div>}>
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
    const [isUploading, setIsUploading] = useState(false);
    const [showDebug, setShowDebug] = useState(false);

    // --- STATE ---
    const [title, setTitle] = useState("");
    const [mainText, setMainText] = useState("");
    const [images, setImages] = useState<string[]>([]);

    // PART A
    const [partAQuestions, setPartAQuestions] = useState<any[]>([]);

    // PART B
    const [partBQuestions, setPartBQuestions] = useState<any[]>([]);

    // PART C
    const [writingPrompt, setWritingPrompt] = useState("");
    const [writingModelAnswer, setWritingModelAnswer] = useState("");

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setIsUploading(true);
            try {
                const file = e.target.files[0];
                const storageRef = ref(storage, `reading_images/${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                const url = await getDownloadURL(snapshot.ref);
                setImages(prev => [...prev, url]);
            } catch (err) { alert("Σφάλμα φόρτωσης"); }
            finally { setIsUploading(false); }
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                if (editId) {
                    const docRef = doc(db, "lessons_reading", editId);
                    const snap = await getDoc(docRef);
                    if (snap.exists()) {
                        const data = snap.data();
                        setTitle(data.title || "");
                        setImages(data.imageUrls || []);
                        setMainText(data.textContent || data.text_content || "");

                        if (data.parts) {
                            const pA = data.parts.partA || (Array.isArray(data.parts) ? data.parts.find((p: any) => p.id === 'A')?.questions : []);
                            setPartAQuestions((pA || []).map(normalizeQuestion));

                            const pB = data.parts.partB || (Array.isArray(data.parts) ? data.parts.find((p: any) => p.id === 'B')?.questions : []);
                            setPartBQuestions((pB || []).map(normalizeQuestion));

                            const pC = data.parts.partC || (Array.isArray(data.parts) ? data.parts.find((p: any) => p.id === 'C') : {});
                            setWritingPrompt(pC.question || pC.prompt || "");
                            setWritingModelAnswer(pC.modelAnswer || "");
                        }
                    }
                }
            } catch (e) { console.error(e); }
            finally { setIsLoaded(true); }
        };
        init();
    }, [editId]);

    // --- NORMALIZER ---
    const normalizeQuestion = (q: any) => {
        let type = q.type || "SINGLE";
        if (type === 'multiple-choice' || type === 'single') type = 'SINGLE';
        if (type === 'true-false' || type === 'true_false_not_given') type = 'TRUE_FALSE';
        if (type === 'fill-in-the-blanks' || type === 'text') type = 'FILL_GAP';
        if (type === 'matching') type = 'MATCHING';

        return {
            id: q.id || Math.random().toString(36).substr(2, 9),
            type: type as QuestionType,
            instruction: q.instruction || "",
            question: q.question || q.question_text || q.prompt || "",
            options: q.options || ["", "", "", ""],
            correctAnswerIndex: q.correctAnswerIndex ?? 0,
            textParts: q.textParts || [q.question || ""],
            correctAnswers: q.correctAnswers || {},
            pairs: q.pairs || [],
            items: q.items || []
        };
    };

    const updateQuestion = (part: 'A' | 'B', index: number, field: string, value: any) => {
        const setter = part === 'A' ? setPartAQuestions : setPartBQuestions;
        setter(prev => {
            const newArr = [...prev];
            newArr[index] = { ...newArr[index], [field]: value };
            if (field === 'type') {
                if (value === 'SINGLE') newArr[index].options = ["", "", "", ""];
                if (value === 'MATCHING') newArr[index].pairs = [{ left: "", right: "" }];
                if (value === 'TRUE_FALSE') newArr[index].items = [{ text: "", isTrue: true }];
                if (value === 'FILL_GAP') {
                    newArr[index].textParts = [""];
                    newArr[index].correctAnswers = {};
                }
            }
            return newArr;
        });
    };

    const constructPayload = () => {
        return {
            title,
            imageUrls: images,
            textContent: mainText,
            updatedAt: serverTimestamp(),
            parts: {
                partA: partAQuestions,
                partB: partBQuestions,
                partC: {
                    type: 'OPEN',
                    question: writingPrompt,
                    modelAnswer: writingModelAnswer,
                    minWords: 80
                }
            }
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return alert("Εισαγάγετε τον τίτλο του μαθήματος!");
        setIsSaving(true);
        try {
            const docData = constructPayload();
            if (editId) {
                await updateDoc(doc(db, "lessons_reading", editId), docData);
                alert("Ενημερώθηκε!");
            } else {
                await addDoc(collection(db, "lessons_reading"), { ...docData, createdAt: serverTimestamp() });
                alert("Δημιουργήθηκε!");
            }
            router.push('/admin/manage');
        } catch (error) { alert("Σφάλμα: " + error); }
        finally { setIsSaving(false); }
    };

    // --- RENDER CARD ---
    const renderCard = (q: any, index: number, part: 'A' | 'B') => {
        return (
            <div key={index} className="bg-white dark:bg-slate-900 p-6 rounded-[1.5rem] border border-slate-200 dark:border-slate-700 shadow-sm mb-4 relative group">
                <div className="flex justify-between items-center mb-4 border-b border-slate-50 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                        <span className="bg-slate-900 dark:bg-slate-700 text-white text-xs font-black px-2 py-1 rounded-md">#{index + 1}</span>
                        <select
                            value={q.type}
                            onChange={(e) => updateQuestion(part, index, 'type', e.target.value)}
                            className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold py-1 px-3 rounded-lg outline-none cursor-pointer border border-indigo-100 dark:border-indigo-800"
                        >
                            {READING_QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <button type="button" onClick={() => {
                        const setter = part === 'A' ? setPartAQuestions : setPartBQuestions;
                        setter(prev => prev.filter((_, i) => i !== index));
                    }} className="text-slate-300 dark:text-slate-500 hover:text-red-500"><Trash2 size={16} /></button>
                </div>

                {/* --- FIX: INSTRUCTION FIELD (ONLY FOR FILL GAP) --- */}
                {q.type === 'FILL_GAP' && (
                    <div className="mb-3">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1 block mb-1">Οδηγία</label>
                        <textarea
                            value={q.instruction || ""}
                            onChange={(e) => updateQuestion(part, index, 'instruction', e.target.value)}
                            className="w-full p-3 bg-amber-50/50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800 font-medium text-slate-600 dark:text-slate-300 text-sm outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-amber-300 dark:focus:border-amber-600 transition-colors"
                            placeholder="Π.χ.: Ξαναγράψτε τις παρακάτω προτάσεις..."
                            rows={2}
                        />
                    </div>
                )}

                {/* --- ПОКРАЩЕНО: Роздільні поля для FILL_GAP --- */}
                {q.type === 'FILL_GAP' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1 block mb-1">Αρχική πρόταση (Source)</label>
                            <textarea
                                value={q.question.includes('->') ? q.question.split('->')[0].trim() : q.question}
                                onChange={(e) => {
                                    const currentTarget = q.question.includes('->') ? q.question.split('->')[1].trim() : "";
                                    updateQuestion(part, index, 'question', `${e.target.value} -> ${currentTarget}`);
                                }}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 font-medium text-slate-600 dark:text-slate-300 text-sm outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-200 dark:focus:border-blue-600 transition-colors"
                                placeholder="Π.χ.: Πηγαίνω στο σχολείο"
                                rows={2}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1 block mb-1">Πρόταση με κενό (Target)</label>
                            <textarea
                                value={q.question.includes('->') ? q.question.split('->')[1].trim() : ""}
                                onChange={(e) => {
                                    const currentSource = q.question.includes('->') ? q.question.split('->')[0].trim() : q.question;
                                    updateQuestion(part, index, 'question', `${currentSource} -> ${e.target.value}`);
                                }}
                                className="w-full p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 font-bold text-slate-800 dark:text-white text-sm outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-200 dark:focus:border-blue-600 transition-colors"
                                placeholder="Π.χ.: Πηγαίνω _____ σχολείο"
                                rows={2}
                            />
                        </div>
                    </div>
                ) : (
                    // Стандартне поле для інших типів
                    <>
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1 block mb-1">Κείμενο Ερώτησης / Πρόταση</label>
                        <textarea
                            value={q.question}
                            onChange={(e) => updateQuestion(part, index, 'question', e.target.value)}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 font-bold text-slate-700 dark:text-white text-sm mb-4 outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-200 dark:focus:border-blue-600 transition-colors"
                            placeholder="Κείμενο ερώτησης..."
                            rows={2}
                        />
                    </>
                )}

                {/* SINGLE CHOICE */}
                {q.type === 'SINGLE' && (
                    <div className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {(q.options || ["", "", "", ""]).map((opt: string, i: number) => (
                                <div key={i} className="flex items-center gap-2">
                                    <button type="button" onClick={() => updateQuestion(part, index, 'correctAnswerIndex', i)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${q.correctAnswerIndex === i ? 'bg-emerald-500 text-white' : 'text-slate-300 dark:text-slate-600'}`}>{['A', 'B', 'C', 'D'][i]}</button>
                                    <input value={opt} onChange={(e) => { const n = [...q.options]; n[i] = e.target.value; updateQuestion(part, index, 'options', n) }} className="flex-1 p-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg text-sm outline-none dark:text-white dark:placeholder-slate-500" placeholder={`Επιλογή ${i + 1}`} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* FILL GAP */}
                {q.type === 'FILL_GAP' && (
                    <div className="space-y-4">
                        {(() => {
                            const targetSentence = q.question.includes('->') ? q.question.split('->')[1] : q.question;
                            const gapsCount = Math.max(1, (targetSentence.match(/_{2,}/g) || []).length);

                            return Array.from({ length: gapsCount }).map((_, gapOffset) => {
                                const gapKey = String(gapOffset);
                                const rawData = q.correctAnswers?.[gapKey];
                                const answers = Array.isArray(rawData) ? rawData : [rawData || ""];

                                return (
                                    <div key={gapKey} className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                                            Σωστές απαντήσεις (Συνώνυμα) {gapsCount > 1 ? `- Κενό ${gapOffset + 1}` : ''}
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {answers.map((ans: string, iIndex: number) => (
                                                <div key={iIndex} className="flex items-center gap-1 group">
                                                    <input
                                                        value={ans}
                                                        onChange={(e) => {
                                                            const newArr = [...answers];
                                                            newArr[iIndex] = e.target.value;
                                                            updateQuestion(part, index, 'correctAnswers', { ...q.correctAnswers, [gapKey]: newArr });
                                                        }}
                                                        className="p-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-lg text-sm font-bold text-emerald-700 dark:text-emerald-300 min-w-[120px]"
                                                        placeholder="Λέξη..."
                                                    />
                                                    {answers.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newArr = answers.filter((_: any, idx: number) => idx !== iIndex);
                                                                updateQuestion(part, index, 'correctAnswers', { ...q.correctAnswers, [gapKey]: newArr });
                                                            }}
                                                            className="p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newArr = [...answers, ""];
                                                    updateQuestion(part, index, 'correctAnswers', { ...q.correctAnswers, [gapKey]: newArr });
                                                }}
                                                className="h-[38px] px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors flex items-center gap-1"
                                            >
                                                <Plus size={12} /> Συνώνυμο
                                            </button>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                )}

                {/* MATCHING */}
                {q.type === 'MATCHING' && (
                    <div className="space-y-2">
                        {(q.pairs || [{ left: "", right: "" }]).map((p: any, i: number) => (
                            <div key={i} className="flex gap-2">
                                <input value={p.left} onChange={e => { const n = [...q.pairs]; n[i].left = e.target.value; updateQuestion(part, index, 'pairs', n) }} className="flex-1 p-2 border dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs dark:text-white dark:placeholder-slate-500" placeholder="Αριστερό τμήμα" />
                                <input value={p.right} onChange={e => { const n = [...q.pairs]; n[i].right = e.target.value; updateQuestion(part, index, 'pairs', n) }} className="flex-1 p-2 border border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-xs dark:text-white dark:placeholder-slate-500" placeholder="Δεξί τμήμα" />
                            </div>
                        ))}
                        <button type="button" onClick={() => updateQuestion(part, index, 'pairs', [...q.pairs, { left: "", right: "" }])} className="text-xs text-blue-500 dark:text-blue-400 font-bold">+ Προσθήκη Ζεύγους</button>
                    </div>
                )}

                {/* TRUE FALSE */}
                {q.type === 'TRUE_FALSE' && (
                    <div className="space-y-2">
                        {(q.items || [{ text: "", isTrue: true }]).map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-2">
                                <input value={item.text} onChange={e => { const n = [...q.items]; n[i].text = e.target.value; updateQuestion(part, index, 'items', n) }} className="flex-1 p-2 border dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs dark:text-white dark:placeholder-slate-500" placeholder="Δήλωση..." />
                                <button type="button" onClick={() => { const n = [...q.items]; n[i].isTrue = !n[i].isTrue; updateQuestion(part, index, 'items', n) }} className={`px-2 py-1 rounded text-xs font-bold ${item.isTrue ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>{item.isTrue ? 'TRUE' : 'FALSE'}</button>
                            </div>
                        ))}
                        <button type="button" onClick={() => updateQuestion(part, index, 'items', [...q.items, { text: "", isTrue: true }])} className="text-xs text-blue-500 dark:text-blue-400 font-bold">+ Προσθήκη</button>
                    </div>
                )}
            </div>
        );
    };

    if (!isLoaded) return <div className="min-h-screen flex items-center justify-center font-black text-slate-400">ΦΟΡΤΩΣΗ...</div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 pb-40 font-sans transition-colors">
            <div className="max-w-6xl mx-auto">

                {/* TOP BAR */}
                <div className="flex justify-between items-center mb-8 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-700 shadow-sm sticky top-4 z-20 backdrop-blur-md bg-white/90 dark:bg-slate-900/90">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/manage" className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><ArrowLeft /></Link>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Reading Editor (Final)</h1>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Standardized Types</p>
                        </div>
                    </div>
                    <button onClick={handleSubmit} disabled={isSaving} className="bg-slate-900 dark:bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-slate-800 dark:hover:bg-blue-700 transition-all">
                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Αποθήκευση
                    </button>
                </div>

                <div className="space-y-10">

                    {/* TITLE */}
                    <section className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-2 block mb-2">Τίτλος μαθήματος</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-black text-xl text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/30" placeholder="Π.χ.: Θέμα 1" />
                    </section>

                    {/* INTRO */}
                    <section className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
                        <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <BookOpen className="text-blue-600 dark:text-blue-400" /> Κείμενο Άρθρου
                        </h2>
                        <div className="flex flex-col lg:flex-row gap-6">
                            <div className="flex-1">
                                <textarea
                                    value={mainText}
                                    onChange={e => setMainText(e.target.value)}
                                    className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl min-h-[400px] font-serif text-lg leading-relaxed outline-none focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/30 dark:text-white dark:placeholder-slate-500"
                                    placeholder="Επικολλήστε το κείμενο εδώ..."
                                />
                            </div>
                            <div className="w-full lg:w-1/3 space-y-4">
                                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 h-full">
                                    <h3 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2"><ImageIcon size={16} /> Εικόνες</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {images.map((url, idx) => (
                                            <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border dark:border-slate-600 bg-white dark:bg-slate-700">
                                                <img src={url} className="w-full h-full object-cover" />
                                                <button onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                                            </div>
                                        ))}
                                        <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:bg-white dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 transition-all">
                                            {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={24} />}
                                            <input type="file" hidden accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* PART A */}
                    <section className="bg-blue-50/50 dark:bg-blue-900/20 p-6 rounded-[2rem] border border-blue-100 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-black text-blue-900 dark:text-blue-300 flex items-center gap-2"><CheckSquare className="text-blue-600 dark:text-blue-400" /> Part A: Ερωτήσεις επί του κειμένου</h2>
                            <button onClick={() => setPartAQuestions([...partAQuestions, { type: 'SINGLE', options: ["", "", "", ""] }])} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg"><Plus size={14} /> Προσθήκη</button>
                        </div>
                        <div className="space-y-4">
                            {partAQuestions.map((q, i) => renderCard(q, i, 'A'))}
                        </div>
                    </section>

                    {/* PART B */}
                    <section className="bg-purple-50/50 dark:bg-purple-900/20 p-6 rounded-[2rem] border border-purple-100 dark:border-purple-800">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-black text-purple-900 dark:text-purple-300 flex items-center gap-2"><Type className="text-purple-600 dark:text-purple-400" /> Part B: Γραμματική</h2>
                            <button onClick={() => setPartBQuestions([...partBQuestions, { type: 'SINGLE', options: ["", "", "", ""] }])} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-purple-700 shadow-lg"><Plus size={14} /> Προσθήκη</button>
                        </div>
                        <div className="space-y-4">
                            {partBQuestions.map((q, i) => renderCard(q, i, 'B'))}
                        </div>
                    </section>

                    {/* PART C */}
                    <section className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700 space-y-8">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2"><PenTool className="text-orange-500 dark:text-orange-400" /> Part C: Writing</h2>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-2">Θέμα έκθεσης (Prompt)</label>
                            <textarea
                                value={writingPrompt}
                                onChange={e => setWritingPrompt(e.target.value)}
                                className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-none rounded-3xl min-h-[120px] font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-orange-50 dark:focus:ring-orange-900/30 transition-all dark:placeholder-slate-500"
                                placeholder="Θέμα έκθεσης..."
                            />
                        </div>
                    </section>
                </div>

                {/* DEBUG */}
                <div className="mt-20 pt-10 border-t border-slate-200 dark:border-slate-700">
                    <button onClick={() => setShowDebug(!showDebug)} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-4"><Bug size={14} /> Debug</button>
                    {showDebug && (
                        <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl font-mono text-xs overflow-x-auto">
                            <pre>{JSON.stringify(constructPayload(), null, 2)}</pre>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}