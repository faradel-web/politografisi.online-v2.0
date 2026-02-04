"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { db, storage } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; 
import { 
  ArrowLeft, Save, Loader2, Upload, X, Mic, 
  Image as ImageIcon, AlignLeft, Info, Sparkles, Bot
} from "lucide-react";

export default function SpeakingQuestionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Φόρτωση...</div>}>
      <NewSpeakingLessonPage />
    </Suspense>
  );
}

function NewSpeakingLessonPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // --- ДАНІ УРОКУ ---
  const [order, setOrder] = useState<number>(1);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<string[]>([]);
  
  // --- ДАНІ ДЛЯ ШІ (Майбутня перевірка) ---
  const [aiContext, setAiContext] = useState(""); // Що має сказати студент, щоб це зарахували

  // --- ЛОГІКА ЗАВАНТАЖЕННЯ ---
  useEffect(() => {
    if (editId) {
      const loadData = async () => {
        try {
          const docRef = doc(db, "lessons_speaking", editId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            setOrder(data.order !== undefined ? data.order : 1);
            setTitle(data.title || "");
            setPrompt(data.prompt || "");
            setImages(data.imageUrls || []);
            setAiContext(data.aiContext || ""); // Завантаження контексту для ШІ
          }
        } catch (e) {
          console.error("Error loading speaking doc:", e);
        } finally {
          setIsLoaded(true);
        }
      };
      loadData();
    } else {
      setIsLoaded(true);
    }
  }, [editId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      try {
        const newUrls = [];
        for (let i = 0; i < e.target.files.length; i++) {
            const file = e.target.files[i];
            const storageRef = ref(storage, `speaking/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);
            newUrls.push(url);
        }
        setImages([...images, ...newUrls]);
      } catch (err) {
        alert("Помилка завантаження фото");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !prompt) return alert("Заповніть заголовок та текст завдання.");
    
    // ВАЛІДАЦІЯ ТЕМ
    if (order < 0 || order > 25) {
        return alert("Номер теми повинен бути від 0 до 25.");
    }

    setIsSaving(true);
    try {
      const docData = {
        order: Number(order),
        title,
        prompt,
        imageUrls: images,
        aiContext, // Зберігаємо інструкції для ШІ
        updatedAt: serverTimestamp(),
      };

      if (editId) {
        await updateDoc(doc(db, "lessons_speaking", editId), docData);
        alert("Оновлено успішно!");
      } else {
        await addDoc(collection(db, "lessons_speaking"), { ...docData, createdAt: serverTimestamp() });
        alert("Збережено успішно!");
      }
      router.push('/admin/manage');
    } catch (error) {
      console.error(error);
      alert("Помилка при збереженні");
    } finally {
      setIsSaving(false);
    }
  };

  // Шаблон для Теми 0
  const fillIntroTemplate = () => {
      setOrder(0);
      setTitle("Εισαγωγικές ερωτήσεις (ΘΕΜΑ 0)");
      setPrompt(
`Εισαγωγικές ερωτήσεις γνωριμίας:
• Πότε ήρθατε στην Ελλάδα; Πώς προέκυψε;
• Εργάζεστε; Αν ναι, που;
• Έχετε οικογένεια;
• Γιατί θέλετε να μείνετε στην Ελλάδα;`
      );
      setAiContext("Студент повинен розповісти про себе, свою роботу, сім'ю та причини перебування в Греції. Відповідь має бути зв'язною.");
  };

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center font-black animate-pulse text-slate-400 font-serif text-2xl tracking-widest">ΦΟΡΤΩΣΗ...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-32 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <Link href="/admin/manage" className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-slate-400 hover:text-orange-600 shadow-sm">
              <ArrowLeft className="h-5 w-5"/>
            </Link>
            <div>
              <h1 className="text-3xl font-black text-slate-900 font-serif tracking-tight">
                {editId ? "Редагування Speaking" : "Новий урок Speaking"}
              </h1>
              <p className="text-slate-500 font-medium mt-1">
                Теми <code className="text-orange-600 font-bold">0 - 25</code>
              </p>
            </div>
          </div>
          
          {!editId && (
            <button 
              type="button"
              onClick={fillIntroTemplate} 
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-50 text-orange-700 rounded-xl border border-orange-100 text-sm font-black hover:bg-orange-100 transition-colors shadow-sm"
            >
              <Sparkles className="h-4 w-4"/>
              ΘΕΜΑ 0 (Intro)
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">

          {/* MAIN FORM */}
          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-8">
            <div className="flex items-center gap-3 text-slate-400 border-b border-slate-50 pb-6">
              <Mic className="h-5 w-5"/>
              <h2 className="text-xs font-black uppercase tracking-widest">Деталі теми</h2>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-32">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">№ Теми</label>
                    <input 
                        type="number" 
                        min="0" 
                        max="25" 
                        value={order} 
                        onChange={e => setOrder(Number(e.target.value))} 
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-center text-xl outline-none focus:ring-4 focus:ring-orange-50 focus:bg-white transition-all"
                    />
                    <p className="text-[10px] text-center text-slate-400 mt-2 font-bold">Ліміт: 0-25</p>
                </div>
                <div className="flex-1">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">Заголовок</label>
                    <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-lg outline-none focus:ring-4 focus:ring-orange-50 focus:bg-white transition-all" placeholder="π.χ. ΘΕΜΑ 1: Η καθημερινότητά μου"/>
                </div>
            </div>

            <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
                    <AlignLeft className="h-4 w-4"/> Питання та Завдання
                </label>
                <textarea 
                    required
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] h-56 text-lg leading-relaxed text-slate-700 font-medium outline-none focus:ring-4 focus:ring-orange-50 focus:bg-white transition-all"
                    placeholder="Введіть список питань, на які студент повинен відповісти..."
                />
            </div>

            {/* Блок завантаження фото */}
            <div className="bg-orange-50/50 p-8 rounded-[2rem] border border-orange-100/50">
                <div className="flex items-center justify-between mb-6">
                    <label className="text-xs font-black text-orange-400 uppercase tracking-widest flex items-center gap-2">
                        <ImageIcon className="h-4 w-4"/> Ілюстрації
                    </label>
                    <span className="text-[10px] font-bold text-orange-300 bg-white px-2 py-1 rounded-lg border border-orange-100">Для опису</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {images.map((url, idx) => (
                        <div key={idx} className="relative group aspect-square bg-white rounded-3xl border-4 border-white overflow-hidden shadow-lg hover:rotate-2 transition-transform">
                            <img src={url} className="w-full h-full object-cover" alt=""/>
                            <button type="button" onClick={() => setImages(images.filter((_, i) => i !== idx))} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                <X className="h-4 w-4"/>
                            </button>
                        </div>
                    ))}
                    
                    <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-orange-200 rounded-3xl cursor-pointer hover:bg-white hover:border-orange-400 transition-all text-orange-400 group">
                        {isUploading ? <Loader2 className="animate-spin h-6 w-6"/> : <Upload className="h-6 w-6 group-hover:scale-110 transition-transform"/>}
                        <span className="text-[10px] font-black uppercase mt-3">Додати фото</span>
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload}/>
                    </label>
                </div>
            </div>
          </section>

          {/* AI CONFIGURATION SECTION */}
          <section className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200 border border-slate-800 space-y-6">
            <div className="flex items-center gap-3 text-emerald-400 border-b border-slate-700 pb-6">
              <Bot className="h-6 w-6"/>
              <h2 className="text-xs font-black uppercase tracking-widest">Налаштування AI-Перевірки (Майбутнє)</h2>
            </div>
            
            <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Очікувана відповідь / Ключові слова</label>
                <p className="text-[11px] text-slate-500">Напишіть сюди, що саме повинен сказати студент, щоб ШІ зарахував відповідь як правильну.</p>
                <textarea 
                    value={aiContext}
                    onChange={e => setAiContext(e.target.value)}
                    className="w-full p-5 bg-slate-800 border border-slate-700 rounded-2xl h-32 text-sm text-slate-300 font-mono outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                    placeholder="Приклад: Студент повинен описати картинку, вживаючи теперішній час. Має згадати: море, сонце, відпочинок..."
                />
            </div>
          </section>

          {/* SUBMIT */}
          <div className="flex justify-end pt-4">
            <button 
                type="submit" 
                disabled={isSaving || isUploading}
                className="bg-orange-600 text-white px-12 py-5 rounded-[2rem] font-black text-lg flex items-center gap-4 hover:bg-orange-700 transition-all shadow-2xl hover:-translate-y-1 disabled:opacity-50"
            >
                {isSaving ? <Loader2 className="animate-spin h-6 w-6"/> : <Save className="h-6 w-6"/>}
                {editId ? "Оновити тему" : "Створити тему"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}