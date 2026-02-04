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
  { label: "Вибір (Single Choice)", value: "SINGLE" },
  { label: "True / False", value: "TRUE_FALSE" },
  { label: "Вписати слово (Fill Gap)", value: "FILL_GAP" },
  { label: "Пари (Matching)", value: "MATCHING" },
];

export default function ReadingEditorPage() {
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
      } catch (err) { alert("Помилка завантаження"); } 
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
              const pA = data.parts.partA || (Array.isArray(data.parts) ? data.parts.find((p:any)=>p.id==='A')?.questions : []);
              setPartAQuestions((pA || []).map(normalizeQuestion));

              const pB = data.parts.partB || (Array.isArray(data.parts) ? data.parts.find((p:any)=>p.id==='B')?.questions : []);
              setPartBQuestions((pB || []).map(normalizeQuestion));

              const pC = data.parts.partC || (Array.isArray(data.parts) ? data.parts.find((p:any)=>p.id==='C') : {});
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
            if (value === 'MATCHING') newArr[index].pairs = [{left:"", right:""}];
            if (value === 'TRUE_FALSE') newArr[index].items = [{text:"", isTrue:true}];
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
    if (!title) return alert("Введіть назву уроку!");
    setIsSaving(true);
    try {
      const docData = constructPayload();
      if (editId) {
        await updateDoc(doc(db, "lessons_reading", editId), docData);
        alert("Оновлено!");
      } else {
        await addDoc(collection(db, "lessons_reading"), { ...docData, createdAt: serverTimestamp() });
        alert("Створено!");
      }
      router.push('/admin/manage');
    } catch (error) { alert("Помилка: " + error); } 
    finally { setIsSaving(false); }
  };

  // --- RENDER CARD ---
  const renderCard = (q: any, index: number, part: 'A' | 'B') => {
      return (
        <div key={index} className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm mb-4 relative group">
            <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-3">
                <div className="flex items-center gap-3">
                    <span className="bg-slate-900 text-white text-xs font-black px-2 py-1 rounded-md">#{index + 1}</span>
                    <select 
                        value={q.type} 
                        onChange={(e) => updateQuestion(part, index, 'type', e.target.value)}
                        className="bg-indigo-50 text-indigo-700 text-xs font-bold py-1 px-3 rounded-lg outline-none cursor-pointer border border-indigo-100"
                    >
                        {READING_QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
                <button type="button" onClick={() => {
                    const setter = part === 'A' ? setPartAQuestions : setPartBQuestions;
                    setter(prev => prev.filter((_, i) => i !== index));
                }} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
            </div>

            {/* --- FIX: INSTRUCTION FIELD (ONLY FOR FILL GAP) --- */}
            {q.type === 'FILL_GAP' && (
                <div className="mb-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block mb-1">Інструкція</label>
                    <textarea 
                        value={q.instruction || ""} 
                        onChange={(e) => updateQuestion(part, index, 'instruction', e.target.value)}
                        className="w-full p-3 bg-amber-50/50 rounded-xl border border-amber-100 font-medium text-slate-600 text-sm outline-none focus:bg-white focus:border-amber-300 transition-colors"
                        placeholder="Напр: Ξαναγράψτε τις παρακάτω προτάσεις..."
                        rows={2}
                    />
                </div>
            )}

            {/* --- ПОКРАЩЕНО: Роздільні поля для FILL_GAP --- */}
            {q.type === 'FILL_GAP' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block mb-1">Вихідне речення (Source)</label>
                        <textarea
                            value={q.question.includes('->') ? q.question.split('->')[0].trim() : q.question}
                            onChange={(e) => {
                                const currentTarget = q.question.includes('->') ? q.question.split('->')[1].trim() : "";
                                updateQuestion(part, index, 'question', `${e.target.value} -> ${currentTarget}`);
                            }}
                            className="w-full p-3 bg-slate-50 rounded-xl border border-slate-100 font-medium text-slate-600 text-sm outline-none focus:bg-white focus:border-blue-200 transition-colors"
                            placeholder="Напр: Πηγαίνω στο σχολείο"
                            rows={2}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block mb-1">Речення з пропуском (Target)</label>
                        <textarea
                            value={q.question.includes('->') ? q.question.split('->')[1].trim() : ""}
                            onChange={(e) => {
                                const currentSource = q.question.includes('->') ? q.question.split('->')[0].trim() : q.question;
                                updateQuestion(part, index, 'question', `${currentSource} -> ${e.target.value}`);
                            }}
                            className="w-full p-3 bg-blue-50/50 rounded-xl border border-blue-100 font-bold text-slate-800 text-sm outline-none focus:bg-white focus:border-blue-200 transition-colors"
                            placeholder="Напр: Πηγαίνω _____ σχολείο"
                            rows={2}
                        />
                    </div>
                </div>
            ) : (
                // Стандартне поле для інших типів
                <>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block mb-1">Текст питання / Речення</label>
                    <textarea 
                        value={q.question} 
                        onChange={(e) => updateQuestion(part, index, 'question', e.target.value)}
                        className="w-full p-3 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-700 text-sm mb-4 outline-none focus:bg-white focus:border-blue-200 transition-colors"
                        placeholder="Текст запитання..."
                        rows={2}
                    />
                </>
            )}

            {/* SINGLE CHOICE */}
            {q.type === 'SINGLE' && (
                <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {(q.options || ["","","",""]).map((opt: string, i: number) => (
                            <div key={i} className="flex items-center gap-2">
                                <button type="button" onClick={() => updateQuestion(part, index, 'correctAnswerIndex', i)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${q.correctAnswerIndex === i ? 'bg-emerald-500 text-white' : 'text-slate-300'}`}>{['A','B','C','D'][i]}</button>
                                <input value={opt} onChange={(e) => {const n=[...q.options]; n[i]=e.target.value; updateQuestion(part, index, 'options', n)}} className="flex-1 p-2 bg-white border rounded-lg text-sm outline-none" placeholder={`Варіант ${i+1}`}/>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* FILL GAP */}
            {q.type === 'FILL_GAP' && (
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Правильна відповідь</label>
                    <input 
                        value={q.correctAnswers?.['0'] || ""}
                        onChange={(e) => updateQuestion(part, index, 'correctAnswers', {'0': e.target.value})}
                        className="w-full p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-sm font-bold text-emerald-700"
                        placeholder="Слово..."
                    />
                </div>
            )}

            {/* MATCHING */}
            {q.type === 'MATCHING' && (
                <div className="space-y-2">
                    {(q.pairs || [{left:"", right:""}]).map((p:any, i:number) => (
                        <div key={i} className="flex gap-2">
                            <input value={p.left} onChange={e => {const n=[...q.pairs]; n[i].left=e.target.value; updateQuestion(part, index, 'pairs', n)}} className="flex-1 p-2 border rounded-lg text-xs" placeholder="Ліва частина"/>
                            <input value={p.right} onChange={e => {const n=[...q.pairs]; n[i].right=e.target.value; updateQuestion(part, index, 'pairs', n)}} className="flex-1 p-2 border border-emerald-100 bg-emerald-50 rounded-lg text-xs" placeholder="Права частина"/>
                        </div>
                    ))}
                    <button type="button" onClick={() => updateQuestion(part, index, 'pairs', [...q.pairs, {left:"", right:""}])} className="text-xs text-blue-500 font-bold">+ Додати пару</button>
                </div>
            )}

            {/* TRUE FALSE */}
            {q.type === 'TRUE_FALSE' && (
                <div className="space-y-2">
                    {(q.items || [{text:"", isTrue:true}]).map((item:any, i:number) => (
                        <div key={i} className="flex items-center gap-2">
                            <input value={item.text} onChange={e => {const n=[...q.items]; n[i].text=e.target.value; updateQuestion(part, index, 'items', n)}} className="flex-1 p-2 border rounded-lg text-xs" placeholder="Твердження..."/>
                            <button type="button" onClick={() => {const n=[...q.items]; n[i].isTrue=!n[i].isTrue; updateQuestion(part, index, 'items', n)}} className={`px-2 py-1 rounded text-xs font-bold ${item.isTrue ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>{item.isTrue ? 'TRUE' : 'FALSE'}</button>
                        </div>
                    ))}
                    <button type="button" onClick={() => updateQuestion(part, index, 'items', [...q.items, {text:"", isTrue:true}])} className="text-xs text-blue-500 font-bold">+ Додати</button>
                </div>
            )}
        </div>
      );
  };

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center font-black text-slate-400">ΦΟΡΤΩΣΗ...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-40 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* TOP BAR */}
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-[2rem] border shadow-sm sticky top-4 z-20 backdrop-blur-md bg-white/90">
            <div className="flex items-center gap-4">
                <Link href="/admin/manage" className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-colors"><ArrowLeft/></Link>
                <div>
                    <h1 className="text-xl font-black text-slate-900 leading-tight">Reading Editor (Final)</h1>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Standardized Types</p>
                </div>
            </div>
            <button onClick={handleSubmit} disabled={isSaving} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-slate-800 transition-all">
                {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Зберегти
            </button>
        </div>

        <div className="space-y-10">
          
          {/* TITLE */}
          <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
             <label className="text-[10px] font-black text-slate-400 uppercase ml-2 block mb-2">Назва уроку</label>
             <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-xl text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50" placeholder="Напр: Θέμα 1" />
          </section>

          {/* INTRO */}
          <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 space-y-6">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
                <BookOpen className="text-blue-600"/> Текст статті
            </h2>
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                    <textarea 
                        value={mainText} 
                        onChange={e => setMainText(e.target.value)} 
                        className="w-full p-6 bg-slate-50 border-none rounded-2xl min-h-[400px] font-serif text-lg leading-relaxed outline-none focus:ring-4 focus:ring-indigo-50" 
                        placeholder="Вставте текст тут..." 
                    />
                </div>
                <div className="w-full lg:w-1/3 space-y-4">
                    <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 h-full">
                        <h3 className="text-xs font-black uppercase text-slate-400 mb-4 flex items-center gap-2"><ImageIcon size={16}/> Картинки</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {images.map((url, idx) => (
                                <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border bg-white">
                                    <img src={url} className="w-full h-full object-cover" />
                                    <button onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                                </div>
                            ))}
                            <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-white text-slate-400 transition-all">
                                {isUploading ? <Loader2 className="animate-spin" size={20}/> : <Plus size={24}/>}
                                <input type="file" hidden accept="image/*" onChange={handleImageUpload} disabled={isUploading}/>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
          </section>

          {/* PART A */}
          <section className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100">
              <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-black text-blue-900 flex items-center gap-2"><CheckSquare className="text-blue-600"/> Part A: Питання до тексту</h2>
                  <button onClick={() => setPartAQuestions([...partAQuestions, { type: 'SINGLE', options: ["","","",""] }])} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg"><Plus size={14}/> Додати</button>
              </div>
              <div className="space-y-4">
                  {partAQuestions.map((q, i) => renderCard(q, i, 'A'))}
              </div>
          </section>

          {/* PART B */}
          <section className="bg-purple-50/50 p-6 rounded-[2rem] border border-purple-100">
              <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-black text-purple-900 flex items-center gap-2"><Type className="text-purple-600"/> Part B: Граматика</h2>
                  <button onClick={() => setPartBQuestions([...partBQuestions, { type: 'SINGLE', options: ["","","",""] }])} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-purple-700 shadow-lg"><Plus size={14}/> Додати</button>
              </div>
              <div className="space-y-4">
                  {partBQuestions.map((q, i) => renderCard(q, i, 'B'))}
              </div>
          </section>

          {/* PART C */}
          <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 space-y-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2"><PenTool className="text-orange-500"/> Part C: Writing</h2>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Тема твору (Prompt)</label>
                <textarea 
                    value={writingPrompt} 
                    onChange={e => setWritingPrompt(e.target.value)} 
                    className="w-full p-6 bg-slate-50 border-none rounded-3xl min-h-[120px] font-bold text-slate-800 outline-none focus:ring-4 focus:ring-orange-50 transition-all" 
                    placeholder="Тема есе..."
                />
            </div>
          </section>
        </div>

        {/* DEBUG */}
        <div className="mt-20 pt-10 border-t border-slate-200">
             <button onClick={() => setShowDebug(!showDebug)} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors mb-4"><Bug size={14}/> Debug</button>
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