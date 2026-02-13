"use client";

import { useState, useEffect, memo } from "react";
import { BookOpen, PenTool, CheckCircle2, Save, AlignLeft, ListChecks } from "lucide-react";
import Quiz, { Question } from "@/components/Quiz";

// --- ОПТИМІЗОВАНИЙ РЕДАКТОР ЕСЕ ---
// Тримає текст локально, оновлює глобальний стейт тільки при втраті фокусу (onBlur)
const EssayEditor = memo(({ initialValue, onChange, disabled }: { initialValue: string, onChange: (val: string) => void, disabled: boolean }) => {
    const [value, setValue] = useState(initialValue || "");

    useEffect(() => { setValue(initialValue || ""); }, [initialValue]);

    return (
        <textarea 
            className="w-full h-64 p-4 border-2 border-orange-100 rounded-xl focus:border-orange-300 outline-none resize-none font-medium text-slate-700 text-lg bg-white disabled:opacity-70 disabled:bg-slate-50" 
            placeholder="Γράψτε εδώ την έκθεσή σας..." 
            value={value} 
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => onChange(value)}
            disabled={disabled}
        />
    );
});
EssayEditor.displayName = "EssayEditor";

// --- ІНТЕРФЕЙСИ ---
interface ExamReadingProps {
  data: { data: any; partA: Question[]; partB: Question[] };
  answers: any;
  setAnswers: any;
}

type MobileView = 'content' | 'questions';

export default function ExamReading({ data, answers, setAnswers }: ExamReadingProps) {
  const [mobileView, setMobileView] = useState<MobileView>('content');
  const lesson = data;

  if (!lesson || !lesson.data) return null;

  // --- Вкладки для мобільних пристроїв (без sticky) ---
  const MobileTabs = () => (
      <div className="lg:hidden flex border-b border-slate-200 mb-6 bg-white z-30 shadow-sm rounded-2xl overflow-hidden">
          <button 
             onClick={() => setMobileView('content')}
             className={`flex-1 py-4 text-sm font-black uppercase tracking-wide flex items-center justify-center gap-2 border-b-2 transition-colors ${mobileView === 'content' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
              <AlignLeft size={18}/> Περιεχόμενο
          </button>
          <button 
             onClick={() => setMobileView('questions')}
             className={`flex-1 py-4 text-sm font-black uppercase tracking-wide flex items-center justify-center gap-2 border-b-2 transition-colors ${mobileView === 'questions' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
              <ListChecks size={18}/> Ερωτήσεις
          </button>
      </div>
  );

  return (
      <>
        <MobileTabs />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-auto lg:h-[calc(100vh-100px)]">
            
            {/* ЛІВА ЧАСТИНА: ТЕКСТ (Κείμενο) */}
            <div className={`bg-white rounded-[2.5rem] border border-slate-200 shadow-sm lg:overflow-y-auto custom-scrollbar p-0 lg:p-0 ${mobileView === 'content' ? 'block' : 'hidden'} lg:block`}>
               <div className="p-6 md:p-8">
                   <div className="flex items-center gap-3 mb-6 text-blue-600 border-b border-blue-50 pb-4">
                       <BookOpen size={24}/>
                       <h2 className="font-black uppercase tracking-widest text-sm">Κείμενο</h2>
                   </div>
                   
                   {lesson.data.imageUrls?.[0] && (
                       <img src={lesson.data.imageUrls[0]} className="w-full rounded-2xl mb-6 object-cover h-48 sm:h-64" alt="Reading visual"/>
                   )}
                   
                   <div 
                       className="prose prose-lg prose-slate max-w-none font-serif leading-relaxed whitespace-pre-wrap" 
                       dangerouslySetInnerHTML={{__html: lesson.data.textContent}} 
                   />
               </div>
            </div>

            {/* ПРАВА ЧАСТИНА: ПИТАННЯ (Ερωτήσεις) */}
            <div className={`lg:overflow-y-auto custom-scrollbar pr-2 pb-10 space-y-12 ${mobileView === 'questions' ? 'block' : 'hidden'} lg:block`}>
                
                {/* Part A */}
                {lesson.partA?.length > 0 && (
                    <div className="space-y-4">
                        <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-xl font-black uppercase tracking-widest text-sm inline-block shadow-sm">
                            Μέρος Α: Κατανόηση
                        </div>
                        <Quiz 
                            questions={lesson.partA} 
                            layout="list" 
                            mode="exam" 
                            hideSubmit={true} 
                            savedAnswers={answers.readingA} 
                            onAnswerUpdate={(ans) => setAnswers((prev: any) => ({...prev, readingA: ans, readingConfirmed: false}))} 
                        />
                    </div>
                )}

                {/* Part B */}
                {lesson.partB?.length > 0 && (
                    <div className="space-y-4 border-t-2 border-slate-100 pt-8">
                        <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded-xl font-black uppercase tracking-widest text-sm inline-block shadow-sm">
                            Μέρος Β: Γλώσσα
                        </div>
                        <Quiz 
                            questions={lesson.partB} 
                            layout="list" 
                            mode="exam" 
                            hideSubmit={true} 
                            savedAnswers={answers.readingB} 
                            onAnswerUpdate={(ans) => setAnswers((prev: any) => ({...prev, readingB: ans, readingConfirmed: false}))} 
                        />
                    </div>
                )}

                {/* Part C (Essay) */}
                <div className="space-y-4 border-t-2 border-slate-100 pt-8">
                    <div className="px-4 py-2 bg-orange-100 text-orange-800 rounded-xl font-black uppercase tracking-widest text-sm inline-block shadow-sm">
                        Μέρος Γ (Έκθεση)
                    </div>
                    <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-orange-100 shadow-sm">
                        <h3 className="font-black text-orange-900 mb-4 flex gap-2 items-center text-lg">
                            <PenTool className="text-orange-600"/> Writing Task
                        </h3>
                        <div className="mb-6 text-slate-800 font-medium p-4 bg-orange-50 rounded-xl whitespace-pre-wrap border border-orange-100 leading-relaxed">
                            {lesson.data.parts?.partC?.question || "Θέμα Έκθεσης..."}
                        </div>
                        
                        <EssayEditor 
                            initialValue={answers.essay} 
                            onChange={(val) => setAnswers((prev: any) => ({...prev, essay: val, readingConfirmed: false}))} 
                            disabled={answers.readingConfirmed}
                        />
                    </div>
                </div>
                
                {/* 🔥 ВИПРАВЛЕНА КНОПКА ЗБЕРЕЖЕННЯ 🔥
                    Прибрано sticky bottom-4 z-10, додано mt-8 (margin-top). 
                    Тепер вона акуратно лежить під Есе і не перекриває контент. 
                */}
                <div className="mt-8">
                    <button 
                        onClick={() => setAnswers((prev: any) => ({...prev, readingConfirmed: true}))} 
                        className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-2 ${answers.readingConfirmed ? 'bg-emerald-500 text-white cursor-default' : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.01]'}`}
                    >
                        {answers.readingConfirmed ? <><CheckCircle2/> Αποθηκεύτηκε</> : <><Save/> Αποθήκευση Ενότητας</>}
                    </button>
                </div>

            </div>
        </div>
      </>
  );
}