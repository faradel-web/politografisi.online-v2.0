"use client";

import { useState } from "react";
import { Mic, CheckCircle2, Trash2, Save } from "lucide-react";
import AudioRecorder from "@/components/shared/AudioRecorder";

// --- ІНТЕРФЕЙСИ ---
interface ExamSpeakingProps {
  data: { lesson0: any; lessonRandom: any };
  answers: any;
  setAnswers: any;
}

export default function ExamSpeaking({ data, answers, setAnswers }: ExamSpeakingProps) {
  const { lesson0, lessonRandom } = data || {};
  
  // Локальний стейт для візуальної кнопки "Αποθήκευση розділ"
  const [sectionSaved, setSectionSaved] = useState(false);

  if (!lesson0) return null;

  // Масив з двома завданнями για рендеру
  const speakingTasks = [
      { l: lesson0, k: 'speakingUrl0', t: 'Task 1: General' },
      { l: lessonRandom, k: 'speakingUrlRandom', t: 'Task 2: Topic' }
  ];

  return (
      <div className="flex flex-col space-y-8 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {speakingTasks.map((item, idx) => (
                  <div key={idx} className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
                      
                      {/* Τίτλος завдання */}
                      <div className="flex items-center gap-2 mb-6 text-emerald-600">
                          <Mic size={24}/>
                          <h2 className="font-black uppercase text-sm">{item.t}</h2>
                      </div>
                      
                      <h3 className="text-xl font-black text-slate-900 mb-4">
                          {item.l?.title || "Προφορική Εξέταση"}
                      </h3>
                      
                      <div className="prose text-slate-600 mb-8 whitespace-pre-wrap flex-1 leading-relaxed">
                          {item.l?.prompt || "Παρακαλώ απαντήστε στην ερώτηση..."}
                      </div>
                      
                      {/* 🔥 ВИПРАВЛЕНО: Відображення всіх зображень (1 або більше) 🔥 */}
                      {item.l?.imageUrls && item.l.imageUrls.length > 0 && (
                          <div className={`grid gap-4 mb-6 ${item.l.imageUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                              {item.l.imageUrls.map((url: string, i: number) => (
                                  <img 
                                      key={i} 
                                      src={url} 
                                      className="w-full h-48 object-cover rounded-xl border border-slate-100 shadow-sm bg-slate-50" 
                                      alt={`Speaking Task Prompt ${i + 1}`}
                                  />
                              ))}
                          </div>
                      )}
                      
                      {/* Блок запису аудіо */}
                      <div className="bg-emerald-50 p-6 rounded-[2rem] text-center mt-auto border border-emerald-100 relative">
                          {answers[item.k] ? (
                              <div className="flex flex-col items-center gap-4">
                                  <div className="text-emerald-600 font-bold flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                                      <CheckCircle2 size={18}/> Αποθηκεύτηκε
                                  </div>
                                  
                                  <audio controls src={answers[item.k] as string} className="w-full h-10 accent-emerald-600"/>
                                  
                                  <button 
                                      onClick={() => setAnswers((prev: any) => ({...prev, [item.k]: null}))} 
                                      className="text-red-500 text-xs font-bold flex items-center gap-2 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors"
                                  >
                                      <Trash2 size={14}/> Διαγραφή & Επανάληψη
                                  </button>
                              </div>
                          ) : (
                              <div className="flex flex-col items-center">
                                  <div className="mb-4 text-emerald-800 font-bold text-sm">
                                      Πατήστε το μικρόφωνο για ηχογράφηση
                                  </div>
                                  <AudioRecorder 
                                      onUploadComplete={(url) => setAnswers((prev: any) => ({...prev, [item.k]: url}))} 
                                  />
                              </div>
                          )}
                      </div>

                  </div>
              ))}
          </div>

          {/* Кнопка збереження розділу */}
          <div className="mt-4">
              <button 
                  onClick={() => setSectionSaved(true)} 
                  className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-2 ${sectionSaved ? 'bg-emerald-500 text-white cursor-default' : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.01]'}`}
              >
                  {sectionSaved ? <><CheckCircle2/> Αποθηκεύτηκε</> : <><Save/> Αποθήκευση Ενότητας</>}
              </button>
          </div>
      </div>
  );
}