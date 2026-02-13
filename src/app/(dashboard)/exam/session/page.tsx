"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation"; 
import { 
  Loader2, Clock, Save, LayoutGrid, BookOpen, Headphones, Mic, CheckCircle2, Bot 
} from "lucide-react";
import { gradeEssay, gradeSpeaking, gradeShortAnswer } from "@/lib/gemini"; 
import { useExamGenerator } from "@/hooks/useExamGenerator";

import ExamTheory from "../components/ExamTheory";
import ExamReading from "../components/ExamReading";
import ExamListening from "../components/ExamListening";
import ExamSpeaking from "../components/ExamSpeaking";

const EXAM_DURATION = 180 * 60; 
const PASS_THRESHOLD_TOTAL = 70; 
const PASS_THRESHOLD_LANG = 40;  
const PASS_THRESHOLD_THEORY = 20; 

type ExamSection = 'theory' | 'reading' | 'listening' | 'speaking';

export interface UserAnswers {
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

export default function ExamSessionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { generateExam, loading: generating, examData } = useExamGenerator();

  const [answers, setAnswers] = useState<UserAnswers>({
    theory: {}, theoryConfirmed: {},
    readingA: {}, readingB: {}, readingConfirmed: false, essay: "",
    listeningA: {}, listeningB: {}, listeningConfirmed: false,
    speakingUrl0: null, speakingUrlRandom: null
  });
  
  const [activeSection, setActiveSection] = useState<ExamSection>('theory');
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    generateExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (examData && timeLeft > 0 && !isSubmitting) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) { finishExam(true); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [examData, isSubmitting]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const finishExam = async (force = false) => {
    if (isSubmitting) return;
    if (!force && !confirm("Είστε σίγουροι ότι θέλετε να ολοκληρώσετε την εξέταση;")) return;
    
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    console.log("🏁 ПОЧАТОК ФІНАЛЬНОГО ПІДРАХУНКУ");

    // 🔥 1. АСИНХРОННА ПЕРЕВІРКА AI ДЛЯ ВІДКРИТИХ ПИТАНЬ ТЕОРІЇ (ПОЛІТИКА/ІСТОРІЯ)
    const theoryAiFeedback: Record<number, any> = {};
    const theoryAiPromises = (examData?.theory || []).map(async (q, idx) => {
        const ans = answers.theory[idx];
        if (!ans || typeof ans !== 'string') return 0;
        
        if (q.type?.includes('OPEN') || q.type?.includes('SHORT')) {
            try {
                // Викликаємо ШІ. Очікуємо 0, 1 або 2 бали.
                const res = await gradeShortAnswer(q.question || "", ans, q.modelAnswer || "");
                theoryAiFeedback[idx] = res;
                return res?.score || 0; 
            } catch(e) {
                console.error("AI Error for Theory Q:", idx, e);
                return 0; 
            }
        }
        return 0;
    });

    // Чекаємо поки ШІ перевірить всі відкриті питання
    const theoryAiScores = await Promise.all(theoryAiPromises);

    // --- 2. ПІДРАХУНОК ТЕОРІЇ (СИНХРОННИЙ) ---
    let theoryScore = 0;
    
    examData?.theory.forEach((q, idx) => {
        const ans = answers.theory[idx];
        
        if (ans === undefined || ans === null || ans === "") return;
        if (Array.isArray(ans) && ans.length === 0) return;

        let questionScore = 0; 

        // 🟠 ВІДКРИТІ ПИТАННЯ (AI)
        if (q.type?.includes('OPEN') || q.type?.includes('SHORT')) {
            questionScore = theoryAiScores[idx]; // Беремо бал від ШІ (0, 1 або 2)
        }
        // 🟢 КАРТА
        else if (q.type?.includes('MAP') && q.points && q.points.length > 0) {
            const userPoints = Array.isArray(ans) ? ans : [];
            let mapHits = 0;
            
            q.points.forEach((targetPt, i) => {
                const userPt = userPoints[i];
                if (userPt) {
                    const dist = Math.sqrt(Math.pow(userPt.lat - targetPt.lat, 2) + Math.pow(userPt.lng - targetPt.lng, 2));
                    const allowedError = Number(q.tolerance) || 30;
                    if (dist <= allowedError) mapHits++;
                }
            });
            const calculatedScore = (mapHits / q.points.length) * 2;
            questionScore = Math.min(calculatedScore, 2);
        }
        // 🔵 MATCHING
        else if ((q.type === 'MATCHING' || q.type?.includes('MATCH')) && q.pairs && q.pairs.length > 0) {
            let hits = 0;
            q.pairs.forEach((p, pIdx) => { if (ans[pIdx] === p.right) hits++; });
            questionScore = (hits / q.pairs.length) * 2;
        }
        // 🟣 MULTI
        else if ((q.type === 'MULTI' || q.type?.includes('MULTI')) && q.correctIndices) {
            const userArr = Array.isArray(ans) ? ans : [];
            const intersection = userArr.filter((x: number) => q.correctIndices!.includes(x)).length;
            questionScore = (intersection / q.correctIndices.length) * 2;
        }
        // 🟡 SINGLE
        else {
            let isCorrect = false;
            if (q.type?.includes('SINGLE') && ans === q.correctAnswerIndex) isCorrect = true;
            else if (q.type?.includes('TRUE') && q.items && ans['0'] === q.items[0].isTrue) isCorrect = true;
            if (isCorrect) questionScore = 2;
        }

        theoryScore += questionScore;
    });

    console.log("🏆 TOTAL THEORY SCORE:", theoryScore);

    // --- 3. МОВА ---
    const gradeSection = async (questions: any[], userAnswers: any, pointsPerQ: number) => {
        const checks = questions.map(async (q, i) => {
            const userAns = userAnswers[i];
            if (userAns === undefined || userAns === null || userAns === "") return 0;

            if (q.type === 'FILL_GAP' || q.type === 'OPEN' || q.type === 'SHORT_ANSWER') {
                const correctText = q.correctAnswers ? (q.correctAnswers['0'] || Object.values(q.correctAnswers)[0]) : q.modelAnswer;
                if (!correctText) return 0;
                
                const aiRes = await gradeShortAnswer(q.question, String(userAns), String(correctText));
                return aiRes.isCorrect ? pointsPerQ : 0;
            }
            
            if (userAns === q.correctAnswerIndex) return pointsPerQ;
            if (q.type?.includes('TRUE') && q.items && userAns?.['0'] === q.items[0].isTrue) return pointsPerQ;
            return 0;
        });
        const results = await Promise.all(checks);
        return results.reduce((a, b) => a + b, 0);
    };

    let readingScore = 0;
    let listeningScore = 0;
    let writingScoreAI = 0;
    let speakingScoreAI = 0;
    let aiFeedback: any = null;

    try {
        const [rScoreA, rScoreB, lScoreA, lScoreB, wRes, sRes] = await Promise.all([
            gradeSection(examData?.reading.partA || [], answers.readingA, 1),
            gradeSection(examData?.reading.partB || [], answers.readingB, 1),
            gradeSection(examData?.listening.partA || [], answers.listeningA, 1.5),
            gradeSection(examData?.listening.partB || [], answers.listeningB, 1.5),
            gradeEssay(examData?.reading.data.parts?.partC?.question || "Essay", answers.essay),
            gradeSpeaking("Speaking", answers.speakingUrlRandom || "No audio")
        ]);

        readingScore = rScoreA + rScoreB;
        listeningScore = lScoreA + lScoreB;
        writingScoreAI = Math.min(wRes?.score || 0, 12);
        speakingScoreAI = Math.min(sRes?.score || 0, 15);
        
        // 🔥 Зберігаємо AI фідбек для ТЕОРІЇ (відкриті питання) разом з іншими
        aiFeedback = { 
            theory: theoryAiFeedback,
            writing: wRes ? JSON.parse(JSON.stringify(wRes)) : null, 
            speaking: sRes ? JSON.parse(JSON.stringify(sRes)) : null 
        };
    } catch (e) { console.error("AI Error", e); }

    const totalLangScore = readingScore + listeningScore + writingScoreAI + speakingScoreAI;
    const grandTotalScore = totalLangScore + theoryScore;

    const isPassed = (grandTotalScore >= PASS_THRESHOLD_TOTAL) && 
                     (totalLangScore >= PASS_THRESHOLD_LANG) && 
                     (theoryScore >= PASS_THRESHOLD_THEORY);

    const finalData = {
        userId: user?.uid || 'anon',
        date: serverTimestamp(),
        scores: {
            theory: Math.round(theoryScore * 10) / 10,
            reading: readingScore,
            writing: writingScoreAI,
            listening: listeningScore,
            speaking: speakingScoreAI,
            totalLang: Math.round(totalLangScore * 10) / 10,
            grandTotal: Math.round(grandTotalScore * 10) / 10
        },
        thresholds: {
            theory: PASS_THRESHOLD_THEORY,
            lang: PASS_THRESHOLD_LANG,
            total: PASS_THRESHOLD_TOTAL
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
        alert("Σφάλμα αποθήκευσης. Ελέγξτε τη σύνδεσή σας.");
        setIsSubmitting(false);
    }
  };

  if (generating || !examData) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
              <Loader2 className="animate-spin text-blue-600 h-12 w-12"/>
              <p className="text-slate-500 font-bold animate-pulse">Δημιουργία εξέτασης...</p>
          </div>
      );
  }

  return (
    <div className="flex flex-col min-h-screen font-sans bg-slate-50">
      <header className="bg-white border-b border-slate-200 h-16 sm:h-20 flex items-center justify-between px-4 sm:px-6 shadow-sm shrink-0 sticky top-0 z-50">
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <div className={`font-mono text-sm sm:text-lg font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl flex items-center gap-2 border ${timeLeft < 600 ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                  <Clock size={16} className="sm:w-5 sm:h-5"/> {formatTime(timeLeft)}
              </div>
          </div>
          <div className="flex-1 mx-2 sm:mx-4 overflow-x-auto no-scrollbar">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 min-w-max">
                  {[
                      {id: 'theory', label: 'Θεωρία', icon: LayoutGrid}, 
                      {id: 'reading', label: 'Ανάγνωση', icon: BookOpen}, 
                      {id: 'listening', label: 'Ακουστική', icon: Headphones}, 
                      {id: 'speaking', label: 'Ομιλία', icon: Mic}
                  ].map(tab => (
                      <button 
                          key={tab.id} 
                          onClick={() => setActiveSection(tab.id as ExamSection)} 
                          className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold flex gap-2 transition-all items-center whitespace-nowrap ${activeSection === tab.id ? 'bg-white shadow-sm text-slate-900 ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                          <tab.icon size={16} className="sm:w-4 sm:h-4"/> <span className="inline">{tab.label}</span>
                      </button>
                  ))}
              </div>
          </div>
          <button 
              onClick={() => finishExam(false)} 
              disabled={isSubmitting}
              className="shrink-0 bg-slate-900 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold text-xs sm:text-sm flex gap-2 shadow-lg hover:bg-slate-800 transition-all items-center disabled:opacity-50"
          >
              {isSubmitting ? <Loader2 className="animate-spin w-4 h-4"/> : <Save size={16} className="sm:w-[18px] sm:h-[18px]"/>} 
              <span className="hidden sm:inline">Ολοκλήρωση</span>
          </button>
      </header>

      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
          {isSubmitting && (
               <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center">
                   <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center border border-slate-100 max-w-sm text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 animate-bounce">
                            <Bot size={32} className="text-blue-600"/>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Αξιολόγηση AI...</h2>
                        <p className="text-slate-500 font-medium">Παρακαλώ περιμένετε, το σύστημα βαθμολογεί την Έκθεση, την Ομιλία και τις ανοιχτές ερωτήσεις.</p>
                   </div>
               </div>
          )}

          {activeSection === 'theory' && <ExamTheory data={examData.theory} answers={answers} setAnswers={setAnswers} />}
          {activeSection === 'reading' && <ExamReading data={examData.reading} answers={answers} setAnswers={setAnswers} />}
          {activeSection === 'listening' && <ExamListening data={examData.listening} answers={answers} setAnswers={setAnswers} />}
          {activeSection === 'speaking' && <ExamSpeaking data={examData.speaking} answers={answers} setAnswers={setAnswers} />}
      </main>
    </div>
  );
}