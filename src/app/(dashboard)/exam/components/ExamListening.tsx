"use client";

import { useState } from "react";
import { Headphones, CheckCircle2, Save, AlignLeft, ListChecks } from "lucide-react";
import Quiz, { Question } from "@/components/shared/Quiz";

// --- ІНТЕРФЕЙСИ ---
interface ExamListeningProps {
  data: { data: any; partA: Question[]; partB: Question[] };
  answers: any;
  setAnswers: any;
}

type MobileView = 'content' | 'questions';

export default function ExamListening({ data, answers, setAnswers }: ExamListeningProps) {
  const [mobileView, setMobileView] = useState<MobileView>('content');
  const lesson = data;

  if (!lesson || !lesson.data) return null;

  // --- Вкладки για мобільних пристроїв ---
  const MobileTabs = () => (
      <div className="lg:hidden flex border-b border-slate-200 mb-6 bg-white z-30 shadow-sm rounded-2xl overflow-hidden">
          <button 
             onClick={() => setMobileView('content')}
             className={`flex-1 py-4 text-sm font-black uppercase tracking-wide flex items-center justify-center gap-2 border-b-2 transition-colors ${mobileView === 'content' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
              <AlignLeft size={18}/> Ηχητικό
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
         
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-auto lg:h-[calc(100vh-100px)]">
              
              {/* ЛІВА ЧАСТИНА: АУДІОПЛЕЄР */}
              <div className={`lg:col-span-1 h-full flex flex-col gap-4 ${mobileView === 'content' ? 'block' : 'hidden'} lg:flex`}>
                  <div className="bg-purple-50 p-6 sm:p-8 rounded-[2.5rem] border border-purple-100 text-center lg:sticky lg:top-0 shadow-sm">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg text-purple-600">
                          <Headphones size={36}/>
                      </div>
                      <h3 className="text-xl font-black text-purple-900 mb-2 leading-tight">
                          {lesson.data.title || "Ακουστικό Απόσπασμα"}
                      </h3>
                      <p className="text-sm font-bold text-purple-600/70 uppercase tracking-widest mb-8">
                          Listening Exercise
                      </p>
                      
                      {lesson.data.audioUrl ? (
                          <audio 
                              controls 
                              src={lesson.data.audioUrl} 
                              className="w-full h-12 accent-purple-600 bg-white rounded-full shadow-sm"
                          />
                      ) : (
                          <div className="p-4 bg-white/50 rounded-xl text-purple-800 text-sm font-bold border border-purple-200">
                              Το ηχητικό αρχείο δεν βρέθηκε.
                          </div>
                      )}
                  </div>
              </div>

              {/* ПРАВА ЧАСТИНА: ПИТАННЯ */}
              <div className={`lg:col-span-2 lg:overflow-y-auto custom-scrollbar pr-2 pb-10 space-y-12 ${mobileView === 'questions' ? 'block' : 'hidden'} lg:block`}>
                  
                  {/* Part A */}
                  {lesson.partA?.length > 0 && (
                      <div className="space-y-4">
                          <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded-xl font-black uppercase tracking-widest text-sm inline-block shadow-sm">
                              Μέρος Α
                          </div>
                          <Quiz 
                              questions={lesson.partA} 
                              layout="list" 
                              mode="exam" 
                              hideSubmit={true} 
                              savedAnswers={answers.listeningA} 
                              onAnswerUpdate={(ans) => setAnswers((prev: any) => ({...prev, listeningA: ans, listeningConfirmed: false}))} 
                          />
                      </div>
                  )}

                  {/* Part B */}
                  {lesson.partB?.length > 0 && (
                      <div className="space-y-4 border-t-2 border-slate-100 pt-8">
                          <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded-xl font-black uppercase tracking-widest text-sm inline-block shadow-sm">
                              Μέρος Β
                          </div>
                          <Quiz 
                              questions={lesson.partB} 
                              layout="list" 
                              mode="exam" 
                              hideSubmit={true} 
                              savedAnswers={answers.listeningB} 
                              onAnswerUpdate={(ans) => setAnswers((prev: any) => ({...prev, listeningB: ans, listeningConfirmed: false}))} 
                          />
                      </div>
                  )}
                  
                  {/* 🔥 ВИПРАВЛЕНА КНОПКА ЗБЕРЕЖЕННЯ 🔥 */}
                  <div className="mt-8">
                      <button 
                          onClick={() => setAnswers((prev: any) => ({...prev, listeningConfirmed: true}))} 
                          className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-2 ${answers.listeningConfirmed ? 'bg-emerald-500 text-white cursor-default' : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.01]'}`}
                      >
                          {answers.listeningConfirmed ? <><CheckCircle2/> Αποθηκεύτηκε</> : <><Save/> Αποθήκευση Ενότητας</>}
                      </button>
                  </div>
              </div>
         </div>
      </>
  );
}