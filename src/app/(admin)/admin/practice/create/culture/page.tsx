"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { db, storage } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, query, orderBy, limit, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  ArrowLeft, Save, Loader2, List, AlignLeft, RefreshCcw, ToggleLeft, 
  CheckSquare, FileText, Bug, Image as ImageIcon, SlidersHorizontal, Upload, X
} from "lucide-react";
import { QuestionType, TrueFalseItem } from "@/types/exam-types"; // Standard Types

// --- CONFIG ---
const COLLECTION_NAME = "questions_culture"; 
const PAGE_TITLE = "Πολιτισμός (Updated Editor)"; 

// --- NEW TYPES ---
const EDITOR_MODES = [
  { id: 'SINGLE', label: 'Тест (1 відп.)', icon: List },
  { id: 'MULTI', label: 'Мульти-вибір', icon: CheckSquare },
  { id: 'MATCHING', label: 'Пари (Matching)', icon: RefreshCcw },
  { id: 'FILL_GAP', label: 'Пропуски / Inline', icon: AlignLeft },
  { id: 'TRUE_FALSE', label: 'True / False', icon: ToggleLeft },
  { id: 'OPEN', label: 'Відкрите', icon: FileText },
];

export default function CultureEditorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold">Завантаження...</div>}>
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
  const [rawData, setRawData] = useState<any>(null);

  // --- STATE ---
  const [order, setOrder] = useState<number>(1);
  const [mode, setMode] = useState<QuestionType>('SINGLE'); 
  const [questionText, setQuestionText] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Specific Fields
  const [options, setOptions] = useState<string[]>(["", "", "", ""]); 
  const [correctIndices, setCorrectIndices] = useState<number[]>([0]); 
  
  const [pairs, setPairs] = useState<{left: string, right: string, leftImg?: string, rightImg?: string}[]>([{left:"", right:""}, {left:"", right:""}]); 
  
  // FILL GAP (Inline support)
  const [fillSentence, setFillSentence] = useState<string>(""); 
  const [fillOptions, setFillOptions] = useState<string[]>([]); // Global Bank
  const [inlineChoices, setInlineChoices] = useState<Record<string, string[]>>({}); // Inline choices
  const [fillCorrectMap, setFillCorrectMap] = useState<Record<string, string>>({}); 
  const [isInlineMode, setIsInlineMode] = useState(false); 

  const [tfItems, setTfItems] = useState<TrueFalseItem[]>([{id:"1", text:"", isTrue:true}]); 
  const [modelAnswer, setModelAnswer] = useState(""); 

  const padArray = (arr: any[], len: number, fill: any) => {
     const res = [...(arr || [])];
     while(res.length < len) res.push(fill);
     return res;
  };

  const handleFileUpload = async (file: File) => {
      setIsUploading(true);
      try {
          const storageRef = ref(storage, `culture/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          return await getDownloadURL(snapshot.ref);
      } catch (e) {
          alert("Upload failed");
          return "";
      } finally {
          setIsUploading(false);
      }
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

            // --- TYPE DETECTION ---
            let type = data.type || 'SINGLE';
            // Mapping Logic...
            if (type.includes('multiple') || type.includes('image-choice')) type = 'SINGLE';
            if (type.includes('multiple-choice-multiple')) type = 'MULTI';
            if (type.includes('matching')) type = 'MATCHING';
            if (type.includes('fill') || type === 'inline-choice') type = 'FILL_GAP';
            if (type.includes('true')) type = 'TRUE_FALSE';
            if (type.includes('open')) type = 'OPEN';
            
            setMode(type as QuestionType);

            // --- POPULATE ---
            if (type === 'SINGLE' || type === 'MULTI') {
                const rawOpts = data.imageUrls || data.options || [];
                // If options are images (legacy), handle them
                setOptions(padArray(Array.isArray(rawOpts) ? rawOpts : Object.values(rawOpts), 4, ""));
                
                if (data.correctIndices) setCorrectIndices(data.correctIndices);
                else if (data.correctAnswerIndex !== undefined) setCorrectIndices([data.correctAnswerIndex]);
            }
            if (type === 'MATCHING') {
                if (data.pairs) setPairs(padArray(data.pairs, 4, {left:"", right:""}));
            }
            if (type === 'FILL_GAP') {
                // Detect Inline Mode
                if (data.mode === 'INLINE' || data.type === 'inline-choice' || data.choices) {
                    setIsInlineMode(true);
                    setFillSentence(data.textWithGaps || data.sentence || "");
                    setInlineChoices(data.inlineChoices || data.choices || {});
                } else {
                    setIsInlineMode(false);
                    const s = data.textParts || data.sentences || [""];
                    setFillSentence(Array.isArray(s) ? s.join(" ") : s);
                    setFillOptions(data.wordBank || data.options || []);
                }
                
                // Correct Answers Map
                const map: Record<string, string> = {};
                if (data.correctAnswers) {
                    if (Array.isArray(data.correctAnswers)) data.correctAnswers.forEach((a:string, i:number) => map[String(i+1)]=a);
                    else Object.assign(map, data.correctAnswers);
                }
                setFillCorrectMap(map);
            }
            if (type === 'TRUE_FALSE') {
                if (data.items) setTfItems(data.items);
                else if (data.imageUrls && data.correctAnswers) {
                    // Legacy Image TF
                    setTfItems(data.imageUrls.map((url:string, i:number) => ({
                        id: String(i), imageUrl: url, isTrue: data.correctAnswers[i] === "Σ" || data.correctAnswers[i] === true
                    })));
                }
                else if (data.statements) {
                    setTfItems(data.statements.map((s:string, i:number) => ({
                        id: String(i), text: s, isTrue: data.correctBooleans ? data.correctBooleans[i] : true
                    })));
                }
            }
            if (type === 'OPEN') setModelAnswer(data.modelAnswer || data.correctAnswer || "");
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
            category: 'culture'
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
            baseDoc.pairs = pairs.filter(p => p.left.trim() || p.right.trim());
        }
        else if (mode === 'FILL_GAP') {
            baseDoc.textParts = [fillSentence]; // Store as array for consistency
            baseDoc.textWithGaps = fillSentence; // Store as string for easier editing
            if (isInlineMode) {
                baseDoc.mode = 'INLINE';
                baseDoc.inlineChoices = inlineChoices;
            } else {
                baseDoc.mode = 'GLOBAL';
                baseDoc.wordBank = fillOptions.filter(o => o.trim());
            }
            baseDoc.correctAnswers = fillCorrectMap;
        }
        else if (mode === 'TRUE_FALSE') {
            baseDoc.items = tfItems.filter(i => (i.text && i.text.trim()) || i.imageUrl);
        }
        else if (mode === 'OPEN') {
            baseDoc.modelAnswer = modelAnswer;
        }

        if (editId) {
            await updateDoc(doc(db, COLLECTION_NAME, editId), baseDoc);
            alert("Оновлено!");
        } else {
            await addDoc(collection(db, COLLECTION_NAME), { ...baseDoc, createdAt: serverTimestamp() });
            if(confirm("Створено! Додати ще?")) {
                setOrder(prev => prev + 1);
                setQuestionText("");
            } else {
                router.push('/admin/manage');
            }
        }
    } catch (e: any) { alert("Помилка: " + e.message); } 
    finally { setIsSaving(false); }
  };

  const getFillKeys = (text: string) => {
      const regex = /\((\d+)\)/g;
      const keys: string[] = [];
      let match;
      while ((match = regex.exec(text)) !== null) keys.push(match[1]);
      return keys.sort((a,b) => Number(a)-Number(b));
  };

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 h-8 w-8"/></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans pb-40">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
            <Link href="/admin/manage" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors"><ArrowLeft size={18}/> Назад</Link>
            <div className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">{COLLECTION_NAME}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-4">
                    <h1 className="text-2xl font-black text-slate-900">{PAGE_TITLE}</h1>
                    <input type="number" value={order} onChange={e => setOrder(Number(e.target.value))} className="w-20 p-2 bg-slate-50 border rounded-xl font-black text-center"/>
                </div>
                
                <div className="space-y-4">
                    <textarea value={questionText} onChange={e => setQuestionText(e.target.value)} placeholder="Текст запитання..." className="w-full p-4 bg-slate-50 border rounded-2xl text-lg font-bold outline-none"/>
                    <div className="flex gap-2">
                        <ImageIcon className="text-slate-400"/>
                        <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="URL зображення" className="flex-1 bg-transparent outline-none text-sm"/>
                    </div>
                </div>
            </div>

            {/* MODE SELECTOR */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                {EDITOR_MODES.map((m) => (
                    <button key={m.id} type="button" onClick={() => setMode(m.id as QuestionType)} className={`p-4 rounded-xl font-bold text-xs border-2 flex flex-col items-center gap-2 ${mode === m.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-transparent'}`}>
                        <m.icon size={20}/> {m.label}
                    </button>
                ))}
            </div>

            {/* DYNAMIC FIELDS */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 min-h-[300px]">
                
                {(mode === 'SINGLE' || mode === 'MULTI') && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {options.map((opt, i) => {
                                const isSelected = correctIndices.includes(i);
                                const isImage = opt.startsWith("http");
                                return (
                                    <div key={i} className={`relative p-4 rounded-2xl border-2 transition-all ${isSelected ? 'border-emerald-400 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
                                        <div className="flex items-center gap-3 mb-2">
                                            <button type="button" onClick={() => {
                                                if (mode === 'SINGLE') setCorrectIndices([i]);
                                                else setCorrectIndices(prev => prev.includes(i) ? prev.filter(x=>x!==i) : [...prev, i]);
                                            }} className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center font-black">{['A','B','C','D'][i]}</button>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Варіант {i+1}</span>
                                        </div>
                                        {isImage && <img src={opt} className="h-32 w-full object-cover rounded-xl mb-2 border"/>}
                                        <input value={opt} onChange={e => {const n=[...options]; n[i]=e.target.value; setOptions(n)}} className="w-full bg-transparent outline-none border-b border-dashed" placeholder="Текст або URL..."/>
                                        <label className="absolute top-4 right-4 cursor-pointer text-slate-300 hover:text-slate-600"><Upload size={16}/><input type="file" hidden accept="image/*" onChange={async (e) => {if(e.target.files?.[0]) {const url = await handleFileUpload(e.target.files[0]); const n=[...options]; n[i]=url; setOptions(n);}}}/></label>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {mode === 'MATCHING' && (
                    <div className="space-y-6">
                        {pairs.map((p, i) => (
                            <div key={i} className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <input value={p.left} onChange={e => {const n=[...pairs]; n[i].left=e.target.value; setPairs(n)}} className="w-full p-3 bg-slate-50 rounded-xl border" placeholder="Ліва частина"/>
                                    <div className="flex gap-2"><input value={p.leftImg || ""} onChange={e => {const n=[...pairs]; n[i].leftImg=e.target.value; setPairs(n)}} className="flex-1 text-xs bg-transparent outline-none" placeholder="URL (opt)"/></div>
                                </div>
                                <div className="space-y-1">
                                    <input value={p.right} onChange={e => {const n=[...pairs]; n[i].right=e.target.value; setPairs(n)}} className="w-full p-3 bg-emerald-50 rounded-xl border border-emerald-100" placeholder="Права частина"/>
                                    <div className="flex gap-2 items-center">
                                        <input value={p.rightImg || ""} onChange={e => {const n=[...pairs]; n[i].rightImg=e.target.value; setPairs(n)}} className="flex-1 text-xs bg-transparent outline-none" placeholder="URL (opt)"/>
                                        <label className="cursor-pointer text-slate-300 hover:text-emerald-500"><Upload size={12}/><input type="file" hidden onChange={async (e) => {if(e.target.files?.[0]) {const u = await handleFileUpload(e.target.files[0]); const n=[...pairs]; n[i].rightImg=u; setPairs(n);}}} /></label>
                                    </div>
                                    {p.rightImg && <img src={p.rightImg} className="h-10 rounded-lg border object-cover"/>}
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={() => setPairs([...pairs, {left:"", right:""}])} className="text-xs font-bold text-blue-500">+ Додати пару</button>
                    </div>
                )}

                {mode === 'FILL_GAP' && (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal size={16} className="text-slate-400"/>
                                <span className="text-xs font-bold uppercase text-slate-500">Режим:</span>
                                <span className={`text-xs font-black px-2 py-1 rounded ${isInlineMode ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {isInlineMode ? "INLINE (Варіанти для кожного)" : "GLOBAL (Банк слів)"}
                                </span>
                            </div>
                            <button type="button" onClick={() => setIsInlineMode(!isInlineMode)} className="text-xs font-bold text-slate-400 hover:text-slate-900 underline">Змінити</button>
                        </div>

                        <div className="space-y-2">
                            <textarea value={fillSentence} onChange={e => setFillSentence(e.target.value)} rows={4} className="w-full p-4 bg-slate-50 rounded-xl border outline-none" placeholder="Текст із пропусками (1), (2)..."/>
                        </div>

                        {!isInlineMode && (
                            <div className="space-y-2 bg-slate-50 p-4 rounded-xl">
                                <label className="text-xs font-black uppercase text-slate-400">Банк Слів</label>
                                <div className="flex flex-wrap gap-2">
                                    {fillOptions.map((opt, i) => (
                                        <div key={i} className="flex items-center gap-1 bg-white border px-3 py-2 rounded-lg">
                                            <span className="font-bold text-sm">{opt}</span>
                                            <button type="button" onClick={() => setFillOptions(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400"><X size={14}/></button>
                                        </div>
                                    ))}
                                    <input className="px-3 py-2 rounded-lg border border-dashed bg-transparent outline-none text-sm min-w-[150px]" placeholder="+ Enter" onKeyDown={(e) => {if (e.key === 'Enter') {e.preventDefault(); const val = e.currentTarget.value.trim(); if (val) { setFillOptions([...fillOptions, val]); e.currentTarget.value = ""; }}}} />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            {getFillKeys(fillSentence).map((key) => (
                                <div key={key} className="p-4 border rounded-xl flex flex-col gap-2">
                                    <span className="text-xs font-bold uppercase text-slate-400">Пропуск {key}</span>
                                    {isInlineMode && (
                                        <input 
                                            value={(inlineChoices[key] || []).join(", ")}
                                            onChange={(e) => setInlineChoices({...inlineChoices, [key]: e.target.value.split(",").map(s=>s.trim())})}
                                            className="w-full p-2 bg-slate-50 rounded text-sm border-none outline-none"
                                            placeholder="Варіанти через кому..."
                                        />
                                    )}
                                    <select 
                                        value={fillCorrectMap[key] || ""} 
                                        onChange={(e) => setFillCorrectMap({...fillCorrectMap, [key]: e.target.value})}
                                        className="w-full p-2 bg-emerald-50 text-emerald-800 font-bold rounded outline-none"
                                    >
                                        <option value="">-- Правильна відповідь --</option>
                                        {(isInlineMode ? (inlineChoices[key] || []) : fillOptions).map((opt, i) => (
                                            <option key={i} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {mode === 'TRUE_FALSE' && (
                    <div className="space-y-3">
                        {tfItems.map((item, i) => (
                            <div key={i} className="flex flex-col md:flex-row md:items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex-1 space-y-2">
                                    <input value={item.text || ""} onChange={e => {const n=[...tfItems]; n[i].text=e.target.value; setTfItems(n)}} className="w-full bg-transparent outline-none p-2 font-medium" placeholder="Твердження..."/>
                                    <div className="flex items-center gap-2">
                                        <input value={item.imageUrl || ""} onChange={e => {const n=[...tfItems]; n[i].imageUrl=e.target.value; setTfItems(n)}} className="flex-1 text-xs bg-transparent outline-none text-slate-400" placeholder="URL картинки..."/>
                                        <label className="cursor-pointer text-slate-300 hover:text-pink-500"><Upload size={14}/><input type="file" hidden onChange={async (e) => {if(e.target.files?.[0]) {const u = await handleFileUpload(e.target.files[0]); const n=[...tfItems]; n[i].imageUrl=u; setTfItems(n);}}} /></label>
                                    </div>
                                    {item.imageUrl && <img src={item.imageUrl} className="h-20 rounded-lg border object-cover"/>}
                                </div>
                                <button type="button" onClick={() => {const n=[...tfItems]; n[i].isTrue=!n[i].isTrue; setTfItems(n)}} className={`px-3 py-1 rounded text-xs font-bold ${item.isTrue ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                    {item.isTrue ? "TRUE" : "FALSE"}
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={() => setTfItems([...tfItems, {id: Math.random().toString(), text:"", isTrue:true}])} className="text-xs font-bold text-blue-500">+ Додати</button>
                    </div>
                )}

                {mode === 'OPEN' && (
                    <textarea value={modelAnswer} onChange={e => setModelAnswer(e.target.value)} className="w-full p-4 bg-emerald-50/30 border border-emerald-100 rounded-xl outline-none" placeholder="Еталон..."/>
                )}
            </div>

            <button disabled={isSaving || isUploading} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xl shadow-xl flex items-center justify-center gap-3">
                {isSaving ? <Loader2 className="animate-spin"/> : <Save/>} Зберегти
            </button>
        </form>

        <div className="mt-10 pt-10 border-t border-slate-200">
             <button onClick={() => setShowDebug(!showDebug)} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900"><Bug size={14}/> Debug</button>
             {showDebug && <pre className="mt-2 bg-slate-900 text-slate-300 p-6 rounded-2xl font-mono text-xs overflow-x-auto">{JSON.stringify(rawData, null, 2)}</pre>}
        </div>
      </div>
    </div>
  );
}