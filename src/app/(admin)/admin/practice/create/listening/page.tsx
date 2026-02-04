"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { db, storage } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; 
import { 
  ArrowLeft, Save, Loader2, Upload, Headphones, 
  X, FileAudio, AlignLeft, CheckCircle2, Music, FileJson, Bug 
} from "lucide-react";

export default function ListeningEditorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Завантаження...</div>}>
      <EditorContent />
    </Suspense>
  );
}

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // --- STATE ---
  const [order, setOrder] = useState<number>(1);
  const [title, setTitle] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [transcript, setTranscript] = useState("");

  // PART A: 5 Single Choice Questions
  const [partA, setPartA] = useState(
    Array(5).fill(null).map(() => ({
      question: "",
      options: ["", "", ""], 
      correctAnswerIndex: 0 
    }))
  );

  // PART B: 5 True/False Statements
  const [partB, setPartB] = useState(
    Array(5).fill(null).map(() => ({
      statement: "",
      isTrue: true // true = Σωστό, false = Λάθος
    }))
  );

  useEffect(() => {
    if (editId) {
      const loadData = async () => {
        try {
          const docRef = doc(db, "lessons_listening", editId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            setOrder(data.order || 1);
            setTitle(data.title || "");
            setAudioUrl(data.audioUrl || "");
            setTranscript(data.transcript || "");
            
            // Load Part A (Type: SINGLE)
            if (data.parts?.partA) {
                setPartA(data.parts.partA.map((q: any) => ({
                    question: q.question || "",
                    options: q.options || ["", "", ""],
                    correctAnswerIndex: q.correctAnswerIndex ?? 0
                })));
            } else if (data.partA) { // Legacy fallback
                setPartA(data.partA.map((q: any) => ({
                    question: q.question || "",
                    options: q.options || ["", "", ""],
                    correctAnswerIndex: q.correctAnswerIndex ?? 0
                })));
            }
            
            // Load Part B (Type: TRUE_FALSE)
            if (data.parts?.partB) {
                // New structure: array of TRUE_FALSE questions with items[]
                setPartB(data.parts.partB.map((q: any) => ({
                    statement: q.items?.[0]?.text || q.statement || "",
                    isTrue: q.items?.[0]?.isTrue ?? (q.correctAnswer === "Σ")
                })));
            } else if (data.partB) { // Legacy fallback
                setPartB(data.partB.map((q: any) => ({
                    statement: q.statement || "",
                    isTrue: q.correctAnswer === "Σ" || q.correctAnswer === true
                })));
            }
          }
        } catch (e) { console.error(e); } 
        finally { setIsLoaded(true); }
      };
      loadData();
    } else {
      setIsLoaded(true);
    }
  }, [editId]);

  // --- JSON IMPORT (ADAPTED TO NEW TYPES) ---
  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const theme = json.themes ? json.themes[0] : json; // Handle {themes:[...]} or [...]
        
        if (!theme) return alert("Невірний формат JSON");

        if (theme.title) setTitle(theme.title);
        if (theme.id) setOrder(Number(theme.id));

        // Import Part A
        const pA = theme.parts?.find((p: any) => p.id === "A" || p.title?.includes("ΜΕΡΟΣ Α"));
        if (pA?.questions) {
            setPartA(pA.questions.map((q: any) => {
                let opts = ["", "", ""];
                if (q.options && !Array.isArray(q.options)) opts = Object.values(q.options);
                else if (Array.isArray(q.options)) opts = q.options;

                let ansIdx = 0;
                const ans = String(q.answer).toLowerCase().trim();
                if (ans === 'β' || ans === 'b' || ans === '1') ansIdx = 1;
                if (ans === 'γ' || ans === 'c' || ans === '2') ansIdx = 2;

                return {
                    question: q.question_text || q.question || "",
                    options: opts,
                    correctAnswerIndex: ansIdx
                };
            }));
        }

        // Import Part B
        const pB = theme.parts?.find((p: any) => p.id === "B" || p.title?.includes("ΜΕΡΟΣ Β"));
        if (pB?.questions) {
            setPartB(pB.questions.map((q: any) => {
                const rawAns = String(q.answer).trim().toUpperCase();
                const isTrue = !(rawAns === 'Λ' || rawAns === 'L' || rawAns === 'FALSE');
                return {
                    statement: q.question_text || q.statement || "",
                    isTrue: isTrue
                };
            }));
        }
        alert("Дані імпортовано!");
      } catch (err) { alert("Помилка JSON: " + err); }
    };
    reader.readAsText(file);
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setIsUploading(true);
      try {
        const file = e.target.files[0];
        const storageRef = ref(storage, `audio_listening/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        setAudioUrl(url);
      } catch (err) { alert("Помилка завантаження"); } 
      finally { setIsUploading(false); }
    }
  };

  // --- SAVE LOGIC (CONVERT TO EXAM-TYPES STANDARD) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !audioUrl) return alert("Заповніть назву та аудіо.");
    
    setIsSaving(true);
    try {
      const docData = {
        order: Number(order),
        title,
        audioUrl,
        transcript, 
        updatedAt: serverTimestamp(),
        // NEW STRUCTURE
        parts: {
            partA: partA.map(q => ({
                id: Math.random().toString(36).substr(2, 9),
                type: 'SINGLE',
                question: q.question,
                options: q.options,
                correctAnswerIndex: q.correctAnswerIndex
            })),
            partB: partB.map(q => ({
                id: Math.random().toString(36).substr(2, 9),
                type: 'TRUE_FALSE',
                question: "Σωστό ή Λάθος;", // Generic header
                items: [{ 
                    id: '1', 
                    text: q.statement, 
                    isTrue: q.isTrue 
                }]
            }))
        }
      };

      if (editId) {
        await updateDoc(doc(db, "lessons_listening", editId), docData);
        alert("Оновлено!");
      } else {
        await addDoc(collection(db, "lessons_listening"), { ...docData, createdAt: serverTimestamp() });
        alert("Створено!");
      }
      router.push('/admin/manage');
    } catch (error) { console.error(error); alert("Error saving"); } 
    finally { setIsSaving(false); }
  };

  // UPDATE HELPERS
  const updatePartA = (idx: number, field: string, value: any, optIdx?: number) => {
    const newA = [...partA];
    if (field === 'options' && typeof optIdx === 'number') newA[idx].options[optIdx] = value;
    else newA[idx] = { ...newA[idx], [field]: value };
    setPartA(newA);
  };

  const updatePartB = (idx: number, field: string, value: any) => {
    const newB = [...partB];
    // @ts-ignore
    newB[idx][field] = value;
    setPartB(newB);
  };

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center font-black animate-pulse text-slate-400">ΦΟΡΤΩΣΗ...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-32 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <Link href="/admin/manage" className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-slate-400">
              <ArrowLeft className="h-5 w-5"/>
            </Link>
            <div>
              <h1 className="text-3xl font-black text-slate-900 font-serif tracking-tight">Listening Editor (Final)</h1>
              <div className="flex items-center gap-2 mt-2">
                  <label className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100 cursor-pointer hover:bg-emerald-100 transition-colors">
                      <FileJson size={14}/> Імпорт JSON
                      <input type="file" accept=".json" onChange={handleJsonImport} className="hidden" />
                  </label>
                  <p className="text-slate-400 text-xs font-medium">Standardized Types</p>
              </div>
            </div>
          </div>
          <button onClick={handleSubmit} disabled={isSaving || isUploading} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-purple-600 transition-all shadow-xl disabled:opacity-50">
            {isSaving ? <Loader2 className="animate-spin h-5 w-5"/> : <Save className="h-5 w-5"/>} Зберегти
          </button>
        </div>

        <div className="space-y-12">

          {/* 1. AUDIO SECTION */}
          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-8">
            <div className="flex items-center gap-3 text-slate-400 border-b border-slate-50 pb-6"><Music className="h-5 w-5"/><h2 className="text-xs font-black uppercase tracking-widest">1. Аудіо та Інфо</h2></div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Назва уроку</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-4 bg-slate-50 border-none rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-100" placeholder="Наприклад: Тема 5 - В магазині"/>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Номер</label>
                    <input type="number" value={order} onChange={e => setOrder(Number(e.target.value))} className="w-full p-4 bg-slate-50 border-none rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-100 text-center"/>
                </div>
            </div>

            <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100">
                {audioUrl ? (
                    <div className="flex flex-col sm:flex-row items-center gap-6 bg-white p-4 rounded-2xl border border-purple-200 shadow-sm">
                        <div className="bg-purple-600 p-3 rounded-xl text-white shadow-lg"><FileAudio className="h-6 w-6"/></div>
                        <audio src={audioUrl} controls className="flex-1 h-10"/>
                        <button type="button" onClick={() => setAudioUrl("")} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><X className="h-6 w-6"/></button>
                    </div>
                ) : (
                    <label className="cursor-pointer bg-white w-full h-24 rounded-2xl border-2 border-dashed border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all flex items-center justify-center gap-4 group">
                        {isUploading ? <Loader2 className="animate-spin h-6 w-6 text-purple-400"/> : <Upload className="h-6 w-6 text-purple-300 group-hover:scale-110 transition-transform"/>}
                        <span className="text-sm font-bold text-purple-600">{isUploading ? "Завантаження..." : "Завантажити MP3 файл"}</span>
                        <input type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload}/>
                    </label>
                )}
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4"><AlignLeft className="h-4 w-4"/> Транскрипція</label>
                <textarea value={transcript} onChange={e => setTranscript(e.target.value)} className="w-full p-5 bg-white border border-slate-200 rounded-2xl h-40 text-sm font-medium outline-none" placeholder="Текст аудіо..."/>
            </div>
          </section>

          {/* 2. PART A */}
          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-8">
            <div className="flex items-center gap-3 text-slate-400 border-b border-slate-50 pb-6"><Headphones className="h-5 w-5"/><h2 className="text-xs font-black uppercase tracking-widest">2. Μέρος Α: 5 Тестових питань</h2></div>
            <div className="space-y-12">
                {partA.map((q, idx) => (
                    <div key={idx} className="relative">
                        <div className="mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-600 rounded-lg font-black text-sm">{idx + 1}</span>
                            <input type="text" value={q.question} onChange={(e) => updatePartA(idx, 'question', e.target.value)} className="flex-1 bg-transparent text-lg font-bold border-b-2 border-slate-100 outline-none py-2" placeholder="Текст питання..."/>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-11">
                            {['α', 'β', 'γ'].map((label, optIdx) => (
                                <div key={optIdx} className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${q.correctAnswerIndex === optIdx ? 'border-emerald-400 bg-emerald-50' : 'border-slate-100 bg-white'}`}>
                                    <button type="button" onClick={() => updatePartA(idx, 'correctAnswerIndex', optIdx)} className={`w-8 h-8 rounded-lg flex items-center justify-center font-black uppercase text-xs ${q.correctAnswerIndex === optIdx ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{label}</button>
                                    <input type="text" value={q.options[optIdx]} onChange={(e) => updatePartA(idx, 'options', e.target.value, optIdx)} className="flex-1 bg-transparent text-sm font-bold outline-none" placeholder={`Варіант ${label}`}/>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
          </section>

          {/* 3. PART B */}
          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-8">
            <div className="flex items-center gap-3 text-slate-400 border-b border-slate-50 pb-6"><CheckCircle2 className="h-5 w-5"/><h2 className="text-xs font-black uppercase tracking-widest">3. Μέρος Β: 5 Питань Σωστό / Λάθος</h2></div>
            <div className="space-y-4">
                {partB.map((q, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="font-black text-slate-300 w-6 text-right">{idx + 1}.</span>
                        <input type="text" value={q.statement} onChange={(e) => updatePartB(idx, 'statement', e.target.value)} className="flex-1 bg-transparent font-bold outline-none" placeholder="Введіть твердження..."/>
                        <div className="flex bg-white rounded-xl p-1 border border-slate-200">
                            <button type="button" onClick={() => updatePartB(idx, 'isTrue', true)} className={`px-5 py-2 rounded-lg text-xs font-black transition-all ${q.isTrue ? 'bg-emerald-500 text-white' : 'text-slate-300'}`}>Σ</button>
                            <button type="button" onClick={() => updatePartB(idx, 'isTrue', false)} className={`px-5 py-2 rounded-lg text-xs font-black transition-all ${!q.isTrue ? 'bg-red-500 text-white' : 'text-slate-300'}`}>Λ</button>
                        </div>
                    </div>
                ))}
            </div>
          </section>

        </div>

        {/* DEBUG */}
        <div className="mt-20 pt-10 border-t border-slate-200">
             <button onClick={() => setShowDebug(!showDebug)} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900 mb-4"><Bug size={14}/> Debug JSON</button>
             {showDebug && <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl font-mono text-xs overflow-x-auto"><pre>{JSON.stringify({title, partA, partB}, null, 2)}</pre></div>}
        </div>

      </div>
    </div>
  );
}