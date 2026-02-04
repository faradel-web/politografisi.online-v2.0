"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, writeBatch, doc, getDocs, query, limit, serverTimestamp } from "firebase/firestore";
import { 
  Upload, Loader2, ArrowLeft, AlertTriangle, CheckCircle, FileJson, Info, Trash2
} from "lucide-react";
import Link from "next/link";

// --- ΚΑΤΗΓΟΡΙΕΣ ---
const CATEGORIES = [
  // Група 1: Теорія
  { id: 'history', label: 'Ιστορία', collection: 'questions_history', mode: 'theory' },
  { id: 'politics', label: 'Πολιτική', collection: 'questions_politics', mode: 'theory' },
  { id: 'culture', label: 'Πολιτισμός', collection: 'questions_culture', mode: 'theory' },
  { id: 'geography', label: 'Γεωγραφία', collection: 'questions_geography', mode: 'theory' },
  
  // Група 2: Уроки
  { id: 'reading', label: 'Ανάγνωση', collection: 'lessons_reading', mode: 'reading' },
  { id: 'listening', label: 'Κατανόηση', collection: 'lessons_listening', mode: 'listening' },
  { id: 'speaking', label: 'Παραγωγή', collection: 'lessons_speaking', mode: 'speaking' },
];

export default function ImportPage() {
  const [category, setCategory] = useState("history");
  const [jsonInput, setJsonInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  const currentCatConfig = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];

  // ==============================================================================
  // 1. SMART NORMALIZER
  // ==============================================================================
  const normalizeQuestion = (raw: any): any => {
      const text = raw.question || raw.question_text || raw.statement || raw.prompt || "Question Text Missing";
      
      let options: string[] = [];
      if (Array.isArray(raw.options)) {
          options = raw.options;
      } else if (raw.options && typeof raw.options === 'object') {
          options = Object.values(raw.options);
      } else if (raw.optionA) {
          options = [raw.optionA, raw.optionB, raw.optionC, raw.optionD].filter(Boolean);
      } else if (raw.choices) {
          options = raw.choices;
      }

      let type = "SINGLE";
      const rawType = (raw.type || "").toLowerCase();

      // Визначення типу
      if (rawType === 'single' || rawType === 'true_false' || rawType === 'matching' || rawType === 'fill_gap' || rawType === 'map') {
          // Якщо тип вже правильний (з моїх нових файлів), залишаємо його
          type = raw.type; 
      } else if (rawType.includes('map') || (raw.points && Array.isArray(raw.points))) {
          type = "MAP";
      } else if (rawType.includes('multi') && rawType.includes('multiple')) {
          type = "MULTI";
      } else if (raw.pairs || rawType.includes('match')) {
          type = "MATCHING";
      } else if (raw.sentences || rawType.includes('fill') || rawType.includes('gap')) {
          type = "FILL_GAP";
      } else if (rawType.includes('true') || rawType.includes('σωστό') || raw.statements) {
          if (rawType.includes('not_given')) type = "SINGLE"; 
          else type = "TRUE_FALSE";
      } else if (rawType.includes('open') || raw.modelAnswer) {
          type = "OPEN";
      } else {
          const ansStr = String(raw.answer || "").toLowerCase();
          if (options.length === 0 && (ansStr === 'true' || ansStr === 'false' || ansStr === 'σ' || ansStr === 'λ')) {
              type = "TRUE_FALSE";
          } else {
              type = "SINGLE";
          }
      }

      const id = raw.id ? String(raw.id) : Math.random().toString(36).substr(2, 9);

      // --- TRANSFORM ---

      if (type === "SINGLE" || type === "MULTI") {
          if (options.length === 0) options = ["Option A", "Option B", "Option C"];
          
          let ansIdx = 0;
          if (raw.correctAnswerIndex !== undefined) {
              ansIdx = Number(raw.correctAnswerIndex);
          } else if (raw.answer || raw.correctAnswer) {
              const ans = String(raw.answer || raw.correctAnswer).trim().toLowerCase();
              if (ans === 'a' || ans === 'α' || ans === '1') ansIdx = 0;
              else if (ans === 'b' || ans === 'β' || ans === '2') ansIdx = 1;
              else if (ans === 'c' || ans === 'γ' || ans === '3') ansIdx = 2;
              else if (ans === 'd' || ans === 'δ' || ans === '4') ansIdx = 3;
              else {
                  const foundIdx = options.findIndex(o => o.toLowerCase().trim() === ans);
                  if (foundIdx !== -1) ansIdx = foundIdx;
              }
          }
          return { id, type: 'SINGLE', question: text, options, correctAnswerIndex: ansIdx, imageUrl: raw.imageUrl || null };
      }

      if (type === "TRUE_FALSE") {
          let items = raw.items || [];
          if (items.length === 0) {
             if (raw.statements && Array.isArray(raw.statements)) {
                  items = raw.statements.map((s: string, i: number) => {
                      let isTrue = true;
                      if (raw.correctBooleans) isTrue = raw.correctBooleans[i];
                      else if (raw.correctAnswers) {
                          const ans = String(raw.correctAnswers[i]).toUpperCase();
                          isTrue = (ans === 'Σ' || ans === 'TRUE' || ans === 'T');
                      }
                      return { id: String(i), text: s, isTrue };
                  });
              } else {
                  let isTrue = true;
                  const ans = String(raw.answer || raw.correctAnswer).toUpperCase();
                  if (ans === 'Λ' || ans === 'FALSE' || ans === 'F') isTrue = false;
                  items = [{ id: '1', text: text, isTrue: isTrue }];
              }
          }
          return { id, type, question: text, items, imageUrl: raw.imageUrl || null };
      }

      if (type === "MATCHING") {
          return { id, type, question: text, pairs: raw.pairs || [], imageUrl: raw.imageUrl || null };
      }

      if (type === "FILL_GAP") {
          return {
              id, type, question: text,
              textParts: raw.textParts || raw.sentences || [text],
              mode: raw.mode || 'GLOBAL',
              wordBank: raw.wordBank || options,
              inlineChoices: raw.inlineChoices || raw.choices || {},
              correctAnswers: raw.correctAnswers || {}
          };
      }

      if (type === "OPEN") {
          return {
              id, type, question: text,
              modelAnswer: raw.modelAnswer || raw.correctAnswer || ""
          };
      }

      return { id, type: 'SINGLE', question: text, options: [], correctAnswerIndex: 0, imageUrl: null };
  };


  // ==============================================================================
  // 2. MAIN TRANSFORMER (Fix for parts.find error)
  // ==============================================================================
  const transformItem = (item: any) => {
      const mode = currentCatConfig.mode;

      if (mode === 'theory') {
          const normalized = normalizeQuestion(item);
          return {
              ...normalized,
              order: Number(item.order || item.id || 999),
              category: category,
              createdAt: serverTimestamp()
          };
      }

      // READING / LISTENING
      if (mode === 'reading' || mode === 'listening') {
          // FIX: Handle both Array and Object structure for parts
          const rawParts = item.parts;
          
          let listA: any[] = [];
          let listB: any[] = [];
          let objC: any = {};

          if (Array.isArray(rawParts)) {
              // Old format: parts is array
              const pA = rawParts.find((p:any) => p.id === 'A');
              const pB = rawParts.find((p:any) => p.id === 'B');
              const pC = rawParts.find((p:any) => p.id === 'C');
              listA = pA?.questions || [];
              listB = pB?.questions || [];
              objC = pC || {};
          } else if (typeof rawParts === 'object' && rawParts !== null) {
              // New format: parts is object { partA: [...], partB: [...] }
              // Тут ми перевіряємо, чи це масив питань, чи об'єкт з questions
              if (Array.isArray(rawParts.partA)) listA = rawParts.partA;
              else if (rawParts.partA?.questions) listA = rawParts.partA.questions;

              if (Array.isArray(rawParts.partB)) listB = rawParts.partB;
              else if (rawParts.partB?.questions) listB = rawParts.partB.questions;

              objC = rawParts.partC || {};
          }

          return {
              id: String(item.id || Date.now()),
              order: Number(item.order || item.id || 999),
              title: item.title || `Lesson ${item.id}`,
              textContent: item.textContent || item.text_content || item.text || "",
              audioUrl: item.audioUrl || item.mp3_url || "",
              transcript: item.transcript || "",
              imageUrls: item.imageUrls || (item.image ? [item.image] : []),
              
              parts: {
                  partA: listA.map(normalizeQuestion),
                  partB: listB.map(normalizeQuestion),
                  ...(mode === 'reading' ? {
                      partC: {
                          id: "C",
                          type: "OPEN",
                          question: objC.question || objC.prompt || objC.text_content || item.writing_prompt || "Writing Task",
                          modelAnswer: objC.modelAnswer || ""
                      }
                  } : {})
              },
              createdAt: serverTimestamp()
          };
      }

      // SPEAKING
      if (mode === 'speaking') {
          return {
              id: String(item.id || Date.now()),
              order: Number(item.order || item.id || 999),
              title: item.title || "Speaking Topic",
              prompt: item.prompt || item.content || "",
              imageUrls: item.imageUrls || item.images || [],
              tips: item.tips || [],
              createdAt: serverTimestamp()
          };
      }

      return item;
  };


  // --- ACTIONS ---

  const handleImport = async () => {
    if (!jsonInput) return;
    setIsLoading(true);
    setStatus(null);

    try {
      const parsed = JSON.parse(jsonInput);
      const rawData = Array.isArray(parsed) ? parsed : (parsed.themes || parsed.questions || []);

      if (rawData.length === 0) throw new Error("JSON пустий або має неправильний формат.");

      const batch = writeBatch(db);
      let count = 0;

      rawData.forEach((item: any) => {
          const cleanData = transformItem(item);
          Object.keys(cleanData).forEach(key => cleanData[key] === undefined && delete cleanData[key]);

          const docId = cleanData.id || String(cleanData.order);
          const docRef = doc(collection(db, currentCatConfig.collection), docId);
          batch.set(docRef, cleanData);
          count++;
      });

      await batch.commit();
      setStatus({ type: 'success', msg: `Επιτυχία! Εισήχθησαν ${count} εγγραφές στο ${currentCatConfig.collection}.` });
      setJsonInput("");
    } catch (e: any) {
      console.error(e);
      setStatus({ type: 'error', msg: "Σφάλμα: " + e.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm(`ΠΡΟΣΟΧΗ! Θα διαγραφούν ΟΛΑ τα δεδομένα από ${currentCatConfig.collection}. Συνέχεια;`)) return;
    setIsLoading(true);
    try {
      const ref = collection(db, currentCatConfig.collection);
      const snap = await getDocs(query(ref, limit(500)));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      setStatus({ type: 'success', msg: `Η συλλογή καθαρίστηκε.` });
    } catch (e: any) { setStatus({ type: 'error', msg: e.message }); }
    finally { setIsLoading(false); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => { if (ev.target?.result) setJsonInput(ev.target.result as string); };
      reader.readAsText(file);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 font-sans pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/manage" className="p-2 bg-white rounded-lg border hover:bg-slate-50"><ArrowLeft/></Link>
        <h1 className="text-2xl font-black text-slate-900">Import (Universal Fix)</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* SIDEBAR */}
          <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Κατηγορία</label>
              {CATEGORIES.map(c => (
                  <button 
                    key={c.id} 
                    onClick={() => setCategory(c.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all ${category === c.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                  >
                      {c.label}
                  </button>
              ))}
              
              <div className="pt-6 mt-6 border-t border-slate-200">
                  <button onClick={handleClear} className="w-full flex items-center justify-center gap-2 text-red-500 text-xs font-black uppercase p-3 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                      <Trash2 size={14}/> Clear DB
                  </button>
              </div>
          </div>

          {/* MAIN AREA */}
          <div className="lg:col-span-3 space-y-6">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 items-start">
                  <Info className="text-blue-600 shrink-0 mt-1"/>
                  <div className="text-sm text-blue-800">
                      <p className="font-bold mb-1">Target Collection: {currentCatConfig.collection}</p>
                      <p className="opacity-80">This importer handles both ARRAY and OBJECT structures for lessons.</p>
                  </div>
              </div>

              <div className="relative">
                  <textarea 
                      value={jsonInput} 
                      onChange={e => setJsonInput(e.target.value)}
                      className="w-full h-[500px] p-6 rounded-2xl border-2 border-slate-200 font-mono text-xs focus:ring-4 focus:ring-blue-50 focus:border-blue-300 outline-none"
                      placeholder={`Paste JSON for ${currentCatConfig.label}...`}
                  />
                  <label className="absolute bottom-4 right-4 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-800 flex items-center gap-2 shadow-lg">
                      <FileJson size={14}/> Upload JSON
                      <input type="file" hidden accept=".json" onChange={handleFileUpload}/>
                  </label>
              </div>

              {status && (
                  <div className={`p-4 rounded-xl font-bold flex items-center gap-2 ${status.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {status.type === 'success' ? <CheckCircle size={18}/> : <AlertTriangle size={18}/>}
                      {status.msg}
                  </div>
              )}

              <button 
                  onClick={handleImport} 
                  disabled={isLoading || !jsonInput}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
              >
                  {isLoading ? <Loader2 className="animate-spin"/> : <Upload/>} 
                  Import Data
              </button>
          </div>
      </div>
    </div>
  );
}