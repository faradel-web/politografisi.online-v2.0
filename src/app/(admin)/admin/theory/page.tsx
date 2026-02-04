"use client";

import { useState, useEffect } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, serverTimestamp, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  Save, Loader2, ArrowLeft, Plus, Trash2, FileText, 
  Video, Bot, Edit3, X, Book, AlertCircle, CheckCircle 
} from "lucide-react";
import Link from "next/link";

// --- PDF.JS SETUP (FIXED VERSION 3.11.174) ---
// 1. Імпортуємо бібліотеку
const pdfjsLib = require("pdfjs-dist/build/pdf");

// 2. Налаштовуємо Worker через надійний CDN (Cloudflare)
// Це вирішує проблему "Fake worker failed"
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

// --- TYPES ---
interface Lesson {
  id: string;
  order: number;
  title: string;
  content: string; // HTML опис
  videoUrl: string;
  category: string;
}

const CATEGORIES = [
  { id: "history", label: "Ιστορία (Історія)" },
  { id: "politics", label: "Πολιτική (Πολιтика)" },
  { id: "geography", label: "Γεωγραφία (Географія)" },
  { id: "culture", label: "Πολιτισμός (Культура)" },
  { id: "reading", label: "Ανάγνωση (Reading)" },
  { id: "listening", label: "Ακρόαση (Listening)" },
  { id: "speaking", label: "Προφορικά (Speaking)" },
];

export default function AdminTheoryGlobal() {
  const [selectedCat, setSelectedCat] = useState("history");
  
  // STATE: УРОКИ
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLessonLoading, setIsLessonLoading] = useState(true);
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<Partial<Lesson>>({});
  const [isSavingLesson, setIsSavingLesson] = useState(false);

  // STATE: ГЛОБАЛЬНА БАЗА ЗНАНЬ (PDF)
  const [globalContextSize, setGlobalContextSize] = useState(0); 
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  // 1. ЗАВАНТАЖЕННЯ ДАНИХ
  useEffect(() => {
    loadLessons();
    loadGlobalContextInfo();
  }, [selectedCat]);

  async function loadLessons() {
    setIsLessonLoading(true);
    try {
      const q = query(
        collection(db, "theory_lessons"), 
        where("category", "==", selectedCat),
        orderBy("order", "asc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Lesson));
      setLessons(data);
    } catch (e) { console.error(e); }
    finally { setIsLessonLoading(false); }
  }

  async function loadGlobalContextInfo() {
    try {
      const docRef = doc(db, "theory_knowledge_base", selectedCat);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const text = snap.data().text || "";
        setGlobalContextSize(text.length);
      } else {
        setGlobalContextSize(0);
      }
    } catch (e) { console.error(e); }
  }

  // 2. ПАРСИНГ PDF (СТАБІЛЬНИЙ)
  const handleGlobalPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 40 * 1024 * 1024) {
        alert("Файл занадто великий (>40MB).");
        return;
    }

    setIsUploadingPdf(true);
    try {
      console.log(`Початок обробки: ${file.name}`);
      const arrayBuffer = await file.arrayBuffer();
      
      let extractedText = "";
      
      try {
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          
          console.log(`PDF завантажено. Сторінок: ${pdf.numPages}`);
          const maxPagesToRead = Math.min(pdf.numPages, 100); 

          for (let i = 1; i <= maxPagesToRead; i++) {
            if (pdf.numPages > 100 && i > 20 && i % 2 !== 0) continue; 

            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(" ")
                .replace(/\s+/g, " "); 

            if (pageText.length > 50) {
                extractedText += `\n[Page ${i}]: ${pageText}`;
            }
          }
      } catch (pdfError: any) {
          console.error("PDF Parser Error:", pdfError);
          throw new Error("Не вдалося прочитати PDF. Можливо, він захищений паролем.");
      }

      if (extractedText.length < 100) {
          alert("Увага: Тексту дуже мало. Перевірте, чи це не скан (картинка).");
      }

      // Зберігаємо в Firestore
      const docRef = doc(db, "theory_knowledge_base", selectedCat);
      await setDoc(docRef, {
        text: extractedText,
        lastUpdated: serverTimestamp(),
        fileName: file.name,
        fileSize: file.size
      }, { merge: true });

      setGlobalContextSize(extractedText.length);
      alert(`Успіх! AI отримав ${extractedText.length} символів з файлу "${file.name}".`);

    } catch (error: any) {
      console.error("Upload Error:", error);
      alert(`Помилка: ${error.message}`);
    } finally {
      setIsUploadingPdf(false);
      e.target.value = ""; 
    }
  };

  // 3. ЗБЕРЕЖЕННЯ УРОКУ
  const handleSaveLesson = async () => {
    if (!currentLesson.title) return alert("Введіть назву уроку");
    setIsSavingLesson(true);
    try {
      const payload = {
        category: selectedCat,
        title: currentLesson.title,
        content: currentLesson.content || "",
        videoUrl: currentLesson.videoUrl || "",
        order: currentLesson.order || lessons.length + 1,
        updatedAt: serverTimestamp()
      };

      if (currentLesson.id) {
        await updateDoc(doc(db, "theory_lessons", currentLesson.id), payload);
      } else {
        await addDoc(collection(db, "theory_lessons"), payload);
      }
      
      setIsEditingLesson(false);
      setCurrentLesson({});
      loadLessons();
    } catch (e) { alert("Помилка збереження: " + e); }
    finally { setIsSavingLesson(false); }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm("Видалити урок?")) return;
    await deleteDoc(doc(db, "theory_lessons", id));
    loadLessons();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 sticky top-4 z-20">
             <div className="flex items-center gap-4">
                <Link href="/admin" className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                    <ArrowLeft size={20}/>
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Керування Розділом</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global AI Context & Lessons</p>
                </div>
            </div>
            
            <select 
                value={selectedCat} 
                onChange={(e) => { setSelectedCat(e.target.value); setIsEditingLesson(false); }}
                className="p-3 bg-blue-50 text-blue-800 font-bold rounded-xl border border-blue-100 outline-none cursor-pointer"
            >
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
            
            {/* LEFT: PDF UPLOAD */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-indigo-900 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white/10 rounded-lg"><Book className="h-6 w-6 text-indigo-200"/></div>
                            <h2 className="font-bold text-lg">Підручник Розділу</h2>
                        </div>
                        <p className="text-indigo-200 text-sm mb-6 leading-relaxed">
                            Завантажте PDF з усією теорією для розділу "<b>{CATEGORIES.find(c=>c.id===selectedCat)?.label}</b>". 
                        </p>

                        <div className="bg-indigo-800/50 rounded-xl p-4 border border-indigo-700 mb-6">
                            <div className="text-xs font-bold text-indigo-300 uppercase mb-1">Статус AI</div>
                            {globalContextSize > 0 ? (
                                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                                    <Bot size={18}/>
                                    <span>Знає {globalContextSize.toLocaleString()} символів</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-orange-300 font-bold">
                                    <AlertCircle size={18}/>
                                    <span>База пуста</span>
                                </div>
                            )}
                        </div>

                        <label className={`block w-full py-3 bg-white text-indigo-900 font-black text-center rounded-xl cursor-pointer hover:bg-indigo-50 transition-colors ${isUploadingPdf ? 'opacity-70 pointer-events-none' : ''}`}>
                            {isUploadingPdf ? (
                                <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={16}/> Обробка PDF...</span>
                            ) : (
                                "Завантажити / Оновити PDF"
                            )}
                            <input type="file" accept="application/pdf" className="hidden" onChange={handleGlobalPdfUpload} disabled={isUploadingPdf}/>
                        </label>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-700 mb-2 text-sm">Інфо</h3>
                    <ul className="text-xs text-slate-500 space-y-2 list-disc pl-4">
                        <li>PDF - єдине джерело для AI.</li>
                        <li>Новий файл замінює старий контекст.</li>
                    </ul>
                </div>
            </div>

            {/* RIGHT: LESSONS */}
            <div className="lg:col-span-2">
                {!isEditingLesson ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center px-2">
                            <h2 className="text-xl font-black text-slate-800">План Уроків</h2>
                            <button onClick={() => { setCurrentLesson({ order: lessons.length + 1 }); setIsEditingLesson(true); }} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg text-sm">
                                <Plus size={16}/> Новий Урок
                            </button>
                        </div>

                        {isLessonLoading ? <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-blue-500"/></div> : (
                            <div className="grid gap-3">
                                {lessons.map((l) => (
                                    <div key={l.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-300 transition-all">
                                        <div className="flex items-center gap-4">
                                            <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-black text-slate-400 text-sm">#{l.order}</span>
                                            <div>
                                                <h3 className="font-bold text-slate-900">{l.title}</h3>
                                                <div className="flex gap-3 text-xs font-medium text-slate-400 mt-0.5">
                                                    {l.videoUrl && <span className="flex items-center gap-1 text-red-500"><Video size={12}/> Video</span>}
                                                    <span className="flex items-center gap-1 text-emerald-600"><CheckCircle size={12}/> Активний</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setCurrentLesson(l); setIsEditingLesson(true); }} className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"><Edit3 size={16}/></button>
                                            <button onClick={() => handleDeleteLesson(l.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                ))}
                                {lessons.length === 0 && <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-slate-200 text-slate-400">Уроків ще немає. Створіть структуру курсу.</div>}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in slide-in-from-bottom-4 relative">
                        <button onClick={() => setIsEditingLesson(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
                        <h2 className="text-xl font-black text-slate-900 mb-6">{currentLesson.id ? "Редагування Уроку" : "Створення Уроку"}</h2>

                        <div className="space-y-5">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-3 space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Назва</label>
                                    <input 
                                        value={currentLesson.title || ""} 
                                        onChange={e => setCurrentLesson({...currentLesson, title: e.target.value})}
                                        className="w-full p-3 bg-slate-50 border-none rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-100" 
                                        placeholder="Назва temi..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">№</label>
                                    <input 
                                        type="number"
                                        value={currentLesson.order || 0} 
                                        onChange={e => setCurrentLesson({...currentLesson, order: Number(e.target.value)})}
                                        className="w-full p-3 bg-slate-50 border-none rounded-xl font-bold outline-none text-center" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Відео (YouTube)</label>
                                <input 
                                    value={currentLesson.videoUrl || ""} 
                                    onChange={e => setCurrentLesson({...currentLesson, videoUrl: e.target.value})}
                                    className="w-full p-3 bg-slate-50 border-none rounded-xl font-medium outline-none text-sm" 
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Опис / Конспект (HTML)</label>
                                <textarea 
                                    value={currentLesson.content || ""} 
                                    onChange={e => setCurrentLesson({...currentLesson, content: e.target.value})}
                                    className="w-full h-48 p-4 bg-slate-50 border-none rounded-xl font-medium outline-none text-sm leading-relaxed" 
                                    placeholder="Короткий вступ до уроку..."
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button onClick={() => setIsEditingLesson(false)} className="px-5 py-2.5 font-bold text-slate-400 hover:text-slate-600">Скасувати</button>
                                <button onClick={handleSaveLesson} disabled={isSavingLesson} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black shadow-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2">
                                    {isSavingLesson ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
                                    Зберегти
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}