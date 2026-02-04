"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { 
  ArrowLeft, Loader2, BookOpen, 
  PlayCircle, HelpCircle,
  ChevronLeft, ChevronRight, GraduationCap,
  Mic, Lock, MapPin, AlignLeft, Bot, Sparkles, PenTool, Headphones, Eye, EyeOff,
  ListChecks // Додано іконку для вкладок
} from "lucide-react";
import Quiz, { Question } from "@/components/Quiz"; 
import { useAuth } from "@/lib/auth-context";
import { GUEST_LIMITS } from "@/lib/constants";
import AudioRecorder from "@/components/AudioRecorder";
import { gradeSpeaking, gradeEssay } from "@/lib/gemini";

const COLLECTION_MAP: Record<string, string> = {
  'history': 'questions_history',
  'politics': 'questions_politics',
  'culture': 'questions_culture',
  'geography': 'questions_geography',
  'reading': 'lessons_reading',
  'listening': 'lessons_listening',
  'speaking': 'lessons_speaking'
};

// Тип для мобільних вкладок
type MobileView = 'content' | 'questions';

export default function StudyLessonPage({ params }: { params: Promise<{ category: string, id: string }> }) {
  const { category, id } = use(params);
  const { loading: authLoading, isPremium } = useAuth();
  
  const isRestricted = !isPremium;
  const LIMIT = GUEST_LIMITS.CONTENT_ITEMS || 5;
  
  const [lesson, setLesson] = useState<any>(null);
  const [allLessons, setAllLessons] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // UI States
  const [showTranscript, setShowTranscript] = useState(false);
  // Mobile View State (New)
  const [mobileView, setMobileView] = useState<MobileView>('content');
  
  // AI States
  const [speakingUrl, setSpeakingUrl] = useState<string | null>(null);
  const [isGradingSpeaking, setIsGradingSpeaking] = useState(false);
  const [speakingFeedback, setSpeakingFeedback] = useState<any>(null);

  const [essay, setEssay] = useState("");
  const [isGradingEssay, setIsGradingEssay] = useState(false);
  const [essayFeedback, setEssayFeedback] = useState<any>(null);

  // LOAD DATA
  useEffect(() => {
    async function fetchData() {
      if (authLoading) return;
      const collectionName = COLLECTION_MAP[category];
      if (!collectionName) return;

      try {
        const colRef = collection(db, collectionName);
        const q = query(colRef, orderBy("order", "asc"));
        const snapshot = await getDocs(q);
        
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        setAllLessons(docs);

        let targetIndex = docs.findIndex((d: any) => d.id === id);
        if (targetIndex === -1) targetIndex = docs.findIndex((d: any) => String(d.order) === String(id));
        
        if (isRestricted && targetIndex >= LIMIT) targetIndex = LIMIT - 1; 

        if (targetIndex !== -1) {
            setCurrentIndex(targetIndex);
            setLesson(docs[targetIndex]);
        } else if (docs.length > 0) {
            setCurrentIndex(0);
            setLesson(docs[0]);
        }
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    }
    fetchData();
  }, [category, id, authLoading, isRestricted, LIMIT]);

  // NAVIGATION
  const goToLesson = (index: number) => {
    if (index < 0 || index >= allLessons.length) return;
    if (isRestricted && index >= LIMIT) return alert("Διαθέσιμο μόνο για Premium χρήστες"); 
    
    const nextLesson = allLessons[index];
    window.history.pushState(null, '', `/study/${category}/${nextLesson.id}`);
    setCurrentIndex(index);
    setLesson(nextLesson);
    
    // Reset States
    setSpeakingUrl(null); 
    setSpeakingFeedback(null); 
    setEssay(""); 
    setEssayFeedback(null);
    setShowTranscript(false);
    setMobileView('content'); // Reset mobile view to content
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSpeakingCheck = async () => {
      if (!speakingUrl) return;
      setIsGradingSpeaking(true);
      try {
          const prompt = lesson.prompt || lesson.title || "Speaking Task";
          const res = await gradeSpeaking(prompt, speakingUrl);
          setSpeakingFeedback(res);
      } catch (e) { alert("AI Error"); }
      finally { setIsGradingSpeaking(false); }
  };

  const handleEssayCheck = async () => {
      if (essay.length < 10) return alert("Too short");
      setIsGradingEssay(true);
      try {
          const pC = lesson.parts?.partC || (Array.isArray(lesson.parts) ? lesson.parts.find((p:any)=>p.id==='C') : null);
          const prompt = pC?.question || pC?.prompt || lesson.writing_prompt || "Essay";
          const res = await gradeEssay(prompt, essay);
          setEssayFeedback(res);
      } catch (e) { alert("AI Error"); }
      finally { setIsGradingEssay(false); }
  };

  // --- NORMALIZER ---
  const normalizeQuestion = (q: any): Question => {
      let type = (q.type || 'SINGLE').toUpperCase();
      
      if (type.includes('MULTIPLE') || type.includes('CHOICE')) type = 'SINGLE';
      if (q.correctIndices && Array.isArray(q.correctIndices)) type = 'MULTI';

      if (type.includes('TRUE')) type = 'TRUE_FALSE';
      if (type.includes('FILL') || type.includes('TEXT')) type = 'FILL_GAP';
      if (type.includes('MATCH')) type = 'MATCHING';
      if (type.includes('MAP')) type = 'MAP';

      let questionText = q.question || q.question_text || q.prompt || "";
      let textParts = q.textParts || (q.sentence ? [q.sentence] : undefined);

      if (type === 'TRUE_FALSE' && (!questionText || questionText === "Question Text Missing")) {
          questionText = "Σημειώστε Σωστό ή Λάθος"; 
      }

      if (category === 'reading' && type === 'FILL_GAP') {
          const instruction = q.instruction ? q.instruction.trim() : ""; 
          
          if (questionText.includes("->")) {
              const parts = questionText.split("->");
              const sourceSentence = parts[0].trim(); 
              const targetSentence = parts[1].trim(); 

              if (instruction) {
                  questionText = `${instruction}\n\n«${sourceSentence}»`;
              } else {
                  questionText = `«${sourceSentence}»`; 
              }
              
              textParts = [targetSentence];
          } else {
              if (!textParts && questionText) textParts = [questionText];
              questionText = instruction || ""; 
          }
      }

      const norm: Question = {
          id: q.id || Math.random().toString(),
          type: type,
          question: questionText,
          imageUrl: q.imageUrl || q.image,
          options: q.options,
          correctAnswerIndex: q.correctAnswerIndex, 
          correctIndices: q.correctIndices,
          pairs: q.pairs,
          items: q.items,
          textParts: textParts,
          wordBank: q.wordBank,
          inlineChoices: q.inlineChoices || q.choices,
          correctAnswers: q.correctAnswers,
          points: q.points,
          tolerance: q.tolerance
      };

      if (type === 'TRUE_FALSE' && !norm.items) {
          if (q.statement) {
              norm.items = [{
                  text: q.statement,
                  isTrue: q.correctAnswer === 'Σ' || q.correctAnswer === true || q.isTrue
              }];
          }
      }

      if (type === 'SINGLE' && !norm.options && q.optionsA) { 
          norm.options = [q.optionA, q.optionB, q.optionC, q.optionD];
      }

      return norm;
  };

  if (loading || authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 h-10 w-10"/></div>;
  if (!lesson) return <div className="p-10 text-center">Δεν βρέθηκε μάθημα</div>;

  const isNextLocked = isRestricted && (currentIndex + 1) >= LIMIT;

  // --- HELPER COMPONENT: MOBILE TABS ---
  const MobileTabs = () => (
      <div className="lg:hidden flex border-b border-slate-200 mb-6 bg-white sticky top-[73px] z-30 shadow-sm">
          <button 
             onClick={() => setMobileView('content')}
             className={`flex-1 py-4 text-sm font-black uppercase tracking-wide flex items-center justify-center gap-2 border-b-2 transition-colors ${mobileView === 'content' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
              <AlignLeft size={18}/> Περιεχόμενο
          </button>
          <button 
             onClick={() => setMobileView('questions')}
             className={`flex-1 py-4 text-sm font-black uppercase tracking-wide flex items-center justify-center gap-2 border-b-2 transition-colors ${mobileView === 'questions' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
              <ListChecks size={18}/> Ερωτήσεις
          </button>
      </div>
  );

  // --- RENDERERS ---

  // 1. LISTENING
  const renderListening = () => {
      let questionsA: Question[] = [];
      let questionsB: Question[] = [];
      
      const pA = lesson.parts?.partA || lesson.partA || (Array.isArray(lesson.parts) ? lesson.parts.find((p:any)=>p.id==='A')?.questions : []);
      if (pA) questionsA = pA.map((q:any) => normalizeQuestion({...q, type: 'SINGLE'}));

      const pB = lesson.parts?.partB || lesson.partB || (Array.isArray(lesson.parts) ? lesson.parts.find((p:any)=>p.id==='B')?.questions : []);
      if (pB) questionsB = pB.map((q:any) => normalizeQuestion({...q, type: 'TRUE_FALSE'}));

      return (
          <>
          <MobileTabs />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-auto lg:h-[calc(100vh-100px)]">
              {/* LEFT SIDE: Minimal Player & Transcript Card */}
              <div className={`h-full flex flex-col lg:sticky lg:top-24 gap-4 ${mobileView === 'content' ? 'block' : 'hidden'} lg:flex`}>
                  
                  {/* 1. Compact Player Card */}
                  <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm shrink-0">
                      <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 shrink-0 shadow-inner">
                              <Headphones size={24}/>
                          </div>
                          <div>
                              <h1 className="text-lg font-black text-slate-800 leading-tight">{lesson.title}</h1>
                              <p className="text-xs text-purple-600 font-bold uppercase tracking-wider">Listening Exercise</p>
                          </div>
                      </div>
                      
                      {lesson.audioUrl && (
                          <audio 
                              controls 
                              src={lesson.audioUrl} 
                              className="w-full h-10 accent-purple-600" 
                          />
                      )}
                  </div>

                  {/* 2. Transcript Card with Toggle */}
                  {lesson.transcript && (
                      <div className={`bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col relative transition-all duration-300 ease-in-out ${showTranscript ? 'flex-1 overflow-hidden min-h-0' : 'flex-none'}`}>
                          
                          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                              <span className="font-black text-slate-400 uppercase tracking-widest text-xs flex items-center gap-2">
                                  <AlignLeft size={16}/> Κείμενο (Transcript)
                              </span>
                              <button 
                                  onClick={() => setShowTranscript(!showTranscript)}
                                  className="text-xs font-bold text-purple-600 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
                              >
                                  {showTranscript ? <EyeOff size={14}/> : <Eye size={14}/>}
                                  {showTranscript ? "Απόκρυψη" : "Εμφάνιση"}
                              </button>
                          </div>

                          {showTranscript && (
                              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                                  <div className="prose prose-slate prose-lg max-w-none font-medium text-slate-600 leading-loose whitespace-pre-wrap">
                                      {lesson.transcript}
                                  </div>
                              </div>
                          )}
                      </div>
                  )}
              </div>

              {/* RIGHT SIDE: Questions */}
              <div className={`overflow-y-auto custom-scrollbar pr-2 pb-20 space-y-12 ${mobileView === 'questions' ? 'block' : 'hidden'} lg:block`}>
                  
                  {questionsA.length > 0 && (
                      <div className="space-y-4">
                          <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded-xl font-black uppercase tracking-widest text-sm inline-block shadow-sm">
                              Μέρος Α
                          </div>
                          <Quiz questions={questionsA} mode="practice" layout="list" />
                      </div>
                  )}

                  {questionsB.length > 0 && (
                      <div className="space-y-4 border-t-2 border-slate-100 pt-8">
                          <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded-xl font-black uppercase tracking-widest text-sm inline-block shadow-sm">
                              Μέρος Β
                          </div>
                          <Quiz questions={questionsB} mode="practice" layout="list" />
                      </div>
                  )}
              </div>
          </div>
          </>
      );
  };

  // 2. READING
  const renderReading = () => {
      const pA_Text = lesson.parts?.partA?.[0]?.text_content 
                   || lesson.textContent 
                   || (Array.isArray(lesson.parts) ? lesson.parts.find((p:any)=>p.id==='A')?.text_content : "")
                   || lesson.content;

      let questionsA: Question[] = [];
      let questionsB: Question[] = [];

      const pA = lesson.parts?.partA || (Array.isArray(lesson.parts) ? lesson.parts.find((p:any)=>p.id==='A')?.questions : []);
      if (pA) questionsA = pA.map(normalizeQuestion);

      const pB = lesson.parts?.partB || (Array.isArray(lesson.parts) ? lesson.parts.find((p:any)=>p.id==='B')?.questions : []);
      if (pB) questionsB = pB.map(normalizeQuestion);

      const pC = lesson.parts?.partC || (Array.isArray(lesson.parts) ? lesson.parts.find((p:any)=>p.id==='C') : null);
      const writingPrompt = pC?.question || pC?.prompt || lesson.writing_prompt;

      return (
          <>
          <MobileTabs />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-auto lg:h-[calc(100vh-100px)]">
              {/* Text Side */}
              <div className={`bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm lg:overflow-y-auto custom-scrollbar ${mobileView === 'content' ? 'block' : 'hidden'} lg:block`}>
                  <div className="flex items-center gap-3 mb-6 text-blue-600 border-b border-blue-50 pb-4">
                      <BookOpen size={24}/><h2 className="font-black uppercase tracking-widest text-sm">Κείμενο</h2>
                  </div>
                  {lesson.imageUrls?.[0] && <img src={lesson.imageUrls[0]} className="w-full rounded-2xl mb-6 object-cover"/>}
                  <div className="prose prose-lg prose-slate max-w-none font-serif leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{__html: pA_Text || ""}} />
              </div>

              {/* Questions Side */}
              <div className={`lg:overflow-y-auto custom-scrollbar pr-2 space-y-12 pb-20 ${mobileView === 'questions' ? 'block' : 'hidden'} lg:block`}>
                  
                  {questionsA.length > 0 && (
                      <div className="space-y-4">
                          <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-xl font-black uppercase tracking-widest text-sm inline-block shadow-sm">
                              Μέρος Α (Κατανόηση Κειμένου)
                          </div>
                          <Quiz questions={questionsA} mode="practice" layout="list" />
                      </div>
                  )}

                  {questionsB.length > 0 && (
                      <div className="space-y-4 border-t-2 border-slate-100 pt-8">
                          <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-xl font-black uppercase tracking-widest text-sm inline-block shadow-sm">
                              Μέρος Β (Χρήση Γλώσσας)
                          </div>
                          <Quiz questions={questionsB} mode="practice" layout="list" />
                      </div>
                  )}

                  {writingPrompt && (
                      <div className="space-y-4 border-t-2 border-slate-100 pt-8">
                          <div className="px-4 py-2 bg-orange-100 text-orange-800 rounded-xl font-black uppercase tracking-widest text-sm inline-block shadow-sm">
                              Μέρος Γ (Παραγωγή Λόγου)
                          </div>
                          <div className="bg-white p-6 rounded-[2.5rem] border border-orange-100 shadow-sm">
                              <h3 className="font-black text-orange-900 mb-4 flex gap-2 items-center"><PenTool className="text-orange-600"/> Writing Task</h3>
                              <div className="mb-4 text-slate-800 font-medium p-4 bg-orange-50 rounded-xl whitespace-pre-wrap">{writingPrompt}</div>
                              <textarea className="w-full h-48 p-4 border-2 rounded-xl focus:border-orange-300 outline-none" placeholder="Γράψτε εδώ..." value={essay} onChange={e => setEssay(e.target.value)}/>
                              
                              <div className="mt-4 flex justify-between items-center">
                                  <span className="text-xs font-bold text-slate-400">Λέξεις: {essay.trim().split(/\s+/).filter(w=>w).length}</span>
                                  <button onClick={handleEssayCheck} disabled={isGradingEssay || essay.length < 10} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 disabled:opacity-50">
                                      {isGradingEssay ? <Loader2 className="animate-spin h-4 w-4"/> : <Sparkles size={16}/>} Έλεγχος AI
                                  </button>
                              </div>

                              {essayFeedback && (
                                  <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-100 text-sm">
                                      <div className="flex justify-between font-bold text-orange-800 mb-2">
                                          <span>AI Feedback</span>
                                          <span>{essayFeedback.score}/12</span>
                                      </div>
                                      <p className="text-slate-700 italic">{essayFeedback.feedback}</p>
                                  </div>
                              )}
                          </div>
                      </div>
                  )}
              </div>
          </div>
          </>
      );
  };

  // 3. SPEAKING
  const renderSpeaking = () => {
      const prompt = lesson.prompt || lesson.content;
      const images = lesson.imageUrls || lesson.images || [];

      return (
          <div className="max-w-4xl mx-auto p-4 md:p-8">
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                  <div className="p-10 text-center border-b border-slate-100 bg-gradient-to-b from-orange-50/30 to-white">
                      <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner text-orange-600"><Mic size={40}/></div>
                      <h1 className="text-3xl font-black text-slate-900 mb-2">{lesson.title}</h1>
                  </div>
                  
                  <div className="p-8 md:p-10">
                      {images.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                              {images.map((url: string, i: number) => (
                                  <img key={i} src={url} className="w-full h-64 object-cover rounded-2xl border-4 border-slate-50 shadow-sm"/>
                              ))}
                          </div>
                      )}
                      
                      <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 mb-10 text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">
                          {prompt}
                      </div>

                      <div className="text-center bg-orange-50/30 p-8 rounded-[2.5rem] border border-orange-100">
                          <div className="flex justify-center mb-6 scale-110">
                              <AudioRecorder onUploadComplete={setSpeakingUrl}/>
                          </div>
                          
                          {speakingUrl && !speakingFeedback && (
                              <button onClick={handleSpeakingCheck} disabled={isGradingSpeaking} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 mx-auto disabled:opacity-50">
                                  {isGradingSpeaking ? <Loader2 className="animate-spin h-5 w-5"/> : <Bot size={20}/>} Έλεγχος AI
                              </button>
                          )}

                          {speakingFeedback && (
                              <div className="mt-8 text-left bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
                                  <div className="flex justify-between font-bold text-emerald-900 mb-2">
                                      <span>AI Feedback</span>
                                      <span className="bg-emerald-100 px-3 py-1 rounded-lg">{speakingFeedback.score}/15</span>
                                  </div>
                                  <p className="text-slate-700 italic">"{speakingFeedback.feedback}"</p>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  let content = null;
  if (category === 'reading') content = renderReading();
  else if (category === 'listening') content = renderListening();
  else if (category === 'speaking') content = renderSpeaking();
  else {
      // THEORY (History, Geo, etc.) - Stepper Mode
      const q = normalizeQuestion(lesson);
      
      const handleQuizComplete = () => {
          if (!isNextLocked && currentIndex < allLessons.length - 1) {
              goToLesson(currentIndex + 1);
          } else if (currentIndex === allLessons.length - 1) {
              // Finish
          }
      };

      content = (
        <main className={`flex-1 mx-auto w-full p-4 md:p-10 ${q.type === 'MAP' ? "max-w-6xl" : "max-w-4xl"}`}>
           <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="p-8 md:p-12">
                 <Quiz 
                    key={lesson.id} 
                    questions={[q]} 
                    mode="practice" 
                    showResultCard={false} 
                    onComplete={handleQuizComplete} 
                 />
              </div>
              
              {isNextLocked && (
                 <div className="bg-slate-50 border-t p-6 flex justify-center">
                     <Link href="/profile" className="px-10 py-4 rounded-2xl font-black transition-all shadow-lg flex items-center gap-2 bg-amber-500 text-white hover:bg-amber-600 animate-pulse">
                        <Lock size={18}/> Ξεκλείδωμα Premium
                     </Link>
                 </div>
              )}
           </div>
        </main>
      );
  }

  return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <div className="bg-white border-b px-6 py-4 sticky top-0 z-40 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <Link href={`/study/${category}`} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ArrowLeft className="h-5 w-5 text-slate-600"/></Link>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                {lesson?.type?.includes('map') ? <MapPin className="h-4 w-4 text-blue-500"/> : <GraduationCap className="h-4 w-4"/>} 
                {category}
              </h1>
              <div className="text-xs font-bold text-blue-600">Μάθημα {currentIndex + 1} / {allLessons.length}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
             <button disabled={currentIndex === 0} onClick={() => goToLesson(currentIndex - 1)} className="p-2 hover:bg-white rounded-lg disabled:opacity-30 transition-all shadow-sm"><ChevronLeft className="h-5 w-5"/></button>
             <div className="px-3 font-mono font-bold text-sm">{currentIndex + 1}</div>
             <button disabled={currentIndex === allLessons.length - 1 || isNextLocked} onClick={() => goToLesson(currentIndex + 1)} className={`p-2 rounded-lg transition-all shadow-sm ${isNextLocked ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'hover:bg-white disabled:opacity-30'}`}>{isNextLocked ? <Lock className="h-4 w-4"/> : <ChevronRight className="h-5 w-5"/>}</button>
          </div>
        </div>

        {content}
      </div>
  );
}