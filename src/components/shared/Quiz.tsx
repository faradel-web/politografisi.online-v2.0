"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Check, X, ChevronRight, ChevronLeft, 
  MapPin, CheckCircle2, RotateCcw, ListChecks, Undo2,
  Sparkles, Loader2, Bot, AlertTriangle 
} from "lucide-react";
import GreeceMap, { MapMarker } from "./GreeceMap"; 

// --- ВНУТРІШНІ КОМПОНЕНТИ ДЛЯ СТАБІЛІЗАЦІЇ ВВОДУ (Anti-Jump Fix) ---
const BufferedInput = ({ value, onUpdate, className, disabled, placeholder }: any) => {
  const [localVal, setLocalVal] = useState(value || "");
  useEffect(() => { setLocalVal(value || ""); }, [value]);

  return (
    <input
      type="text"
      className={className}
      disabled={disabled}
      placeholder={placeholder}
      value={localVal}
      onChange={(e) => setLocalVal(e.target.value)}
      onBlur={() => onUpdate(localVal)} 
    />
  );
};

const BufferedTextarea = ({ value, onUpdate, className, disabled, placeholder }: any) => {
  const [localVal, setLocalVal] = useState(value || "");
  useEffect(() => { setLocalVal(value || ""); }, [value]);

  return (
    <textarea
      className={className}
      disabled={disabled}
      placeholder={placeholder}
      value={localVal}
      onChange={(e) => setLocalVal(e.target.value)}
      onBlur={() => onUpdate(localVal)}
    />
  );
};

// --- ΤΥΠΟΠΟΙΗΣΗ (TYPING) ---
export interface Question {
  id?: string;
  type?: string; 
  question?: string; 
  imageUrl?: string;
  
  options?: string[];
  correctAnswerIndex?: number;
  correctIndices?: number[];

  pairs?: {left: string, right: string, leftImg?: string, rightImg?: string}[];

  textParts?: string[]; 
  wordBank?: string[]; 
  inlineChoices?: Record<string, string[]>; 
  correctAnswers?: Record<string, string> | any;

  items?: {id?: string, text?: string, imageUrl?: string, isTrue: boolean}[];
  statement?: string;
  isTrue?: boolean;

  points?: {id?: string, lat: number, lng: number, label: string}[];
  tolerance?: number;

  modelAnswer?: string;
}

interface QuizProps {
  questions: Question[];
  onComplete?: (results?: any) => void;
  onAnswerUpdate?: (answers: Record<number, any>) => void;
  onAICheck?: (question: string, answer: string, modelAnswer?: string) => Promise<any>;
  readOnlyMode?: boolean; 
  savedAnswers?: Record<number, any>; 
  showResultCard?: boolean; 
  mode?: 'practice' | 'exam';
  layout?: 'stepper' | 'list';
  hideSubmit?: boolean; 
}

export default function Quiz({ 
  questions = [], 
  onComplete, 
  onAnswerUpdate,
  onAICheck, 
  readOnlyMode = false, 
  savedAnswers = {},
  mode = 'practice',
  layout = 'stepper',
  hideSubmit = false 
}: QuizProps) {
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>(savedAnswers || {});
  
  const [checkedQuestions, setCheckedQuestions] = useState<Record<number, boolean>>({});
  const [isListSubmitted, setIsListSubmitted] = useState(false); 

  const [aiFeedback, setAiFeedback] = useState<Record<number, any>>({});
  const [isAiLoading, setIsAiLoading] = useState<Record<number, boolean>>({});

  const [matchingOrder, setMatchingOrder] = useState<Record<number, number[]>>({});

  useEffect(() => {
    if (savedAnswers && Object.keys(savedAnswers).length > 0) {
        setAnswers(savedAnswers);
    }
  }, [savedAnswers]);

  useEffect(() => {
    setMatchingOrder(prevOrder => {
      const newOrder = { ...prevOrder };
      let hasChanges = false;
      questions.forEach((q, idx) => {
        if (newOrder[idx]) return;
        if ((q.type === 'MATCHING' || q.type?.includes('MATCH')) && q.pairs && q.pairs.length > 0) {
            const indices = q.pairs.map((_, i) => i);
            for (let i = indices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }
            newOrder[idx] = indices;
            hasChanges = true;
        }
      });
      return hasChanges ? newOrder : prevOrder;
    });
  }, [questions]); 

  if (!questions || questions.length === 0) {
    return <div className="p-8 text-center text-slate-400 italic">Δεν υπάρχουν διαθέσιμες ερωτήσεις.</div>;
  }

  const isChecked = (idx: number) => {
      if (readOnlyMode) return true;
      if (layout === 'list') return isListSubmitted;
      return checkedQuestions[idx] || false;
  };

  const handleSelect = (idx: number, val: any) => {
    if (readOnlyMode || (isChecked(idx) && mode === 'practice')) return;
    const newAnswers = { ...answers, [idx]: val };
    setAnswers(newAnswers);
    if (onAnswerUpdate) onAnswerUpdate(newAnswers);
  };

  // 🔥 НОВА ФУНКЦІЯ: Перевірка правильності (для візуалізації бейджів)
  const isQuestionCorrect = (q: Question, idx: number) => {
    const ans = answers[idx];
    if (ans === undefined || ans === null) return false;

    // 1. MAP LOGIC (Математична перевірка)
    if (q.type?.includes('MAP') && q.points) {
        if (!Array.isArray(ans)) return false;
        let correctPoints = 0;
        
        q.points.forEach((targetPt, i) => {
            const userPt = ans[i];
            if (!userPt) return;
            
            const tolerance = Number(q.tolerance) || 30; 
            const dist = Math.sqrt(
                Math.pow(userPt.lat - targetPt.lat, 2) + 
                Math.pow(userPt.lng - targetPt.lng, 2)
            );
            
            if (dist <= tolerance) correctPoints++;
        });

        return correctPoints === q.points.length;
    }

    // 2. STANDARD LOGIC
    if (q.type === 'SINGLE') return ans === q.correctAnswerIndex;
    if (q.type === 'TRUE_FALSE') return q.items && ans['0'] === q.items[0].isTrue;
    if (q.type === 'MULTI') {
        if (!Array.isArray(ans)) return false;
        const correctIds = q.correctIndices || [];
        if (ans.length !== correctIds.length) return false;
        return ans.every((v: number) => correctIds.includes(v));
    }
    
    return true; // Для інших типів (Open, FillGap) - складніша логіка, повертаємо true щоб не лякати червоним
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      if (onComplete) onComplete(answers);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
    }
  };

  const handleCheckSingle = () => {
    setCheckedQuestions(prev => ({ ...prev, [currentIndex]: true }));
  };

  const handleCheckList = () => {
      setIsListSubmitted(true);
      if (onComplete) onComplete(answers);
  };

  const handleRetryList = () => {
      setIsListSubmitted(false);
      setAnswers({});
      setAiFeedback({}); 
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAICheckClick = async (q: Question, idx: number) => {
      const userAnswer = answers[idx];
      if (!userAnswer || !onAICheck) return;

      setIsAiLoading(prev => ({ ...prev, [idx]: true }));
      try {
          const result = await onAICheck(q.question || "", userAnswer, q.modelAnswer);
          setAiFeedback(prev => ({ ...prev, [idx]: result }));
          setCheckedQuestions(prev => ({ ...prev, [idx]: true }));
      } catch (error) {
          console.error("AI Check Failed", error);
      } finally {
          setIsAiLoading(prev => ({ ...prev, [idx]: false }));
      }
  };

  // --- RENDERERS ---

  const renderChoice = (q: Question, idx: number) => {
    const questionType = (q.type || 'SINGLE').toUpperCase();
    const opts = q.options || [];
    const isMulti = questionType.includes('MULTI');
    const currentAnswer = answers[idx];
    const isQChecked = isChecked(idx);

    return (
      <div className="grid gap-3">
        {opts.map((opt, optIdx) => {
          let isSelected = false;
          if (isMulti) isSelected = Array.isArray(currentAnswer) && currentAnswer.includes(optIdx);
          else isSelected = currentAnswer === optIdx;

          let style = "bg-white border-slate-200 hover:border-blue-300";
          let icon = <div className="w-6 h-6 rounded-full border-2 border-slate-200" />;
          
          if (isQChecked) {
             let isCorrectIndex = false;
             if (isMulti) {
                 if (q.correctIndices && Array.isArray(q.correctIndices)) isCorrectIndex = q.correctIndices.includes(optIdx);
                 else if (q.correctAnswerIndex !== undefined) isCorrectIndex = q.correctAnswerIndex === optIdx;
             } else {
                 isCorrectIndex = q.correctAnswerIndex === optIdx;
             }
             
             if (isCorrectIndex) {
                 style = "bg-emerald-50 border-emerald-500 text-emerald-900";
                 icon = <CheckCircle2 className="w-6 h-6 text-emerald-600" />;
             } else if (isSelected) {
                 style = "bg-red-50 border-red-500 text-red-900";
                 icon = <X className="w-6 h-6 text-red-500" />;
             } else {
                 style = "opacity-50 grayscale";
             }
          } else if (isSelected) {
             style = "bg-slate-900 border-slate-900 text-white shadow-md transform scale-[1.01]";
             icon = <div className="w-6 h-6 rounded-full bg-white border-4 border-slate-900" />;
          }

          const isImageOption = typeof opt === 'string' && (opt.startsWith('http') || opt.startsWith('/'));

          return (
            <button 
              key={optIdx} 
              onClick={() => {
                if (isMulti) {
                  const arr = (Array.isArray(currentAnswer) ? currentAnswer : []) as number[];
                  handleSelect(idx, arr.includes(optIdx) ? arr.filter(i => i !== optIdx) : [...arr, optIdx]);
                } else {
                  handleSelect(idx, optIdx);
                }
              }}
              disabled={isQChecked}
              className={`text-left p-4 rounded-xl border-2 font-medium transition-all flex items-center gap-4 ${style}`}
            >
              <div className="shrink-0">{icon}</div>
              {isImageOption ? (
                 <div className="w-full">
                    <img src={opt} alt={`Option ${optIdx + 1}`} className="w-full max-w-[300px] h-48 object-cover rounded-lg border border-slate-200 bg-white"/>
                 </div>
              ) : (
                 <span className="leading-snug">{opt}</span>
              )}
            </button>
          )
        })}
      </div>
    );
  };

  const renderTrueFalse = (q: Question, idx: number) => {
    const rawItems = q.items || [{ text: q.statement || q.question, isTrue: q.isTrue }];
    const items = rawItems.map((it: any) => ({ text: it.text || "", imageUrl: it.imageUrl, isTrue: it.isTrue }));
    const currentAnswer = answers[idx];
    const userMap = (typeof currentAnswer === 'object') ? currentAnswer : { "0": currentAnswer };
    const isQChecked = isChecked(idx);

    return (
      <div className="space-y-4">
        {items.map((item, itemIdx) => {
          if (!item.text && !item.imageUrl) return null;
          const userVal = userMap[itemIdx];
          const isCorrectAnswer = item.isTrue;
          const userIsCorrect = userVal === isCorrectAnswer;
          
          let containerClass = "bg-white border-slate-200";
          if (isQChecked && userVal !== undefined) {
             containerClass = userIsCorrect ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200";
          }

          return (
            <div key={itemIdx} className={`p-4 rounded-xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${containerClass}`}>
               <div className="flex items-center gap-3">
                  {item.imageUrl && <img src={item.imageUrl} className="w-16 h-16 object-cover rounded-lg bg-slate-100 border" alt=""/>}
                  <span className="font-bold text-slate-800 text-lg leading-snug">{item.text}</span>
               </div>
               <div className="flex gap-2 shrink-0">
                  {['ΣΩΣΤΟ', 'ΛΑΘΟΣ'].map(opt => {
                     const boolVal = opt === 'ΣΩΣΤΟ'; 
                     const isSel = userVal === boolVal; 
                     
                     let btnClass = "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100";
                     
                     if (isSel && !isQChecked) {
                        btnClass = "bg-slate-900 text-white border-slate-900 shadow-md transform scale-[1.02]";
                     }

                     if (isQChecked) {
                         if (!isSel) {
                             btnClass = "opacity-20 border-transparent"; 
                         } else {
                             btnClass = userIsCorrect 
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-md" 
                                : "bg-red-600 text-white border-red-600 shadow-md";
                         }
                     }
                     
                     return (
                       <button 
                         key={opt}
                         onClick={() => handleSelect(idx, {...userMap, [itemIdx]: boolVal})}
                         disabled={isQChecked}
                         className={`px-6 py-3 rounded-xl text-xs font-black border-2 transition-all ${btnClass}`}
                       >
                         {opt}
                       </button>
                     )
                  })}
               </div>
            </div>
          )
        })}
      </div>
    );
  };

  const renderMatching = (q: Question, idx: number) => {
    const pairs = q.pairs || [];
    const userMap = answers[idx] || {}; 
    const isQChecked = isChecked(idx);
    const orderIndices = matchingOrder[idx] || pairs.map((_, i) => i);
    const rightOptions = pairs.map((p) => ({ val: p.right, img: p.rightImg }));

    return (
      <div className="space-y-3">
        {orderIndices.map((originalIdx) => {
           const p = pairs[originalIdx];
           const userVal = userMap[originalIdx];
           const isCorrect = userVal === p.right;
           
           let style = "bg-white border-slate-200";
           if (isQChecked && userVal) style = isCorrect ? "bg-emerald-50 border-emerald-300" : "bg-red-50 border-red-300";
           const isLeftImage = typeof p.left === 'string' && (p.left.startsWith('http') || p.left.startsWith('/'));

           return (
             <div key={originalIdx} className={`p-4 rounded-xl border-2 flex flex-col md:flex-row md:items-center justify-between gap-4 ${style}`}>
                <div className="flex items-center gap-4 flex-1 overflow-hidden">
                   <span className="w-8 h-8 shrink-0 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-black border border-slate-200">
                      •
                   </span>
                   {p.leftImg ? <img src={p.leftImg} className="w-24 h-24 rounded-lg object-cover border bg-white" alt=""/> : 
                    isLeftImage ? <img src={p.left} className="w-32 h-24 rounded-lg object-cover border bg-white" alt=""/> : 
                    <span className="font-bold text-slate-800 leading-snug">{p.left}</span>}
                </div>
                <div className="w-full md:w-1/2">
                    <select 
                      value={userVal || ""}
                      onChange={(e) => handleSelect(idx, {...userMap, [originalIdx]: e.target.value})}
                      disabled={isQChecked}
                      className="w-full p-3 rounded-xl bg-slate-50 border-2 border-slate-200 font-bold text-sm outline-none cursor-pointer focus:border-blue-400 text-slate-700 truncate"
                    >
                       <option value="">-- Επιλογή --</option>
                       {rightOptions.map((opt, i) => (
                          <option key={i} value={opt.val}>{opt.val || `Επιλογή ${i+1}`}</option>
                       ))}
                    </select>
                </div>
             </div>
           )
        })}
      </div>
    );
  };

  const renderFillGap = (q: Question, idx: number) => {
    const questionType = (q.type || 'SINGLE').toUpperCase();
    const parts = q.textParts || [];
    const userMap = answers[idx] || {};
    const isInline = questionType === 'INLINE-CHOICE' || (q.inlineChoices && Object.keys(q.inlineChoices).length > 0);
    const isQChecked = isChecked(idx);

    return (
      <div className="space-y-8">
         {!isInline && q.wordBank && q.wordBank.length > 0 && (
            <div className="p-6 bg-slate-100 rounded-2xl border-2 border-slate-200 flex flex-wrap gap-3">
               {q.wordBank.map((w, i) => (
                  <span key={i} className="bg-white px-4 py-2 rounded-xl border border-slate-200 font-bold text-sm text-slate-700 shadow-sm select-all">{w}</span>
               ))}
            </div>
         )}
         
         <div className="space-y-6">
            {parts.map((text, partIdx) => {
               const userVal = userMap[partIdx] || "";
               let correctVal = "";
               let isCorrect = false;
               
               if (isQChecked) {
                  correctVal = q.correctAnswers ? (q.correctAnswers[partIdx] || q.correctAnswers[String(partIdx)]) : "";
                  isCorrect = String(userVal).trim().toLowerCase() === String(correctVal).trim().toLowerCase();
               }

               let style = "border-slate-200 focus:border-blue-500 focus:bg-white bg-slate-50";
               if (isQChecked) {
                  style = isCorrect 
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900" 
                    : "border-red-500 bg-red-50 text-red-900";
               }

               return (
                 <div key={partIdx} className="p-5 bg-white border-2 border-slate-100 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center shadow-sm">
                    <p className="font-serif text-lg leading-relaxed text-slate-800 flex-1">
                        {text.includes('(') ? text : <><span className="font-sans font-bold text-slate-400 mr-2">{partIdx+1}.</span>{text}</>}
                    </p>
                    
                    <div className="w-full md:w-auto min-w-[200px] flex flex-col gap-2">
                        {isInline ? (
                           <select 
                              value={userVal}
                              onChange={(e) => handleSelect(idx, {...userMap, [partIdx]: e.target.value})}
                              disabled={isQChecked}
                              className={`w-full p-3 rounded-xl border-2 font-bold text-sm outline-none cursor-pointer ${style}`}
                           >
                              <option value="">-- Επιλογή --</option>
                              {q.inlineChoices?.[String(partIdx+1)]?.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                           </select>
                        ) : (
                           <BufferedInput 
                              className={`w-full p-3 rounded-xl border-2 font-bold outline-none ${style}`} 
                              value={userVal} 
                              onUpdate={(val: string) => handleSelect(idx, {...userMap, [partIdx]: val})} 
                              disabled={isQChecked} 
                              placeholder="Γράψτε εδώ..." 
                           />
                        )}

                        {isQChecked && !isCorrect && correctVal && (
                           <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                              <CheckCircle2 size={14} />
                              <span>Σωστό: <span className="underline decoration-2 underline-offset-2">{correctVal}</span></span>
                           </div>
                        )}
                    </div>
                 </div>
               )
            })}
         </div>
      </div>
    );
  };

  // 🔥🔥🔥 ВИПРАВЛЕНИЙ РЕНДЕР КАРТИ 🔥🔥🔥
  const renderMap = (q: Question, idx: number) => {
     const rawAnswer = answers[idx];
     const userPlacedPoints: {lat:number, lng:number}[] = Array.isArray(rawAnswer) ? rawAnswer : [];
     
     const requiredPoints = q.points || [];
     const isQChecked = isChecked(idx);
 
     const currentStepIndex = userPlacedPoints.length;
     const isFinished = currentStepIndex >= requiredPoints.length;
     const currentTarget = !isFinished ? requiredPoints[currentStepIndex] : null;
 
     const handleMapClick = (coords: {lat: number, lng: number}) => {
         if (isFinished || isQChecked) return;
         handleSelect(idx, [...userPlacedPoints, coords]);
     };
 
     const handleResetMap = () => !isQChecked && handleSelect(idx, []);
 
     const markersToRender: MapMarker[] = [];
 
     // 1. Точки, які поставив користувач
     userPlacedPoints.forEach((userPt, i) => {
         const targetPt = requiredPoints[i]; 
         if (!targetPt) return;
 
         let label: string | undefined = `${i + 1}. ${targetPt.label}`; 
         let color: 'red' | 'green' | 'blue' = 'blue'; 
 
         if (isQChecked) {
             // 🟢 МАТЕМАТИЧНА ПЕРЕВІРКА ПОХИБКИ
             const tolerance = Number(q.tolerance) || 30;
             const dist = Math.sqrt(Math.pow(userPt.lat - targetPt.lat, 2) + Math.pow(userPt.lng - targetPt.lng, 2));
             
             if (dist <= tolerance) {
                 color = 'green';
                 label = `✅ ${targetPt.label}`;
             } else {
                 color = 'red';
                 label = `❌ ${targetPt.label}`;
             }
         }
 
         markersToRender.push({ lat: userPt.lat, lng: userPt.lng, label, color });
     });
 
     // 2. Якщо помилка - показуємо правильне місце
     if (isQChecked) {
         requiredPoints.forEach((targetPt, i) => {
             const userPt = userPlacedPoints[i];
             const tolerance = Number(q.tolerance) || 30;
             let showCorrect = true;

             if (userPt) {
                const dist = Math.sqrt(Math.pow(userPt.lat - targetPt.lat, 2) + Math.pow(userPt.lng - targetPt.lng, 2));
                if (dist <= tolerance) showCorrect = false; // Якщо попав - не дублюємо
             }

             if (showCorrect) {
                  markersToRender.push({
                      lat: targetPt.lat,
                      lng: targetPt.lng,
                      label: `(Σωστό: ${targetPt.label})`, 
                      color: 'green'
                  });
             }
         });
     }
 
     return (
       <div className="w-full flex flex-col gap-6">
         <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
             <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Σημεία προς εύρεση:</h4>
             <div className="flex flex-wrap gap-2">
                 {requiredPoints.map((pt, i) => {
                     const isPlaced = i < userPlacedPoints.length;
                     const isCurrent = i === currentStepIndex;
                     let style = "bg-slate-50 text-slate-400 border-slate-200"; 
                     if (isPlaced) style = "bg-blue-100 text-blue-800 border-blue-200"; 
                     if (isCurrent && !isFinished && !isQChecked) style = "bg-slate-900 text-white border-slate-900 ring-4 ring-blue-200 animate-pulse"; 
                     return (
                         <div key={i} className={`px-4 py-2 rounded-lg text-sm font-bold border ${style} transition-all`}>
                             {i + 1}. {pt.label}
                         </div>
                     );
                 })}
             </div>
             {!isQChecked && userPlacedPoints.length > 0 && (
                 <button onClick={handleResetMap} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg flex items-center gap-1 transition-colors w-fit">
                     <Undo2 size={14}/> Επαναφορά
                 </button>
             )}
         </div>
 
         <div className="w-full h-[500px] rounded-2xl overflow-hidden relative shadow-inner border-2 border-slate-200 bg-slate-100">
            <GreeceMap markers={markersToRender} onSelect={isFinished || isQChecked ? undefined : handleMapClick} />
         </div>
       </div>
     );
  };
  
  const renderOpen = (q: Question, idx: number) => {
     const loading = isAiLoading[idx];
     const feedback = aiFeedback[idx];
     const textAnswer = answers[idx] || "";

     let colorClass = "bg-slate-50 border-slate-100";
     let textClass = "text-slate-800";
     let icon = <Bot size={20}/>;

     if (feedback) {
         if (feedback.score === 2) {
             colorClass = "bg-emerald-50 border-emerald-200";
             textClass = "text-emerald-800";
             icon = <Sparkles size={20} className="text-emerald-600"/>;
         } else if (feedback.score === 1) {
             colorClass = "bg-amber-50 border-amber-200";
             textClass = "text-amber-800";
             icon = <AlertTriangle size={20} className="text-amber-600"/>;
         } else {
             colorClass = "bg-red-50 border-red-200";
             textClass = "text-red-800";
             icon = <X size={20} className="text-red-600"/>;
         }
     }

     return (
        <div className="space-y-4">
            <BufferedTextarea 
                className="w-full h-40 p-4 rounded-xl border-2 border-slate-200 outline-none focus:border-purple-400 font-medium disabled:bg-slate-50" 
                value={textAnswer} 
                onUpdate={(val: string) => handleSelect(idx, val)} 
                disabled={isChecked(idx) || loading} 
                placeholder="Η απάντησή σας..." 
            />
            
            {!feedback && onAICheck && (
                <div className="flex justify-end">
                    <button 
                        onClick={() => handleAICheckClick(q, idx)}
                        disabled={loading || textAnswer.length < 3}
                        className="bg-purple-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-700 disabled:opacity-50 transition-all shadow-md"
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5"/> : <Bot size={20}/>}
                        Έλεγχος με AI
                    </button>
                </div>
            )}

            {feedback && (
                <div className={`p-5 rounded-2xl border-2 ${colorClass} animate-in fade-in slide-in-from-top-2`}>
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-white rounded-full shrink-0 shadow-sm">
                            {icon}
                        </div>
                        <div className="space-y-2 w-full">
                            <div className="flex items-center justify-between">
                                <h4 className={`font-black text-lg ${textClass}`}>
                                    Βαθμολογία: {feedback.score}/2
                                </h4>
                                {feedback.score === 2 && <span className="px-3 py-1 bg-white rounded-full text-xs font-bold text-emerald-600 shadow-sm border border-emerald-100">Σωστά</span>}
                            </div>
                            
                            <p className="text-slate-700 font-medium leading-relaxed">{feedback.feedback}</p>
                            
                            {feedback.score < 2 && feedback.improvedAnswer && (
                                <div className="mt-3 p-4 bg-white/60 rounded-xl text-sm border border-black/5">
                                    <span className="font-bold text-slate-500 block mb-1 uppercase tracking-wider text-xs">Σωστή απάντηση (Πρότυπο):</span>
                                    <span className="text-slate-800 font-serif italic text-lg">«{feedback.improvedAnswer}»</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
     );
  };

  const renderQuestionContent = (q: Question, idx: number) => {
      const qType = (q.type || 'SINGLE').toUpperCase();
      if (qType.includes('SINGLE') || qType.includes('MULTI')) return renderChoice(q, idx);
      if (qType.includes('TRUE')) return renderTrueFalse(q, idx);
      if (qType.includes('MATCH')) return renderMatching(q, idx);
      if (qType.includes('FILL') || qType === 'INLINE-CHOICE') return renderFillGap(q, idx);
      if (qType.includes('MAP')) return renderMap(q, idx);
      if (qType.includes('OPEN')) return renderOpen(q, idx);
      return <div>Άγνωστος τύπος ερώτησης</div>;
  };

  // --- LIST LAYOUT ---
  if (layout === 'list') {
      return (
          <div className="w-full max-w-4xl mx-auto pb-10">
              <div className="space-y-12">
                  {questions.map((q, i) => {
                      // 🔥 ВАЖЛИВО: Оновлення бейджів для Карти в режимі списку
                      let badge = null;
                      let borderClass = "border-slate-100";

                      if (isListSubmitted) {
                          const isCorrect = isQuestionCorrect(q, i); // Використовуємо нову функцію
                          if (isCorrect) {
                              borderClass = "border-emerald-200 ring-1 ring-emerald-100";
                              badge = <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-bl-2xl text-xs font-black uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={14}/> Σωστό</div>;
                          } else {
                              borderClass = "border-red-200 ring-1 ring-red-100";
                              badge = <div className="absolute top-0 right-0 bg-red-100 text-red-700 px-4 py-2 rounded-bl-2xl text-xs font-black uppercase tracking-widest flex items-center gap-1"><X size={14}/> Λάθος</div>;
                          }
                      }

                      return (
                        <div key={q.id || i} className={`bg-white p-6 md:p-8 rounded-[2rem] border shadow-sm relative overflow-hidden ${borderClass}`}>
                            <div className="absolute top-0 left-0 bg-slate-100 px-4 py-2 rounded-br-2xl text-xs font-black text-slate-500 uppercase tracking-widest">
                                Ερώτηση {i + 1}
                            </div>
                            {badge}
                            <h3 className="text-lg md:text-xl font-black text-slate-900 mb-6 mt-6 leading-snug">
                                {q.question}
                            </h3>
                            {q.imageUrl && !q.type?.includes('TRUE') && !q.type?.includes('MAP') && (
                                <div className="mb-6 rounded-xl overflow-hidden border border-slate-100">
                                    <img src={q.imageUrl} className="w-full max-h-64 object-contain bg-slate-50" alt=""/>
                                </div>
                            )}
                            {renderQuestionContent(q, i)}
                        </div>
                      )
                  })}
              </div>

              {!readOnlyMode && !hideSubmit && (
                  <div className="mt-10 flex justify-center pb-6">
                      {!isListSubmitted ? (
                          <button 
                              onClick={handleCheckList} 
                              className="bg-slate-900 text-white px-10 py-4 rounded-full font-black shadow-xl hover:bg-slate-800 hover:scale-105 transition-all flex items-center gap-3"
                          >
                              <ListChecks size={24}/> Έλεγχος Απαντήσεων
                          </button>
                      ) : (
                          <div className="flex gap-4 flex-wrap justify-center">
                              <div className="bg-emerald-500 text-white px-8 py-4 rounded-full font-black shadow-xl flex items-center gap-2 cursor-default">
                                  <CheckCircle2 size={24}/> Ολοκληρώθηκε
                              </div>
                              <button 
                                  onClick={handleRetryList} 
                                  className="bg-white text-slate-700 px-6 py-4 rounded-full font-bold shadow-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-2"
                              >
                                  <RotateCcw size={20}/> Επανάληψη
                              </button>
                          </div>
                      )}
                  </div>
              )}
          </div>
      );
  }

  // --- STEPPER LAYOUT ---
  const currentQ = questions[currentIndex];
  const currentAnswer = answers[currentIndex];
  const hasMapFinished = currentQ.type?.includes('MAP') && Array.isArray(currentAnswer) && currentAnswer.length === (currentQ.points?.length || 0);
  
  const hasAnswer = currentAnswer !== undefined && currentAnswer !== null && (
      hasMapFinished || 
      (!currentQ.type?.includes('MAP') && (
        (Array.isArray(currentAnswer) && currentAnswer.length > 0) || 
        (typeof currentAnswer === 'object' && Object.keys(currentAnswer).length > 0) ||
        (typeof currentAnswer === 'string' && currentAnswer.trim() !== '') ||
        (typeof currentAnswer === 'number')
      ))
  );

  const isQCheckedStepper = readOnlyMode || (mode === 'practice' && checkedQuestions[currentIndex]);

  const handleMainAction = () => {
      if (mode === 'practice' && !readOnlyMode && !isQCheckedStepper) {
          handleCheckSingle();
      } else {
          handleNext();
      }
  };

  const getMainButtonText = () => {
      if (mode === 'practice' && !readOnlyMode && !isQCheckedStepper) return "Έλεγχος";
      return currentIndex === questions.length - 1 ? 'Ολοκλήρωση' : 'Επόμενο';
  };

  const isMainButtonDisabled = () => {
      if (mode === 'practice' && !readOnlyMode && !isQCheckedStepper && !hasAnswer) return true;
      return false;
  };

  const isPendingAIQuestion = currentQ.type === 'OPEN' && !!onAICheck && !checkedQuestions[currentIndex];
  const showMainFooterButton = !hideSubmit && !isPendingAIQuestion;

  return (
    <div className="max-w-3xl mx-auto w-full">
       <div className="mb-6 flex justify-between items-center">
          <span className="bg-slate-100 text-slate-500 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
             Ερώτηση {currentIndex + 1} / {questions.length}
          </span>
       </div>
       <h3 className="text-xl font-black text-slate-900 mb-6 leading-snug">{currentQ.question}</h3>
       {currentQ.imageUrl && !currentQ.type?.includes('MAP') && !currentQ.type?.includes('TRUE') && (
          <div className="mb-8 rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
              <img src={currentQ.imageUrl} className="w-full max-h-80 object-contain mx-auto" alt="Question"/>
          </div>
       )}
       <div className="mb-10">{renderQuestionContent(currentQ, currentIndex)}</div>
       <div className="flex justify-between items-center pt-6 border-t border-slate-100">
          {currentIndex > 0 ? (
            <button onClick={handlePrev} className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all">
                <ChevronLeft size={20}/> Πίσω
            </button>
          ) : <div/>}
          {showMainFooterButton && (
              <button 
                onClick={handleMainAction}
                disabled={isMainButtonDisabled()}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 {getMainButtonText()} 
                 {getMainButtonText() !== 'Έλεγχος' && <ChevronRight size={20}/>}
              </button>
          )}
       </div>
    </div>
  );
}