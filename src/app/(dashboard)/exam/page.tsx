"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, serverTimestamp, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation"; 
import { 
  Loader2, Clock, Save, LayoutGrid, BookOpen, Headphones, Mic, 
  CheckCircle2, ChevronLeft, ChevronRight,
  ShieldCheck, PenTool, Trash2, AlignLeft, ListChecks
} from "lucide-react";
import Quiz, { Question } from "@/components/Quiz";
import AudioRecorder from "@/components/AudioRecorder";
import { gradeEssay, gradeSpeaking } from "@/lib/gemini";
import { USER_ROLES, GUEST_LIMITS } from "@/lib/constants";

// --- CONFIGURATION ---
const EXAM_DURATION = 180 * 60; // 3 hours
const PASS_SCORE_THEORY = 20;   
const PASS_SCORE_LANG = 40;     

type ExamSection = 'theory' | 'reading' | 'listening' | 'speaking';
// Новий тип для мобільних вкладок
type MobileView = 'content' | 'questions';

// --- INTERFACES ---
interface ExamState {
  theory: Question[];
  reading: {
      data: any;
      partA: Question[];
      partB: Question[];
  };
  listening: {
      data: any;
      partA: Question[];
      partB: Question[];
  };
  speaking: { lesson0: any, lessonRandom: any };
}

interface UserAnswers {
  theory: Record<number, any>; 
  theoryConfirmed: Record<number, boolean>;
  
  readingA: Record<number, any>;
  readingB: Record<number, any>;
  readingConfirmed: boolean;
  
  essay: string;
  
  listeningA: Record<number, any>;
  listeningB: Record<number, any>;
  listeningConfirmed: boolean;
  
  speakingUrl0: string | null;
  speakingUrlRandom: string | null;
}

export default function ExamPage() {
  const { user } = useAuth();
  const router = useRouter();

  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [examData, setExamData] = useState<ExamState | null>(null);
  
  const [answers, setAnswers] = useState<UserAnswers>({
    theory: {}, theoryConfirmed: {},
    readingA: {}, readingB: {}, readingConfirmed: false, essay: "",
    listeningA: {}, listeningB: {}, listeningConfirmed: false,
    speakingUrl0: null, speakingUrlRandom: null
  });
  
  const [activeSection, setActiveSection] = useState<ExamSection>('theory');
  const [currentTheoryIndex, setCurrentTheoryIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Mobile View State
  const [mobileView, setMobileView] = useState<MobileView>('content');

  // --- 1. INITIALIZATION ---
  useEffect(() => {
    async function checkEligibility() {
      if (!user) return;
      if ((user as any).role !== USER_ROLES.GUEST) {
        setCheckingAccess(false);
        generateExam();
        return;
      }
      try {
        const q = query(collection(db, "exam_results"), where("userId", "==", user.uid));
        const snap = await getDocs(q);
        if (snap.size >= GUEST_LIMITS.EXAM_ATTEMPTS) setAccessDenied(true);
        else generateExam();
      } catch (error) { console.error(error); } 
      finally { setCheckingAccess(false); }
    }
    checkEligibility();
    return () => stopTimer();
  }, [user]);

  // --- 2. TIMER ---
  useEffect(() => {
    if (examStarted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) { finishExam(true); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else stopTimer();
    return () => stopTimer();
  }, [examStarted]);

  const stopTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };
  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // --- 3. DATA NORMALIZATION (Скорочено, без змін) ---
  const normalizeQuestion = (q: any, categoryContext: string): Question => {
    let type = (q.type || 'SINGLE').toUpperCase();
    if (type.includes('MULTIPLE') || type.includes('CHOICE')) type = 'SINGLE';
    if (q.correctIndices) type = 'MULTI';
    if (type.includes('TRUE')) type = 'TRUE_FALSE';
    if (type.includes('FILL') || type.includes('TEXT')) type = 'FILL_GAP';
    if (type.includes('MATCH')) type = 'MATCHING';
    if (type.includes('MAP')) type = 'MAP';

    let questionText = q.question || q.question_text || q.prompt || "";
    let textParts = q.textParts || (q.sentence ? [q.sentence] : undefined);

    if (categoryContext === 'reading' && type === 'FILL_GAP') {
        const instruction = q.instruction ? q.instruction.trim() : "";
        if (questionText.includes("->")) {
            const parts = questionText.split("->");
            questionText = instruction ? `${instruction}\n\n«${parts[0].trim()}»` : `«${parts[0].trim()}»`;
            textParts = [parts[1].trim()];
        } else {
            if (!textParts && questionText) textParts = [questionText];
            questionText = instruction || "";
        }
    }
    
    if (type === 'TRUE_FALSE' && (!questionText || questionText === "Question Text Missing")) {
        questionText = "Σημειώστε Σωστό ή Λάθος";
    }

    return {
        id: q.id,
        type,
        question: questionText,
        imageUrl: q.imageUrl || q.image,
        options: q.options || (type === 'SINGLE' && q.optionsA ? [q.optionsA, q.optionsB, q.optionsC, q.optionsD] : undefined),
        correctAnswerIndex: q.correctAnswerIndex,
        correctIndices: q.correctIndices,
        pairs: q.pairs,
        items: q.items || (type === 'TRUE_FALSE' && q.statement ? [{text: q.statement, isTrue: q.correctAnswer === 'Σ' || q.isTrue}] : undefined),
        textParts,
        wordBank: q.wordBank,
        inlineChoices: q.inlineChoices,
        correctAnswers: q.correctAnswers,
        points: q.points,
        tolerance: q.tolerance,
    };
  };

  // --- 4. EXAM GENERATION (Скорочено, без змін) ---
  const generateExam = async () => {
    setLoading(true);
    try {
      const fetchCol = async (name: string) => {
        const s = await getDocs(collection(db, name));
        return s.docs.map(d => ({ id: d.id, ...d.data() }));
      };

      const [hist, pol, cult, geo, read, list, speak] = await Promise.all([
        fetchCol("questions_history"),
        fetchCol("questions_politics"),
        fetchCol("questions_culture"),
        fetchCol("questions_geography"),
        fetchCol("lessons_reading"),
        fetchCol("lessons_listening"),
        fetchCol("lessons_speaking")
      ]);

      const selectDiverse = (pool: any[], count: number) => {
        const shuffled = pool.sort(() => 0.5 - Math.random());
        const selected: any[] = [];
        const typeCounts: Record<string, number> = {};
        for (const item of shuffled) {
          if (selected.length >= count) break;
          const type = (item.type || 'SINGLE').toUpperCase();
          if ((typeCounts[type] || 0) < 2) { 
             selected.push(item);
             typeCounts[type] = (typeCounts[type] || 0) + 1;
          }
        }
        if (selected.length < count) {
           const remaining = shuffled.filter(i => !selected.includes(i)).slice(0, count - selected.length);
           selected.push(...remaining);
        }
        return selected;
      };

      const geoLow = geo.filter((q: any) => (q.order || 0) <= 50);
      const geoHigh = geo.filter((q: any) => (q.order || 0) > 50 && (q.order || 0) <= 70);
      
      const theoryQs = [
        ...selectDiverse(hist, 6).map(q => ({...q, _cat: 'Ιστορία'})),
        ...selectDiverse(pol, 6).map(q => ({...q, _cat: 'Πολιτική'})),
        ...selectDiverse(cult, 4).map(q => ({...q, _cat: 'Πολιτισμός'})),
        ...selectDiverse(geoLow, 2).map(q => ({...q, _cat: 'Γεωγραφία'})),
        ...selectDiverse(geoHigh, 2).map(q => ({...q, _cat: 'Γεωγραφία (Χάρτης)'}))
      ];

      const random = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
      
      const rL = random(read);
      const rA = (rL.parts?.partA || []).map((q:any) => normalizeQuestion(q, 'reading'));
      const rB = (rL.parts?.partB || []).map((q:any) => normalizeQuestion(q, 'reading'));

      const lL = random(list);
      const lA = (lL.parts?.partA || []).map((q:any) => normalizeQuestion({...q, type:'SINGLE'}, 'listening'));
      const lB = (lL.parts?.partB || []).map((q:any) => normalizeQuestion({...q, type:'TRUE_FALSE'}, 'listening'));

      const speak0 = speak.find((l: any) => String(l.order) === '0' || l.id === 'lesson_0') || speak[0];
      const speakRandom = random(speak.filter((l: any) => l.id !== speak0?.id));

      setExamData({
        theory: theoryQs.map(q => normalizeQuestion(q, 'theory')),
        reading: { data: rL, partA: rA, partB: rB },
        listening: { data: lL, partA: lA, partB: lB },
        speaking: { lesson0: speak0, lessonRandom: speakRandom }
      });

    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  // --- 5. FINISH & SCORE (Скорочено, без змін) ---
  const finishExam = async (force = false) => {
    if (isSubmitting) return;
    if (!force && !confirm("Είστε σίγουροι ότι θέλετε να ολοκληρώσετε την εξέταση;")) return;
    
    setIsSubmitting(true);
    stopTimer();

    let theoryScore = 0;
    examData?.theory.forEach((q, idx) => {
        const ans = answers.theory[idx];
        if (!ans) return;
        if (q.type === 'SINGLE' && ans === q.correctAnswerIndex) theoryScore += 2;
        else if (q.type === 'TRUE_FALSE' && q.items && ans['0'] === q.items[0].isTrue) theoryScore += 2;
        else if (q.type === 'MATCHING' && q.pairs) {
            let hits = 0;
            q.pairs.forEach((p, pIdx) => { if (ans[pIdx] === p.right) hits++; });
            theoryScore += (hits / q.pairs.length) * 2;
        } else if (q.type === 'MULTI' && q.correctIndices) {
            const userArr = (ans as number[]);
            const intersection = userArr.filter(x => q.correctIndices!.includes(x)).length;
            theoryScore += (intersection / q.correctIndices!.length) * 2; 
        }
    });

    let readingScore = 0;
    examData?.reading.partA.forEach((q, i) => { if (answers.readingA[i] === q.correctAnswerIndex) readingScore += 1; });
    examData?.reading.partB.forEach((q, i) => { if (answers.readingB[i] === q.correctAnswerIndex) readingScore += 1; });

    let listeningScore = 0;
    examData?.listening.partA.forEach((q, i) => { if (answers.listeningA[i] === q.correctAnswerIndex) listeningScore += 1.5; });
    examData?.listening.partB.forEach((q, i) => { if (q.items && answers.listeningB[i]?.['0'] === q.items[0].isTrue) listeningScore += 1.5; });

    let writingScoreAI = 0;
    let speakingScoreAI = 0;
    let aiFeedback: any = null;

    try {
        const [wRes, sRes] = await Promise.all([
            gradeEssay(examData?.reading.data.parts?.partC?.question || "Essay", answers.essay),
            gradeSpeaking("Speaking", answers.speakingUrlRandom || "No audio")
        ]);
        
        writingScoreAI = Math.min(wRes?.score || 0, 12); 
        speakingScoreAI = Math.min(sRes?.score || 0, 15); 
        aiFeedback = { 
            writing: wRes ? JSON.parse(JSON.stringify(wRes)) : null, 
            speaking: sRes ? JSON.parse(JSON.stringify(sRes)) : null 
        };

    } catch (e) { console.error("AI Error", e); }

    const totalLangScore = readingScore + writingScoreAI + listeningScore + speakingScoreAI;
    const isPassed = theoryScore >= PASS_SCORE_THEORY && totalLangScore >= PASS_SCORE_LANG;

    const finalData = {
        userId: user?.uid || 'anon',
        date: serverTimestamp(),
        scores: {
            theory: Math.round(theoryScore * 10) / 10,
            reading: readingScore,
            writing: writingScoreAI,
            listening: listeningScore,
            speaking: speakingScoreAI,
            totalLang: Math.round(totalLangScore * 10) / 10
        },
        isPassed,
        answers: JSON.parse(JSON.stringify(answers)), 
        examSnapshot: JSON.parse(JSON.stringify(examData)), 
        aiFeedback
    };

    try {
        await addDoc(collection(db, "exam_results"), finalData);
        router.push("/dashboard/stats");
    } catch (e) {
        console.error("Firebase Save Error:", e);
        alert("Помилка збереження. Спробуйте ще раз.");
        setIsSubmitting(false);
    }
  };

  if (checkingAccess || loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600 h-10 w-10"/></div>;
  if (accessDenied) return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold bg-slate-50">Limit Reached</div>;

  if (!examStarted) {
      return (
        <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center font-sans">
            <div className="bg-white max-w-2xl w-full p-10 rounded-[2.5rem] shadow-xl text-center border border-slate-100">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8 text-blue-600 shadow-inner"><ShieldCheck size={48}/></div>
                <h1 className="text-3xl font-black text-slate-900 mb-4">Προσομοίωση Εξέτασης</h1>
                <p className="text-slate-500 mb-8 font-medium">Διάρκεια: 3 ώρες • AI Αξιολόγηση</p>
                <button onClick={() => setExamStarted(true)} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-lg">Έναρξη</button>
            </div>
        </div>
      );
  }

  // --- HELPER FOR MOBILE TABS ---
  const MobileTabs = () => (
      <div className="lg:hidden flex border-b border-slate-200 mb-6 bg-white sticky top-20 z-40">
          <button 
             onClick={() => setMobileView('content')}
             className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 ${mobileView === 'content' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}
          >
              <AlignLeft size={16}/> Περιεχόμενο
          </button>
          <button 
             onClick={() => setMobileView('questions')}
             className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 ${mobileView === 'questions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}
          >
              <ListChecks size={16}/> Ερωτήσεις
          </button>
      </div>
  );

  // --- RENDERERS ---

  const renderTheory = () => {
      const q = examData?.theory[currentTheoryIndex];
      if (!q) return null;
      
      const handleConfirm = () => {
          setAnswers(prev => ({...prev, theoryConfirmed: {...prev.theoryConfirmed, [currentTheoryIndex]: true}}));
          if (currentTheoryIndex < (examData?.theory.length || 0) - 1) setCurrentTheoryIndex(p => p + 1);
      };

      return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20 items-start">
              {/* SIDEBAR */}
              <div className="lg:col-span-3 bg-white p-4 sm:p-6 rounded-[2rem] border border-slate-200 shadow-sm lg:sticky lg:top-24 overflow-x-auto lg:overflow-visible no-scrollbar">
                  <h3 className="font-black text-slate-400 mb-4 text-[10px] uppercase tracking-widest hidden lg:block">Πλοήγηση</h3>
                  <div className="flex lg:grid lg:grid-cols-5 gap-2 min-w-max lg:min-w-0">
                      {examData?.theory.map((_, i) => {
                          const isConf = answers.theoryConfirmed[i];
                          const hasAns = answers.theory[i] !== undefined;
                          const s = isConf ? 'bg-emerald-500 border-emerald-500 text-white' : 
                                    hasAns ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-100 text-slate-400';
                          return (
                              <button key={i} onClick={() => setCurrentTheoryIndex(i)} className={`w-10 h-10 lg:w-auto lg:aspect-square rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center shrink-0 ${currentTheoryIndex === i ? 'ring-2 ring-blue-400 ring-offset-2' : ''} ${s}`}>{i + 1}</button>
                          );
                      })}
                  </div>
              </div>

              {/* QUESTION AREA */}
              <div className="lg:col-span-9 bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
                  <div className="flex justify-between items-start mb-6 border-b border-slate-50 pb-4">
                      <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg uppercase tracking-wide">{(q as any)._cat}</span>
                      <span className="text-slate-300 font-mono text-xs">ID: {q.id?.substring(0,6)}</span>
                  </div>
                  
                  <div className="mb-8">
                      <Quiz 
                          questions={[q]} mode="exam" 
                          hideSubmit={true}
                          savedAnswers={{0: answers.theory[currentTheoryIndex]}} 
                          onAnswerUpdate={(ans) => setAnswers(prev => ({...prev, theory: {...prev.theory, [currentTheoryIndex]: ans[0]}}))}
                      />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-slate-100 mt-auto gap-4">
                      <button disabled={currentTheoryIndex === 0} onClick={() => setCurrentTheoryIndex(i => i - 1)} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-800 disabled:opacity-30 transition-colors w-full sm:w-auto justify-center p-3 rounded-xl hover:bg-slate-50"><ChevronLeft/> Προηγούμενο</button>
                      
                      <div className="flex flex-col-reverse sm:flex-row gap-4 w-full sm:w-auto justify-end">
                          <button onClick={handleConfirm} className="bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-md flex items-center justify-center gap-2 w-full sm:w-auto">
                              <CheckCircle2 size={18}/> {answers.theoryConfirmed[currentTheoryIndex] ? 'Ενημέρωση' : 'Επιβεβαίωση'}
                          </button>
                          <button disabled={currentTheoryIndex === (examData?.theory.length || 0) - 1} onClick={() => setCurrentTheoryIndex(i => i + 1)} className="flex items-center justify-center gap-2 text-slate-900 font-bold hover:text-blue-600 disabled:opacity-30 transition-colors w-full sm:w-auto p-3 rounded-xl hover:bg-slate-50">Επόμενο <ChevronRight/></button>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  const renderReading = () => {
      const lesson = examData?.reading;
      if (!lesson) return null;
      
      const ContentPanel = () => (
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-200 h-fit lg:max-h-[80vh] lg:overflow-y-auto custom-scrollbar lg:sticky lg:top-24">
              <div className="flex items-center gap-3 mb-6 text-blue-600 border-b border-blue-50 pb-4"><BookOpen size={24}/><h2 className="font-black uppercase tracking-widest text-sm">Κείμενο</h2></div>
              {lesson.data.imageUrls?.[0] && <img src={lesson.data.imageUrls[0]} className="w-full rounded-2xl mb-6 object-cover h-48"/>}
              <div className="prose prose-lg prose-slate max-w-none font-serif leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{__html: lesson.data.textContent}} />
          </div>
      );

      const QuestionPanel = () => (
          <div className="space-y-8">
              <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                  <h3 className="font-black text-slate-800 mb-6 text-lg bg-blue-50 p-4 rounded-2xl">Μέρος Α: Κατανόηση</h3>
                  <Quiz questions={lesson.partA} layout="list" mode="exam" hideSubmit={true} savedAnswers={answers.readingA} onAnswerUpdate={(ans) => setAnswers(prev => ({...prev, readingA: ans, readingConfirmed: false}))} />
              </div>
              <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                  <h3 className="font-black text-slate-800 mb-6 text-lg bg-purple-50 p-4 rounded-2xl">Μέρος Β: Γλώσσα</h3>
                  <Quiz questions={lesson.partB} layout="list" mode="exam" hideSubmit={true} savedAnswers={answers.readingB} onAnswerUpdate={(ans) => setAnswers(prev => ({...prev, readingB: ans, readingConfirmed: false}))} />
              </div>
              <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-orange-100 shadow-sm">
                  <h3 className="font-black text-orange-900 mb-4 flex gap-2 items-center text-lg"><PenTool className="text-orange-600"/> Μέρος Γ (Έκθεση)</h3>
                  <div className="mb-4 text-slate-700 font-medium p-4 bg-orange-50 rounded-xl whitespace-pre-wrap text-sm leading-relaxed border border-orange-100">{lesson.data.parts?.partC?.question || "Θέμα Έκθεσης..."}</div>
                  <textarea className="w-full h-64 p-4 border-2 border-orange-100 rounded-xl focus:border-orange-300 outline-none resize-none font-medium text-slate-700" placeholder="Γράψτε εδώ..." value={answers.essay} onChange={e => setAnswers(prev => ({...prev, essay: e.target.value, readingConfirmed: false}))}/>
              </div>
              
              <div className="sticky bottom-4 z-10 pb-4 sm:pb-0">
                  <button 
                      onClick={() => setAnswers(prev => ({...prev, readingConfirmed: true}))} 
                      className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-2 ${answers.readingConfirmed ? 'bg-emerald-500 text-white cursor-default' : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.01]'}`}
                  >
                      {answers.readingConfirmed ? <><CheckCircle2/> Αποθηκεύτηκε</> : <><Save/> Αποθήκευση Ενότητας</>}
                  </button>
              </div>
          </div>
      );

      return (
          <>
            <MobileTabs />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20 items-start">
                <div className={`${mobileView === 'content' ? 'block' : 'hidden'} lg:block`}>
                   <ContentPanel />
                </div>
                <div className={`${mobileView === 'questions' ? 'block' : 'hidden'} lg:block`}>
                   <QuestionPanel />
                </div>
            </div>
          </>
      );
  };

  const renderListening = () => {
      const lesson = examData?.listening;
      if (!lesson) return null;
      
      const ContentPanel = () => (
          <div className="bg-purple-50 p-6 rounded-[2.5rem] border border-purple-100 text-center lg:sticky lg:top-24">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-purple-600"><Headphones size={32}/></div>
              <h3 className="text-lg font-black text-purple-900 mb-6">{lesson.data.title}</h3>
              {lesson.data.audioUrl && <audio controls src={lesson.data.audioUrl} className="w-full mb-6 accent-purple-600"/>}
          </div>
      );

      const QuestionPanel = () => (
          <div className="space-y-8">
              <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <h3 className="font-black text-slate-800 mb-6">Μέρος Α</h3>
                  <Quiz questions={lesson.partA} layout="list" mode="exam" hideSubmit={true} savedAnswers={answers.listeningA} onAnswerUpdate={(ans) => setAnswers(prev => ({...prev, listeningA: ans, listeningConfirmed: false}))} />
              </div>
              <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <h3 className="font-black text-slate-800 mb-6">Μέρος Β</h3>
                  <Quiz questions={lesson.partB} layout="list" mode="exam" hideSubmit={true} savedAnswers={answers.listeningB} onAnswerUpdate={(ans) => setAnswers(prev => ({...prev, listeningB: ans, listeningConfirmed: false}))} />
              </div>
              
              <div className="sticky bottom-4 z-10 pb-4 sm:pb-0">
                  <button 
                      onClick={() => setAnswers(prev => ({...prev, listeningConfirmed: true}))} 
                      className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-2 ${answers.listeningConfirmed ? 'bg-emerald-500 text-white cursor-default' : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.01]'}`}
                  >
                      {answers.listeningConfirmed ? <><CheckCircle2/> Αποθηκεύτηκε</> : <><Save/> Αποθήκευση Ενότητας</>}
                  </button>
              </div>
          </div>
      );

      return (
          <>
             <MobileTabs />
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20 items-start">
                  <div className={`lg:col-span-1 ${mobileView === 'content' ? 'block' : 'hidden'} lg:block`}>
                      <ContentPanel />
                  </div>
                  <div className={`lg:col-span-2 ${mobileView === 'questions' ? 'block' : 'hidden'} lg:block`}>
                      <QuestionPanel />
                  </div>
             </div>
          </>
      );
  };

  const renderSpeaking = () => {
      const { lesson0, lessonRandom } = examData?.speaking || {};
      if (!lesson0) return null;
      
      const speakingTasks = [
          { l: lesson0, k: 'speakingUrl0' as keyof UserAnswers, t: 'Task 1: General' },
          { l: lessonRandom, k: 'speakingUrlRandom' as keyof UserAnswers, t: 'Task 2: Topic' }
      ];

      return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
              {speakingTasks.map((item, idx) => (
                  <div key={idx} className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
                      <div className="flex items-center gap-2 mb-6 text-emerald-600"><Mic size={24}/><h2 className="font-black uppercase text-sm">{item.t}</h2></div>
                      <h3 className="text-xl font-black text-slate-900 mb-4">{item.l?.title}</h3>
                      <div className="prose text-slate-600 mb-8 whitespace-pre-wrap flex-1">{item.l?.prompt}</div>
                      {item.l?.imageUrls?.[0] && <img src={item.l.imageUrls[0]} className="w-full h-48 object-cover rounded-xl mb-6 border"/>}
                      
                      <div className="bg-emerald-50 p-6 rounded-[2rem] text-center mt-auto relative">
                          {answers[item.k] ? (
                              <div className="flex flex-col items-center gap-4">
                                  <div className="text-emerald-600 font-bold flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm"><CheckCircle2/> Αποθηκεύτηκε</div>
                                  <audio controls src={answers[item.k] as string} className="w-full h-10"/>
                                  <button onClick={() => setAnswers(prev => ({...prev, [item.k]: null}))} className="text-red-500 text-xs font-bold flex items-center gap-2 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors"><Trash2 size={14}/> Διαγραφή & Επανάληψη</button>
                              </div>
                          ) : (
                              <AudioRecorder onUploadComplete={(url) => setAnswers(prev => ({...prev, [item.k]: url}))} />
                          )}
                      </div>
                  </div>
              ))}
          </div>
      );
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-slate-50">
      {/* HEADER (Sticky, responsive) */}
      <header className="bg-white border-b border-slate-200 h-16 sm:h-20 flex items-center justify-between px-4 sm:px-6 shadow-sm shrink-0 sticky top-0 z-50">
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <div className={`font-mono text-sm sm:text-lg font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl flex items-center gap-2 border ${timeLeft < 600 ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                  <Clock size={16} className="sm:w-5 sm:h-5"/> {formatTime(timeLeft)}
              </div>
          </div>
          
          {/* TABS - Optimized for mobile touch */}
          <div className="flex-1 mx-2 sm:mx-4 overflow-x-auto no-scrollbar">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 min-w-max">
                  {[{id: 'theory', label: 'Θεωρία', icon: LayoutGrid}, {id: 'reading', label: 'Ανάγνωση', icon: BookOpen}, {id: 'listening', label: 'Ακουστική', icon: Headphones}, {id: 'speaking', label: 'Ομιλία', icon: Mic}].map(tab => (
                      <button key={tab.id} onClick={() => { setActiveSection(tab.id as any); setMobileView('content'); }} className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold flex gap-2 transition-all items-center whitespace-nowrap ${activeSection === tab.id ? 'bg-white shadow-sm text-slate-900 ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}>
                          <tab.icon size={16} className="sm:w-4 sm:h-4"/> <span className="inline">{tab.label}</span>
                      </button>
                  ))}
              </div>
          </div>

          <button onClick={() => finishExam(false)} className="shrink-0 bg-slate-900 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold text-xs sm:text-sm flex gap-2 shadow-lg hover:bg-slate-800 transition-all items-center">
              {isSubmitting ? <Loader2 className="animate-spin w-4 h-4"/> : <Save size={16} className="sm:w-[18px] sm:h-[18px]"/>} <span className="hidden sm:inline">Ολοκλήρωση</span>
          </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
          {activeSection === 'theory' && renderTheory()}
          {activeSection === 'reading' && renderReading()}
          {activeSection === 'listening' && renderListening()}
          {activeSection === 'speaking' && renderSpeaking()}
      </main>
    </div>
  );
}