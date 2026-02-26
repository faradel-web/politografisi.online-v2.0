"use client";

import { useState, useEffect, useRef, use } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";
import {
  ArrowLeft, Bot, Send, Loader2, Video, FileText, ChevronRight,
  Music, Download, File, X, Presentation, Menu, ArrowRight
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- ТИПИ ---
interface Attachment {
  name: string;
  url: string;
  type: 'pdf' | 'doc' | 'other';
}

interface Lesson {
  id: string;
  order: number;
  title: string;
  content: string;
  videoUrl: string;
  audioUrl?: string;
  presentationUrl?: string;
  attachments?: Attachment[];
  isPublished?: boolean;
}

interface Message {
  role: 'user' | 'ai';
  text: string;
}

// Переклад назв категорій
const CATEGORY_NAMES: Record<string, string> = {
  history: "Ιστορία",
  politics: "Πολιτική",
  geography: "Γεωγραφία",
  culture: "Πολιτισμός",
  reading: "Ανάγνωση",
  listening: "Ακρόαση",
  speaking: "Προφορικά",
};

export default function TheoryPage({ params }: { params: Promise<{ category: string }> }) {
  const resolvedParams = use(params);
  const categoryId = resolvedParams.category;

  // UI STATE
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight > clientHeight) {
      setScrollProgress((scrollTop / (scrollHeight - clientHeight)) * 100);
    }
  };

  // STATE: ДАНІ
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [globalContext, setGlobalContext] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // STATE: ЧАТ
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Γεια σου! Είμαι ο προσωπικός σου βοηθός AI. Έχω διαβάσει όλο το υλικό (PDF/Docs) αυτής της ενότητας.\n\nΑν κάτι δεν καταλαβαίνεις στο μάθημα ή στην παρουσίαση, ρώτησέ με!' }
  ]);
  const [input, setInput] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. ЗАВАНТАЖЕННЯ ДАНИХ
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, "theory_content"),
          where("category", "==", categoryId)
        );
        const snapshot = await getDocs(q);

        const loadedLessons = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() } as Lesson))
          .filter(l => l.isPublished !== false)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        setLessons(loadedLessons);

        if (loadedLessons.length > 0) {
          setActiveLesson(loadedLessons[0]);
        }

        const docRef = doc(db, "theory_knowledge_base", categoryId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setGlobalContext(docSnap.data().text || "");
        }

      } catch (e) {
        console.error("Error loading data:", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [categoryId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatOpen]);

  // 2. ВІДПРАВКА ПОВІДОМЛЕННЯ В AI
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isAiThinking) return;

    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsAiThinking(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          context: globalContext,
          history: messages
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'ai', text: data.text }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', text: "Συγγνώμη, έχω πρόβλημα σύνδεσης. Δοκίμασε ξανά αργότερα." }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Helper для YouTube
  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div>;

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden font-sans text-slate-900">

      {/* --- HEADER --- */}
      <header className="h-16 border-b border-slate-100 flex items-center justify-between px-4 bg-white shrink-0 z-20 shadow-sm relative">
        <div className="flex items-center gap-2 md:gap-4">
          <Link href={`/theory`} className="hidden md:flex p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex flex-col md:flex-row md:items-center md:gap-2 md:border-l md:border-slate-200 md:pl-4 pl-2">
            <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">ΘΕΩΡΙΑ</span>
            <h1 className="font-black text-slate-900 text-sm md:text-lg leading-tight">
              {CATEGORY_NAMES[categoryId] || categoryId}
            </h1>
          </div>
        </div>

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-xl font-bold transition-all text-xs md:text-sm ${isChatOpen ? 'bg-indigo-50 text-indigo-600 ring-2 ring-indigo-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          <Bot size={18} />
          <span className="hidden sm:inline">{isChatOpen ? "Κλείσιμο AI" : "AI Βοηθός"}</span>
          <span className="sm:hidden">AI</span>
        </button>
      </header>

      {/* --- MAIN CONTENT LAYOUT --- */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* LEFT SIDEBAR (DRAWER) */}
        {isSidebarOpen && <div className="fixed inset-0 bg-black/20 z-30 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>}

        <div className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-slate-50 border-r border-slate-200 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} shrink-0`}>
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
            <span className="font-bold text-slate-800 text-sm tracking-wide uppercase">Μαθήματα ({lessons.length})</span>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1.5 text-slate-400 hover:bg-slate-100 rounded-md"><X size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {lessons.length > 0 ? (
              lessons.map(l => (
                <button
                  key={l.id}
                  onClick={() => { setActiveLesson(l); setIsSidebarOpen(false); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all block ${activeLesson?.id === l.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-100'
                    }`}
                >
                  {l.order}. {l.title}
                </button>
              ))
            ) : (
              <div className="text-xs text-slate-400 italic text-center mt-10">Δεν υπάρχουν μαθήματα.</div>
            )}
          </div>
        </div>

        {/* LEFT PANEL: LESSON CONTENT */}
        <div className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${isChatOpen ? 'lg:mr-[400px]' : ''}`}>

          {/* PROGRESS BAR */}
          <div className="h-1 w-full bg-slate-100 shrink-0">
            <div className="h-full bg-blue-500 transition-all duration-150 ease-out" style={{ width: `${scrollProgress}%` }}></div>
          </div>

          {/* ACTIVE LESSON VIEW */}
          <div onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 custom-scrollbar bg-white scroll-smooth relative">
            {activeLesson ? (
              <div className="max-w-3xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* 1. TITLE */}
                <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 md:mb-4">
                  <span>Μάθημα {activeLesson.order}</span>
                  <ChevronRight size={12} />
                  <span>Περιεχόμενο</span>
                </div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 mb-6 md:mb-8 font-serif leading-tight">{activeLesson.title}</h2>

                {/* 2. VIDEO PLAYER */}
                {activeLesson.videoUrl && getEmbedUrl(activeLesson.videoUrl) && (
                  <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-xl mb-6 md:mb-8 bg-black ring-4 ring-slate-100">
                    <iframe src={getEmbedUrl(activeLesson.videoUrl)!} className="w-full h-full" allowFullScreen></iframe>
                  </div>
                )}

                {/* 3. AUDIO PLAYER */}
                {activeLesson.audioUrl && (
                  <div className="mb-6 md:mb-8 p-3 md:p-4 bg-purple-50 border border-purple-100 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 md:p-3 bg-white rounded-full text-purple-600 shadow-sm"><Music size={20} /></div>
                      <div>
                        <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Podcast</div>
                        <div className="font-bold text-purple-900 text-sm">Ακουστικό Μάθημα</div>
                      </div>
                    </div>
                    <audio controls src={activeLesson.audioUrl} className="w-full sm:w-auto sm:flex-1 h-8 md:h-10" />
                  </div>
                )}

                {/* 4. PRESENTATION VIEWER */}
                {activeLesson.presentationUrl && (
                  <div className="mb-8 md:mb-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 md:p-2 bg-orange-100 text-orange-600 rounded-lg"><Presentation size={16} /></div>
                      <h3 className="font-bold text-slate-800 text-xs md:text-sm uppercase tracking-wide">Παρουσίαση</h3>
                    </div>
                    {/* Aspect Ratio 16/9, Responsive Width */}
                    <div className="w-full aspect-[16/9] border border-slate-200 rounded-xl md:rounded-2xl overflow-hidden shadow-sm bg-slate-100">
                      <iframe
                        src={`https://docs.google.com/gview?url=${encodeURIComponent(activeLesson.presentationUrl)}&embedded=true`}
                        className="w-full h-full"
                        frameBorder="0"
                      >
                        <p>Η συσκευή σας δεν υποστηρίζει την προβολή.</p>
                      </iframe>
                    </div>
                  </div>
                )}

                {/* 5. HTML CONTENT (Responsive Typography) */}
                <div
                  className="prose prose-slate prose-base md:prose-lg max-w-none font-serif leading-loose text-slate-700 prose-headings:font-black prose-a:text-blue-600 prose-img:rounded-2xl mb-8 md:mb-12 break-words"
                  dangerouslySetInnerHTML={{ __html: activeLesson.content }}
                />

                {/* 6. ATTACHMENTS */}
                {activeLesson.attachments && activeLesson.attachments.length > 0 && (
                  <div className="mb-12">
                    <h3 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2"><FileText size={16} /> Αρχεία για Λήψη</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {activeLesson.attachments.map((file, idx) => (
                        <a
                          key={idx}
                          href={file.url}
                          target="_blank"
                          download
                          className="flex items-center gap-3 p-3 md:p-4 bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all rounded-xl group"
                        >
                          <div className="p-2 bg-white rounded-lg text-slate-400 group-hover:text-blue-500 transition-colors"><File size={20} /></div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-slate-700 text-sm truncate group-hover:text-blue-700">{file.name}</div>
                            <div className="text-[10px] text-slate-400 uppercase">Λήψη</div>
                          </div>
                          <Download size={16} className="text-slate-300 group-hover:text-blue-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Call to Action */}
                <div className="mt-8 md:mt-12 p-4 md:p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-4">
                  <div className="p-2 md:p-3 bg-white rounded-full text-indigo-600 shadow-sm"><Bot size={24} /></div>
                  <div>
                    <h4 className="font-bold text-indigo-900 mb-1 text-sm md:text-base">Έχεις απορίες;</h4>
                    <p className="text-xs md:text-sm text-indigo-700/80 mb-3">Ο καθηγητής AI είναι εδώ για να σου εξηγήσει οτιδήποτε.</p>
                    <button onClick={() => setIsChatOpen(true)} className="text-xs font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-800 underline">Άνοιγμα Chat</button>
                  </div>
                </div>

                {/* NEXT LESSON BUTTON */}
                {(() => {
                  const currentIndex = lessons.findIndex(l => l.id === activeLesson.id);
                  const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
                  if (nextLesson) {
                    return (
                      <div className="mt-12 flex justify-end border-t border-slate-100 pt-8">
                        <button
                          onClick={() => {
                            setActiveLesson(nextLesson);
                            document.querySelector('.custom-scrollbar')?.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="group flex flex-col items-end text-right hover:-translate-y-1 transition-transform"
                        >
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Επόμενο Μάθημα</span>
                          <span className="flex items-center gap-3 text-lg font-black text-blue-600 group-hover:text-blue-700">
                            {nextLesson.title} <ArrowRight className="w-5 h-5 bg-blue-100 rounded-full p-0.5" />
                          </span>
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center p-4">
                <FileText size={48} className="mb-4 opacity-20" />
                <p className="text-sm">Επιλέξτε ένα μάθημα από τη λίστα παραπάνω.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: AI CHAT (MOBILE OVERLAY / DESKTOP SIDEBAR) */}
        <div className={`fixed inset-y-0 right-0 w-full md:w-[450px] border-l border-white/40 shadow-2xl transform transition-transform duration-300 z-50 flex flex-col bg-white/80 backdrop-blur-xl ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>

          {/* Chat Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-indigo-100/50 bg-gradient-to-r from-indigo-50/50 to-white/50 shrink-0">
            <div className="flex items-center gap-2 text-indigo-900">
              <div className="p-1.5 bg-indigo-100 rounded-lg"><Bot size={18} /></div>
              <div>
                <span className="font-bold text-sm block leading-none">Βοηθός AI</span>
                <span className="text-[10px] text-indigo-400 font-medium">Powered by Gemini</span>
              </div>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar scroll-smooth relative z-10">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${m.role === 'user'
                  ? 'bg-slate-900 text-white rounded-br-none'
                  : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                  }`}>
                  {m.role === 'ai' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2" {...props} />,
                        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                        strong: ({ node, ...props }) => <span className="font-black text-indigo-900" {...props} />
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
          <div className="p-4 bg-white/50 border-t border-indigo-100/50 shrink-0 pb-safe z-10">
            <form onSubmit={handleSendMessage} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ρώτησε κάτι..."
                className="w-full pl-4 pr-12 py-3 bg-white/80 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none text-sm font-medium transition-all shadow-inner placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!input.trim() || isAiThinking}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-md shadow-indigo-200"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}