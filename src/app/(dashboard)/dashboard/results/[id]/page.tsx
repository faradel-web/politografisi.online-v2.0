"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { 
  Loader2, ArrowLeft, BookOpen, PlayCircle, 
  Mic, PenTool, Sparkles, CheckCircle, XCircle,
  AlignLeft, ListChecks // Додані іконки для мобільних вкладок
} from "lucide-react";
import GreeceMap from "@/components/GreeceMap";

// --- ТИПІЗАЦІЯ ---
type ResultData = {
  id: string;
  date: any;
  score: number;
  isPassed: boolean;
  answers: {
      theory: Record<string, any>;
      readingA: Record<string, any>;
      readingB: Record<string, any>;
      listeningA: Record<string, any>;
      listeningB: Record<string, any>;
      essay?: string;
      speakingUrl0?: string;
      speakingUrlRandom?: string;
  }; 
  examSnapshot: any; 
  aiFeedback?: {
    writing?: { score: number; feedback: string; };
    speaking?: { score: number; feedback: string; };
  };
};

type MobileView = 'content' | 'questions';

export default function ExamResultDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Tabs State
  const [activeTab, setActiveTab] = useState<'theory' | 'reading' | 'listening' | 'speaking'>('theory');
  // Mobile View State
  const [mobileView, setMobileView] = useState<MobileView>('content');

  useEffect(() => {
    async function fetchData() {
      try {
        if (!id) return;
        const docRef = doc(db, "exam_results", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          
          let finalScore = data.score;
          if (typeof finalScore !== 'number' || isNaN(finalScore)) {
              if (data.scores) {
                  finalScore = (data.scores.theory || 0) + (data.scores.totalLang || 0);
              } else {
                  finalScore = 0;
              }
          }

          const resultData: ResultData = {
              id: docSnap.id,
              date: data.date,
              score: Math.round(finalScore),
              isPassed: data.isPassed,
              answers: data.answers || data.userAnswers || {}, 
              examSnapshot: data.examSnapshot || {},
              aiFeedback: data.aiFeedback
          };
          setResult(resultData);
        }
      } catch (error) { console.error("Error loading result:", error); } 
      finally { setLoading(false); }
    }
    fetchData();
  }, [id]);

  // --- HELPER: CHECK CORRECTNESS ---
  const checkCorrectness = (q: any, ans: any) => {
      if (ans === undefined || ans === null) return false;
      const type = (q.type || 'SINGLE').toUpperCase();
      
      if (type === 'SINGLE') return q.correctAnswerIndex === ans;
      if (type === 'TRUE_FALSE') {
          if (!q.items) return false;
          return q.items.every((item:any, i:number) => ans[i] === item.isTrue);
      }
      if (type === 'MATCHING') {
          if (!q.pairs) return false;
          return q.pairs.every((p:any, i:number) => ans[i] === p.right);
      }
      if (type === 'FILL_GAP') {
          if (!q.textParts) return false;
          return q.textParts.every((_:any, i:number) => {
             const correct = q.correctAnswers?.[String(i)] || q.correctAnswers?.[i];
             return String(ans[i] || "").trim().toLowerCase() === String(correct || "").trim().toLowerCase();
          });
      }
      return false; 
  };

  // --- COMPONENT: MOBILE TABS ---
  const MobileTabs = () => (
      <div className="lg:hidden flex border-b border-slate-200 mb-6 bg-white sticky top-[73px] z-10 shadow-sm">
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

  // --- RENDERER ---
  const renderQuestionResult = (q: any, userAnswer: any, idx: number) => {
      const type = (q.type || 'SINGLE').toUpperCase();
      const isCorrect = checkCorrectness(q, userAnswer);
      
      return (
          <div key={idx} className={`p-4 sm:p-6 rounded-[1.5rem] border-2 mb-6 ${isCorrect ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
              <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                          {idx + 1}
                      </span>
                      <h4 className="font-bold text-slate-800 text-base sm:text-lg leading-snug">{q.question}</h4>
                  </div>
                  {isCorrect 
                    ? <div className="text-green-600 flex items-center gap-1 font-bold text-[10px] sm:text-xs bg-green-100 px-2 sm:px-3 py-1 rounded-full shrink-0"><CheckCircle size={14}/> <span className="hidden sm:inline">Σωστό</span></div>
                    : <div className="text-red-600 flex items-center gap-1 font-bold text-[10px] sm:text-xs bg-red-100 px-2 sm:px-3 py-1 rounded-full shrink-0"><XCircle size={14}/> <span className="hidden sm:inline">Λάθος</span></div>
                  }
              </div>

              {q.imageUrl && !type.includes('MAP') && <img src={q.imageUrl} className="max-h-48 rounded-lg border mb-4 bg-white object-contain w-full sm:w-auto"/>}

              {/* A. SINGLE CHOICE */}
              {type === 'SINGLE' && (
                  <div className="grid gap-2">
                      {(q.options || []).map((opt: string, i: number) => {
                          const isSelected = userAnswer === i;
                          const isTarget = q.correctAnswerIndex === i;
                          
                          let style = "bg-white border-slate-100 text-slate-500";
                          if (isTarget) style = "bg-green-100 border-green-300 text-green-800 font-bold";
                          if (isSelected && !isTarget) style = "bg-red-100 border-red-300 text-red-800 font-bold";
                          
                          return (
                              <div key={i} className={`p-3 rounded-xl border flex items-center gap-3 ${style}`}>
                                  <div className="w-6 h-6 rounded-full border flex items-center justify-center text-xs shrink-0">
                                      {['A','B','C','D'][i]}
                                  </div>
                                  <span className="leading-snug text-sm sm:text-base">{opt}</span> {isSelected && <span className="text-xs ml-auto font-bold">(Επιλογή)</span>} {isTarget && <span className="text-xs ml-auto font-bold">✓</span>}
                              </div>
                          )
                      })}
                  </div>
              )}

              {/* B. TRUE / FALSE */}
              {type === 'TRUE_FALSE' && (
                  <div className="space-y-2">
                      {(q.items || []).map((item: any, i: number) => {
                          const userVal = userAnswer?.[i]; 
                          const correctVal = item.isTrue;
                          const correct = userVal === correctVal;

                          return (
                              <div key={i} className={`p-3 rounded-xl border flex justify-between items-center ${correct ? 'bg-white border-green-200' : 'bg-white border-red-200'}`}>
                                  <div className="flex items-center gap-3">
                                      {item.imageUrl && <img src={item.imageUrl} className="w-10 h-10 rounded border"/>}
                                      <span className="text-xs sm:text-sm font-bold text-slate-700">{item.text}</span>
                                  </div>
                                  <div className="flex gap-2 text-[10px] sm:text-xs font-bold shrink-0">
                                      <span className={userVal === true ? (correctVal ? "text-green-600 bg-green-50 px-2 py-1 rounded" : "text-red-500 bg-red-50 px-2 py-1 rounded") : "text-slate-300 px-2 py-1"}>ΣΩΣΤΟ</span>
                                      <span className={userVal === false ? (correctVal === false ? "text-green-600 bg-green-50 px-2 py-1 rounded" : "text-red-500 bg-red-50 px-2 py-1 rounded") : "text-slate-300 px-2 py-1"}>ΛΑΘΟΣ</span>
                                  </div>
                              </div>
                          )
                      })}
                  </div>
              )}

              {/* C. FILL GAP */}
              {type === 'FILL_GAP' && (
                  <div className="space-y-2">
                      {(q.textParts || []).map((text: string, i: number) => {
                          const userVal = userAnswer?.[i] || "---";
                          const correctVal = q.correctAnswers?.[String(i)] || q.correctAnswers?.[i];
                          const correct = String(userVal).trim().toLowerCase() === String(correctVal).trim().toLowerCase();

                          return (
                              <div key={i} className="p-4 bg-white rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                                  <p className="mb-2 text-sm sm:text-base">{text}</p>
                                  <div className="flex items-center gap-2 text-sm flex-wrap">
                                      <span className="text-slate-400 font-bold">Απάντηση:</span>
                                      <span className={`font-bold px-2 py-1 rounded ${correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{userVal}</span>
                                      {!correct && <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold">Σωστό: {correctVal}</span>}
                                  </div>
                              </div>
                          )
                      })}
                  </div>
              )}

              {/* D. MATCHING */}
              {type === 'MATCHING' && (
                  <div className="space-y-2">
                      {(q.pairs || []).map((pair: any, i: number) => {
                          const userVal = userAnswer?.[i];
                          const correctVal = pair.right;
                          const correct = userVal === correctVal;

                          return (
                              <div key={i} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border gap-2 ${correct ? 'bg-white border-green-200' : 'bg-white border-red-200'}`}>
                                  <div className="flex items-center gap-2 flex-1">
                                      <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs font-bold">{i+1}</span>
                                      {pair.leftImg && <img src={pair.leftImg} className="w-8 h-8 rounded"/>}
                                      <span className="font-bold text-sm text-slate-700">{pair.left}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <span className={`font-bold text-sm px-2 py-1 rounded ${correct ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{userVal || "---"}</span>
                                      {!correct && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">({pair.right})</span>}
                                  </div>
                              </div>
                          )
                      })}
                  </div>
              )}

              {/* E. MAP */}
              {type === 'MAP' && (
                  <div className="space-y-4">
                      <div className="h-[300px] sm:h-[400px] border-4 border-white rounded-2xl overflow-hidden shadow-sm relative">
                          <GreeceMap 
                              markers={[
                                  ...(userAnswer || []).map((p:any) => ({ ...p, color: '#ef4444' })), // User points Red
                                  ...(q.points || []).map((p:any) => ({ ...p, color: '#10b981', label: p.label + " (Σωστό)" })) // Correct points Green
                              ]}
                          />
                      </div>
                      <div className="text-center text-xs font-bold text-slate-400 flex justify-center gap-4">
                          <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full"></div> Η επιλογή σας</span>
                          <span className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div> Σωστή απάντηση</span>
                      </div>
                  </div>
              )}
          </div>
      );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600 h-10 w-10"/></div>;
  if (!result || !result.examSnapshot) return <div className="p-20 text-center text-slate-500 font-medium">Δεν βρέθηκαν δεδομένα εξέτασης.</div>;

  const { examSnapshot, answers, aiFeedback } = result;
  
  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      
      {/* HEADER */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link href="/dashboard/stats" className="flex items-center text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors group">
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform"/> <span className="hidden sm:inline">Επιστροφή</span>
            </Link>
            <div className="text-sm font-bold text-slate-400 font-mono">
                {result.date?.toDate ? new Date(result.date.toDate()).toLocaleDateString('el-GR') : ''}
            </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-4 sm:p-8 space-y-6 sm:space-y-8">
        
        {/* SCORE CARD */}
        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 -mr-20 -mt-20 pointer-events-none ${result.isPassed ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div className="z-10 text-center md:text-left">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Αποτελέσματα</h1>
                <p className="text-slate-500 font-medium text-sm sm:text-base">Αναλυτική ανασκόπηση των απαντήσεων.</p>
            </div>
            <div className={`z-10 flex items-center gap-4 sm:gap-6 px-6 py-4 rounded-3xl border-2 ${result.isPassed ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                <div className="text-right">
                     <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">Σύνολο</div>
                     <div className="text-3xl sm:text-4xl font-black">{Math.round(result.score)}/100</div>
                </div>
                <div className="flex flex-col items-center">
                    {result.isPassed ? <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-green-600"/> : <XCircle className="h-8 w-8 sm:h-10 sm:w-10 text-red-600"/>}
                    <div className="text-[10px] font-black uppercase mt-1 tracking-widest">{result.isPassed ? 'ΕΠΙΤΥΧΙΑ' : 'ΑΠΟΤΥΧΙΑ'}</div>
                </div>
            </div>
        </div>

        {/* TABS - Scrollable on mobile */}
        <div className="flex bg-slate-200 p-1.5 rounded-2xl w-fit overflow-x-auto max-w-full no-scrollbar">
            {[ 
               {id:'theory', l:'Θεωρία', i: BookOpen}, 
               {id:'reading', l:'Ανάγνωση', i: PenTool}, 
               {id:'listening', l:'Ακουστική', i: PlayCircle}, 
               {id:'speaking', l:'Ομιλία', i: Mic} 
            ].map(tab => (
                <button 
                    key={tab.id} 
                    onClick={() => { setActiveTab(tab.id as any); setMobileView('content'); }} 
                    className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                   <tab.i className="h-4 w-4"/> {tab.l}
                </button>
            ))}
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            
            {/* 1. THEORY */}
            {activeTab === 'theory' && (
                <div className="space-y-2">
                    {examSnapshot.theory?.map((q: any, i: number) => renderQuestionResult(q, answers.theory?.[i], i))}
                </div>
            )}

            {/* 2. READING */}
            {activeTab === 'reading' && (
                <>
                <MobileTabs/>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* Content */}
                    <div className={`${mobileView === 'content' ? 'block' : 'hidden'} lg:block`}>
                        {examSnapshot.reading?.data && (
                            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm lg:sticky lg:top-24">
                                <h3 className="font-black text-lg sm:text-xl mb-6 text-slate-900 flex gap-2 items-center border-b pb-4"><BookOpen/> Κείμενο</h3>
                                <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap font-medium leading-relaxed">
                                    {examSnapshot.reading.data.textContent}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Questions */}
                    <div className={`space-y-2 ${mobileView === 'questions' ? 'block' : 'hidden'} lg:block`}>
                        {examSnapshot.reading?.partA?.map((q:any, i:number) => renderQuestionResult(q, answers.readingA?.[i], i))}
                        {examSnapshot.reading?.partB?.map((q:any, i:number) => renderQuestionResult(q, answers.readingB?.[i], i + 50))}
                        
                        {/* WRITING REVIEW */}
                        <div className="bg-orange-50 p-6 sm:p-8 rounded-[2.5rem] border border-orange-100 mt-8">
                            <h3 className="font-black text-orange-900 mb-6 flex items-center gap-2 text-xl"><PenTool/> Έκθεση (Writing)</h3>
                            
                            <div className="bg-white p-6 rounded-2xl border border-orange-100 text-slate-700 whitespace-pre-wrap mb-6 shadow-sm min-h-[100px]">
                                {answers.essay || "Δεν δόθηκε απάντηση."}
                            </div>

                            {aiFeedback?.writing ? (
                                <div className="bg-white p-6 rounded-2xl border border-orange-200 shadow-sm">
                                    <div className="flex justify-between items-center mb-4 border-b border-orange-50 pb-3">
                                        <h4 className="font-bold text-orange-800 flex gap-2"><Sparkles className="text-purple-500 fill-purple-500"/> AI Αξιολόγηση</h4>
                                        <span className="bg-orange-100 text-orange-800 px-4 py-1.5 rounded-xl font-black border border-orange-200">{aiFeedback.writing.score}/12</span>
                                    </div>
                                    <p className="text-slate-600 italic leading-relaxed text-sm">{aiFeedback.writing.feedback}</p>
                                </div>
                            ) : (
                                <div className="text-center text-slate-400 text-sm font-bold bg-white/50 p-4 rounded-xl border border-dashed border-orange-200">
                                    Δεν ζητήθηκε αξιολόγηση AI
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                </>
            )}

            {/* 3. LISTENING */}
            {activeTab === 'listening' && (
                <>
                <MobileTabs/>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Content */}
                    <div className={`${mobileView === 'content' ? 'block' : 'hidden'} lg:block lg:col-span-1`}>
                        {examSnapshot.listening?.data && (
                            <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm lg:sticky lg:top-24">
                                <h3 className="font-black text-lg sm:text-xl mb-6 text-purple-900 flex gap-2 items-center"><PlayCircle/> Ακουστικό</h3>
                                {examSnapshot.listening.data.audioUrl && (
                                <audio controls src={examSnapshot.listening.data.audioUrl} className="w-full mb-6 accent-purple-600"/>
                                )}
                                {examSnapshot.listening.data.transcript && (
                                    <div className="p-6 bg-purple-50/50 rounded-2xl text-sm text-slate-700 border border-purple-100 leading-loose">
                                        <strong className="block mb-2 text-purple-900">Τρανσκριπτικό (Transcript):</strong> 
                                        {examSnapshot.listening.data.transcript}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Questions */}
                    <div className={`space-y-2 ${mobileView === 'questions' ? 'block' : 'hidden'} lg:block lg:col-span-2`}>
                        {examSnapshot.listening?.partA?.map((q:any, i:number) => renderQuestionResult(q, answers.listeningA?.[i], i))}
                        {examSnapshot.listening?.partB?.map((q:any, i:number) => renderQuestionResult(q, answers.listeningB?.[i], i + 50))}
                    </div>
                </div>
                </>
            )}

            {/* 4. SPEAKING */}
            {activeTab === 'speaking' && (
                <div className="space-y-8">
                    {/* General Task */}
                    <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <h3 className="font-black text-lg sm:text-xl mb-4 text-emerald-900 flex gap-2 items-center"><Mic/> Task 1: General</h3>
                        <p className="text-slate-700 font-medium mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">{examSnapshot.speaking?.lesson0?.prompt}</p>
                        
                        <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
                            <div className="text-xs font-black uppercase text-emerald-700 mb-2 tracking-widest">Η ηχογράφησή σας</div>
                            {answers.speakingUrl0 ? (
                                <audio controls src={answers.speakingUrl0} className="w-full accent-emerald-600"/>
                            ) : <div className="text-slate-400 font-bold text-sm">Δεν ηχογραφήθηκε</div>}
                        </div>
                    </div>

                    {/* Random Task */}
                    <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <h3 className="font-black text-lg sm:text-xl mb-4 text-emerald-900 flex gap-2 items-center"><Mic/> Task 2: Topic</h3>
                        <p className="text-slate-700 font-medium mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">{examSnapshot.speaking?.lessonRandom?.prompt}</p>
                        
                        {examSnapshot.speaking?.lessonRandom?.imageUrls && (
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {examSnapshot.speaking.lessonRandom.imageUrls.map((url:string, i:number) => (
                                    <img key={i} src={url} className="rounded-xl border h-40 object-cover w-full bg-slate-100"/>
                                ))}
                            </div>
                        )}

                        <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 mb-6">
                            <div className="text-xs font-black uppercase text-emerald-700 mb-2 tracking-widest">Η ηχογράφησή σας</div>
                            {answers.speakingUrlRandom ? (
                                <audio controls src={answers.speakingUrlRandom} className="w-full accent-emerald-600"/>
                            ) : <div className="text-slate-400 font-bold text-sm">Δεν ηχογραφήθηκε</div>}
                        </div>

                        {aiFeedback?.speaking ? (
                            <div className="bg-white p-6 rounded-2xl border-2 border-emerald-100">
                                <div className="flex justify-between items-center mb-4 border-b border-emerald-50 pb-3">
                                    <h4 className="font-bold text-emerald-800 flex gap-2"><Sparkles className="text-purple-500 fill-purple-500"/> AI Αξιολόγηση</h4>
                                    <span className="bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-xl font-black border border-emerald-200">{aiFeedback.speaking.score}/15</span>
                                </div>
                                <p className="text-slate-600 italic leading-relaxed text-sm">{aiFeedback.speaking.feedback}</p>
                            </div>
                        ) : (
                            <div className="text-center text-slate-400 text-sm font-bold bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">
                                Δεν ζητήθηκε αξιολόγηση AI
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
}