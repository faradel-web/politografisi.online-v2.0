"use client";

import { useState, useEffect, useRef, use } from "react";
// Якщо Next.js версії 14/15, params приходить як Promise, тому використовуємо хук use() або useParams()
import { useParams } from "next/navigation"; 
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";
import { 
  ArrowLeft, Bot, Send, Loader2, Video, FileText, ChevronRight, Menu 
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from 'react-markdown';

// --- ТИПИ ---
interface Lesson {
  id: string;
  order: number;
  title: string;
  content: string; // HTML контент
  videoUrl: string;
}

interface Message {
  role: 'user' | 'ai';
  text: string;
}

const CATEGORY_NAMES: Record<string, string> = {
  history: "Ιστορία (Історія)",
  politics: "Πολιτική (Політика)",
  geography: "Γεωγραφία (Географія)",
  culture: "Πολιτισμός (Культура)",
  reading: "Ανάγνωση (Reading)",
  listening: "Ακρόαση (Listening)",
  speaking: "Προφορικά (Speaking)",
};

export default function TheoryPage({ params }: { params: Promise<{ category: string }> }) {
  // Розпаковуємо параметри (сумісність з Next.js 15)
  const resolvedParams = use(params);
  const categoryId = resolvedParams.category;

  // STATE: ДАНІ
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [globalContext, setGlobalContext] = useState(""); // Текст PDF для AI
  const [isLoading, setIsLoading] = useState(true);

  // STATE: ЧАТ
  const [isChatOpen, setIsChatOpen] = useState(true); // Чат відкритий за замовчуванням на ПК
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Привіт! Я твій персональний викладач. Я вже прочитав усі матеріали цього розділу (PDF).\n\nЯкщо щось у тексті уроку незрозуміло — запитай мене, і я поясню!' }
  ]);
  const [input, setInput] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. ЗАВАНТАЖЕННЯ ДАНИХ (УРОКИ + PDF)
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        console.log("Fetching lessons for:", categoryId);

        // А. Завантажуємо список уроків (theory_lessons)
        const q = query(
          collection(db, "theory_lessons"), 
          where("category", "==", categoryId),
          orderBy("order", "asc")
        );
        const snapshot = await getDocs(q);
        const loadedLessons = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Lesson));
        setLessons(loadedLessons);
        
        // Активуємо перший урок, якщо він є
        if (loadedLessons.length > 0) {
          setActiveLesson(loadedLessons[0]);
        }

        // Б. Завантажуємо контекст PDF (theory_knowledge_base)
        const docRef = doc(db, "theory_knowledge_base", categoryId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setGlobalContext(docSnap.data().text || "");
          console.log("PDF Context loaded");
        } else {
          console.log("No PDF context found");
        }

      } catch (e) {
        console.error("Error loading data:", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [categoryId]);

  // Авто-скрол чату вниз
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 2. ВІДПРАВКА ПОВІДОМЛЕННЯ В AI
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isAiThinking) return;

    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsAiThinking(true);

    try {
      // Відправляємо запит на наш API (API Route)
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          context: globalContext, // Передаємо "мозок" (текст PDF)
          history: messages 
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'ai', text: data.text }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', text: "Вибач, я зараз не можу відповісти. Спробуй пізніше." }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Helper для відео YouTube
  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin h-10 w-10 text-blue-600"/></div>;

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden font-sans text-slate-900">
      
      {/* --- HEADER --- */}
      <header className="h-16 border-b border-slate-100 flex items-center justify-between px-4 bg-white shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Кнопка НАЗАД веде на дашборд категорії */}
          <Link href={`/study/${categoryId}`} className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors">
            <ArrowLeft className="h-5 w-5"/>
          </Link>
          <div>
            <h1 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <span className="hidden sm:inline text-slate-400 font-medium text-xs uppercase tracking-widest">Теорія:</span>
              {CATEGORY_NAMES[categoryId] || categoryId}
            </h1>
          </div>
        </div>
        
        {/* Toggle Chat Button */}
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all text-sm ${isChatOpen ? 'bg-indigo-50 text-indigo-600 ring-2 ring-indigo-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          <Bot size={18}/>
          <span className="hidden sm:inline">{isChatOpen ? "Приховати AI" : "Запитати AI"}</span>
        </button>
      </header>

      {/* --- MAIN CONTENT LAYOUT --- */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT PANEL: LESSON CONTENT */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isChatOpen ? 'mr-0 lg:mr-[400px]' : 'mr-0'}`}>
          
          {/* Horizontal Lessons Navigation */}
          <div className="h-14 border-b border-slate-100 flex items-center px-4 gap-2 overflow-x-auto bg-slate-50/50 shrink-0 scrollbar-hide">
            {lessons.length > 0 ? (
                lessons.map(l => (
                <button 
                    key={l.id}
                    onClick={() => setActiveLesson(l)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                    activeLesson?.id === l.id 
                        ? 'bg-white border-blue-200 text-blue-700 shadow-sm' 
                        : 'bg-transparent border-transparent text-slate-500 hover:bg-white hover:border-slate-200'
                    }`}
                >
                    {l.order}. {l.title}
                </button>
                ))
            ) : (
                <span className="text-xs text-slate-400 italic px-2">Уроків ще немає. Додайте їх в адмінці.</span>
            )}
          </div>

          {/* Active Lesson View */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar bg-white">
            {activeLesson ? (
              <div className="max-w-3xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                    <span>Урок {activeLesson.order}</span>
                    <ChevronRight size={12}/>
                    <span>Конспект</span>
                </div>
                
                <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-8 font-serif leading-tight">{activeLesson.title}</h2>
                
                {activeLesson.videoUrl && getEmbedUrl(activeLesson.videoUrl) && (
                  <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-xl mb-10 bg-black ring-4 ring-slate-100">
                    <iframe src={getEmbedUrl(activeLesson.videoUrl)!} className="w-full h-full" allowFullScreen></iframe>
                  </div>
                )}

                {/* HTML CONTENT RENDERER */}
                <div 
                  className="prose prose-slate prose-lg max-w-none font-serif leading-loose text-slate-700 prose-headings:font-black prose-a:text-blue-600 prose-img:rounded-2xl"
                  dangerouslySetInnerHTML={{ __html: activeLesson.content }} 
                />

                {/* AI Call to Action */}
                <div className="mt-12 p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
                    <div className="p-3 bg-white rounded-full text-blue-600 shadow-sm"><Bot size={24}/></div>
                    <div>
                        <h4 className="font-bold text-blue-900 mb-1">Щось незрозуміло?</h4>
                        <p className="text-sm text-blue-700/80 mb-3">AI-викладач знає зміст PDF-підручника і готовий пояснити деталі.</p>
                        <button onClick={() => setIsChatOpen(true)} className="text-xs font-black uppercase tracking-wider text-blue-600 hover:text-blue-800 underline">Відкрити Чат</button>
                    </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <FileText size={48} className="mb-4 opacity-20"/>
                <p>Оберіть урок зверху або додайте перший урок через Адмінку.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: AI CHAT (Notebook Style) */}
        <div className={`fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white border-l border-slate-200 shadow-2xl transform transition-transform duration-300 z-30 flex flex-col ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            
            {/* Chat Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-white shrink-0">
                <div className="flex items-center gap-2 text-indigo-900">
                    <div className="p-1.5 bg-indigo-100 rounded-lg"><Bot size={18}/></div>
                    <div>
                        <span className="font-bold text-sm block leading-none">AI Репетитор</span>
                        <span className="text-[10px] text-indigo-400 font-medium">Powered by Gemini & Ваші PDF</span>
                    </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <ArrowLeft size={18} className="rotate-180"/>
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scroll-smooth">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                            m.role === 'user' 
                                ? 'bg-slate-900 text-white rounded-br-none' 
                                : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                        }`}>
                            {m.role === 'ai' ? (
                                <ReactMarkdown 
                                  components={{
                                    p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                                    strong: ({node, ...props}) => <span className="font-black text-indigo-900" {...props} />
                                  }}
                                >
                                    {m.text}
                                </ReactMarkdown>
                            ) : m.text}
                        </div>
                    </div>
                ))}
                {isAiThinking && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-bl-none flex gap-1">
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                <form onSubmit={handleSendMessage} className="relative">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Запитай щось про урок..."
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 outline-none text-sm font-medium transition-all placeholder:text-slate-400"
                    />
                    <button 
                        type="submit" 
                        disabled={!input.trim() || isAiThinking}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-md shadow-indigo-200"
                    >
                        <Send size={16}/>
                    </button>
                </form>
            </div>
        </div>

      </div>
    </div>
  );
}