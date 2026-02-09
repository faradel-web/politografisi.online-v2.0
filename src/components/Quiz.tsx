"use client";

import { useState, useEffect } from "react";
import { 
  Check, X, ChevronRight, ChevronLeft, 
  MapPin, CheckCircle2, RotateCcw, ListChecks, Undo2 
} from "lucide-react";
import GreeceMap, { MapMarker } from "./GreeceMap"; 

// --- ТИПІЗАЦІЯ ---
export interface Question {
  id?: string;
  type?: string; 
  question?: string; 
  imageUrl?: string;
  
  // Single/Multi
  options?: string[];
  correctAnswerIndex?: number;
  correctIndices?: number[];

  // Matching
  pairs?: {left: string, right: string, leftImg?: string, rightImg?: string}[];

  // Fill Gap
  textParts?: string[]; 
  wordBank?: string[]; 
  inlineChoices?: Record<string, string[]>; 
  correctAnswers?: Record<string, string> | any;

  // True/False
  items?: {id?: string, text?: string, imageUrl?: string, isTrue: boolean}[];
  statement?: string;
  isTrue?: boolean;

  // Map
  points?: {id?: string, lat: number, lng: number, label: string}[];
  tolerance?: number;

  // Open
  modelAnswer?: string;
}

interface QuizProps {
  questions: Question[];
  onComplete?: (results?: any) => void;
  onAnswerUpdate?: (answers: Record<number, any>) => void;
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

  useEffect(() => {
    if (savedAnswers && Object.keys(savedAnswers).length > 0) {
        setAnswers(savedAnswers);
    }
  }, [savedAnswers]);

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
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    const rightOptions = pairs.map((p) => ({ val: p.right, img: p.rightImg }));

    return (
      <div className="space-y-3">
        {pairs.map((p, pIdx) => {
           const userVal = userMap[pIdx];
           const isCorrect = userVal === p.right;
           let style = "bg-white border-slate-200";
           if (isQChecked && userVal) style = isCorrect ? "bg-emerald-50 border-emerald-300" : "bg-red-50 border-red-300";
           const isLeftImage = typeof p.left === 'string' && (p.left.startsWith('http') || p.left.startsWith('/'));

           return (
             <div key={pIdx} className={`p-4 rounded-xl border-2 flex flex-col md:flex-row md:items-center justify-between gap-4 ${style}`}>
                <div className="flex items-center gap-4 flex-1 overflow-hidden">
                   <span className="w-8 h-8 shrink-0 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-black border border-slate-200">{pIdx+1}</span>
                   {p.leftImg ? <img src={p.leftImg} className="w-24 h-24 rounded-lg object-cover border bg-white" alt=""/> : 
                    isLeftImage ? <img src={p.left} className="w-32 h-24 rounded-lg object-cover border bg-white" alt=""/> : 
                    <span className="font-bold text-slate-800 leading-snug">{p.left}</span>}
                </div>
                <div className="w-full md:w-1/2">
                    <select 
                      value={userVal || ""}
                      onChange={(e) => handleSelect(idx, {...userMap, [pIdx]: e.target.value})}
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
               let style = "border-slate-200 focus:border-blue-500 focus:bg-white bg-slate-50";
               if (isQChecked) {
                  const correctVal = q.correctAnswers ? (q.correctAnswers[partIdx] || q.correctAnswers[String(partIdx)]) : "";
                  const isCorrect = String(userVal).trim().toLowerCase() === String(correctVal).trim().toLowerCase();
                  style = isCorrect ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-red-500 bg-red-50 text-red-900";
               }

               return (
                 <div key={partIdx} className="p-5 bg-white border-2 border-slate-100 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center shadow-sm">
                    <p className="font-serif text-lg leading-relaxed text-slate-800 flex-1">
                        {text.includes('(') ? text : <><span className="font-sans font-bold text-slate-400 mr-2">{partIdx+1}.</span>{text}</>}
                    </p>
                    <div className="w-full md:w-auto min-w-[200px]">
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
                           <input type="text" value={userVal} onChange={(e) => handleSelect(idx, {...userMap, [partIdx]: e.target.value})} disabled={isQChecked} className={`w-full p-3 rounded-xl border-2 font-bold outline-none ${style}`} placeholder="Γράψτε εδώ..." />
                        )}
                    </div>
                 </div>
               )
            })}
         </div>
      </div>
    );
  };

  // --- 🔥 RENDER MAP (З ЛОГІКОЮ ПЕРЕВІРКИ ТА КОЛЬОРІВ) ---
  const renderMap = (q: Question, idx: number) => {
     // Відповідь студента: масив точок
     const userPlacedPoints = (answers[idx] as {lat:number, lng:number}[]) || [];
     const requiredPoints = q.points || [];
     const isQChecked = isChecked(idx);
 
     // Логіка кроків
     const currentStepIndex = userPlacedPoints.length;
     const isFinished = currentStepIndex >= requiredPoints.length;
     const currentTarget = !isFinished ? requiredPoints[currentStepIndex] : null;
 
     // ОБРОБНИК КЛІКУ
     const handleMapClick = (coords: {lat: number, lng: number}) => {
         if (isFinished || isQChecked) return;
         const newAnswerArray = [...userPlacedPoints, coords];
         handleSelect(idx, newAnswerArray);
     };
 
     // СКИДАННЯ
     const handleResetMap = () => {
         if (isQChecked) return;
         handleSelect(idx, []); 
     };
 
     // --- ФОРМУВАННЯ МАРКЕРІВ ---
     const markersToRender: MapMarker[] = [];
 
     // 1. ТОЧКИ СТУДЕНТА (Сині під час вибору, Зелені/Червоні після перевірки)
     userPlacedPoints.forEach((userPt, i) => {
         const targetPt = requiredPoints[i]; 
         if (!targetPt) return;
 
         let label: string | undefined = `${i + 1}. ${targetPt.label}`; // За замовчуванням: "1. Назва"
         let color: 'red' | 'green' | 'blue' = 'blue'; // Синій поки не перевірили
 
         if (isQChecked) {
             const tolerance = q.tolerance || 30;
             const dist = Math.sqrt(Math.pow(userPt.lat - targetPt.lat, 2) + Math.pow(userPt.lng - targetPt.lng, 2));
             const isCorrect = dist <= tolerance;
             
             if (isCorrect) {
                 color = 'green';
                 label = `✅ ${targetPt.label}`; // Вірно -> показуємо назву з галочкою
             } else {
                 color = 'red';
                 label = undefined; // НЕВІРНО -> ПРИБИРАЄМО НАЗВУ (Тільки червона крапка)
             }
         }
 
         markersToRender.push({
             lat: userPt.lat,
             lng: userPt.lng,
             label: label, 
             color: color // Передаємо колір
         });
     });
 
     // 2. "ПРИВИДИ" ПРАВИЛЬНИХ ВІДПОВІДЕЙ (Якщо помилився)
     if (isQChecked) {
         requiredPoints.forEach((targetPt, i) => {
             const userPt = userPlacedPoints[i];
             if (userPt) {
                 const tolerance = q.tolerance || 30;
                 const dist = Math.sqrt(Math.pow(userPt.lat - targetPt.lat, 2) + Math.pow(userPt.lng - targetPt.lng, 2));
                 
                 // Якщо студент помилився - малюємо правильне місце зеленим
                 if (dist > tolerance) {
                      markersToRender.push({
                          lat: targetPt.lat,
                          lng: targetPt.lng,
                          label: `(Σωστό: ${targetPt.label})`, // "Правильно: Назва"
                          color: 'green'
                      });
                 }
             }
         });
     }
 
     return (
       <div className="w-full flex flex-col gap-6">
         
         <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
             <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Σημεία προς εύρεση (Точки):</h4>
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
 
             {!isQChecked && !isFinished && currentTarget && (
                 <div className="flex items-center gap-4 p-4 bg-blue-50 text-blue-900 rounded-xl border border-blue-100 shadow-sm">
                     <div className="bg-white p-2 rounded-full shadow-sm">
                          <MapPin className="animate-bounce w-6 h-6 text-blue-600"/>
                     </div>
                     <div>
                         <p className="text-xs uppercase font-bold text-blue-400 mb-1">Τρέχον βήμα (Зараз шукаємо):</p>
                         <p className="font-black text-xl leading-none">
                             {currentTarget.label}
                         </p>
                     </div>
                 </div>
             )}
             
             {!isQChecked && userPlacedPoints.length > 0 && (
                 <button onClick={handleResetMap} className="text-xs font-bold text-slate-500 hover:text-red-500 flex items-center gap-1 transition-colors">
                     <Undo2 size={14}/> Επαναφορά (Почати спочатку)
                 </button>
             )}
         </div>
 
         <div className="w-full h-[500px] rounded-2xl overflow-hidden relative shadow-inner border-2 border-slate-200 bg-slate-100">
            <GreeceMap 
               markers={markersToRender}
               onSelect={isFinished || isQChecked ? undefined : handleMapClick}
            />
         </div>
 
         {isQChecked && (
           <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="font-bold text-slate-700 mb-2">Αποτελέσματα:</p>
              <ul className="space-y-2 text-sm">
                 {requiredPoints.map((targetPt, i) => {
                     const userPt = userPlacedPoints[i];
                     if (!userPt) return <li key={i} className="text-red-500 font-bold">❌ {targetPt.label} - Δεν απαντήθηκε</li>;
                     
                     const tolerance = q.tolerance || 30;
                     const dist = Math.sqrt(Math.pow(userPt.lat - targetPt.lat, 2) + Math.pow(userPt.lng - targetPt.lng, 2));
                     const isCorrect = dist <= tolerance;
 
                     return (
                         <li key={i} className={`flex items-center gap-2 font-bold ${isCorrect ? "text-emerald-600" : "text-red-600"}`}>
                             {isCorrect ? <CheckCircle2 size={18}/> : <X size={18}/>}
                             <span>{i+1}. {targetPt.label}</span>
                             {!isCorrect && <span className="text-xs font-normal opacity-70">(Λάθος τοποθεσία)</span>}
                         </li>
                     );
                 })}
              </ul>
           </div>
         )}
       </div>
     );
   };
  
  const renderOpen = (q: Question, idx: number) => (
     <textarea 
        value={answers[idx] || ""}
        onChange={(e) => handleSelect(idx, e.target.value)}
        disabled={isChecked(idx)}
        className="w-full h-40 p-4 rounded-xl border-2 border-slate-200 outline-none focus:border-purple-400 font-medium"
        placeholder="Η απάντησή σας..."
     />
  );

  const renderQuestionContent = (q: Question, idx: number) => {
      const qType = (q.type || 'SINGLE').toUpperCase();
      if (qType.includes('SINGLE') || qType.includes('MULTI')) return renderChoice(q, idx);
      if (qType.includes('TRUE')) return renderTrueFalse(q, idx);
      if (qType.includes('MATCH')) return renderMatching(q, idx);
      if (qType.includes('FILL') || qType === 'INLINE-CHOICE') return renderFillGap(q, idx);
      if (qType.includes('MAP')) return renderMap(q, idx);
      if (qType.includes('OPEN')) return renderOpen(q, idx);
      return <div>Unknown type</div>;
  };

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

       <div className="mb-10">
          {renderQuestionContent(currentQ, currentIndex)}
       </div>

       <div className="flex justify-between items-center pt-6 border-t border-slate-100">
          {currentIndex > 0 ? (
            <button onClick={handlePrev} className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all">
                <ChevronLeft size={20}/> Πίσω
            </button>
          ) : <div/>}

          {!hideSubmit && (
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