"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation"; 
import { 
  Loader2, Clock, LayoutGrid, BookOpen, Headphones, Mic, 
  ChevronRight, ShieldCheck, AlertCircle, BrainCircuit
} from "lucide-react";
import { USER_ROLES, GUEST_LIMITS } from "@/lib/constants";

export default function ExamWelcomePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Перевірка доступів (чи може користувач почати екзамен)
  useEffect(() => {
    async function checkEligibility() {
      if (!user) return;
      if ((user as any).role !== USER_ROLES.GUEST) {
        setCheckingAccess(false);
        return;
      }
      try {
        const q = query(collection(db, "exam_results"), where("userId", "==", user.uid));
        const snap = await getDocs(q);
        if (snap.size >= GUEST_LIMITS.EXAM_ATTEMPTS) {
            setAccessDenied(true);
        }
      } catch (error) { 
          console.error(error); 
      } finally { 
          setCheckingAccess(false); 
      }
    }
    checkEligibility();
  }, [user]);

  if (checkingAccess) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <Loader2 className="animate-spin text-blue-600 h-10 w-10"/>
          </div>
      );
  }

  if (accessDenied) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center text-red-500 font-bold bg-slate-50 p-6 text-center">
              <ShieldCheck size={48} className="mb-4 opacity-50"/>
              <h2 className="text-2xl font-black mb-2">Όριο Εξετάσεων</h2>
              <p className="text-slate-600 font-medium">Έχετε φτάσει το όριο των δωρεάν προσπαθειών. Αναβαθμίστε σε Premium.</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 flex items-center justify-center font-sans">
        <div className="bg-white max-w-4xl w-full p-8 sm:p-12 rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col md:flex-row gap-12">
            
            {/* LEFT: INFO */}
            <div className="flex-1 space-y-8">
                <div>
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 shadow-sm">
                        <ShieldCheck size={32}/>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2 leading-tight">Προσομοίωση Εξέτασης</h1>
                    <p className="text-slate-500 font-medium">Πλήρης προσομοίωση για την πιστοποίηση ελληνομάθειας.</p>
                </div>

                <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
                        <Clock className="text-blue-600 shrink-0 mt-1" size={20}/>
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm">Διάρκεια: 3 Ώρες</h4>
                            <p className="text-xs text-slate-500">Ο χρόνος μετράει αντίστροφα μόλις πατήσετε "Έναρξη".</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
                        <BrainCircuit className="text-purple-600 shrink-0 mt-1" size={20}/>
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm">AI Αξιολόγηση</h4>
                            <p className="text-xs text-slate-500">Άμεση βαθμολόγηση Έκθεσης & Προφορικών από το Gemini AI.</p>
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                        <AlertCircle size={16}/> Σημαντικές Οδηγίες:
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-600 font-medium">
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"/> Χρησιμοποιήστε ακουστικά για την Ακρόαση.</li>
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"/> Ελέγξτε το μικρόφωνό σας για τα Προφορικά.</li>
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"/> Μην κλείσετε τον browser κατά τη διάρκεια.</li>
                    </ul>
                </div>
            </div>

            {/* RIGHT: STRUCTURE */}
            <div className="flex-1 bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
                
                <div>
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><LayoutGrid size={20}/> Δομή Εξέτασης</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-300"><LayoutGrid size={18}/></div>
                            <div>
                                <div className="font-bold text-sm">Θεωρία</div>
                                <div className="text-[10px] text-slate-400">20 Ερωτήσεις • Ιστορία, Πολιτική, Γεωγραφία</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-300"><BookOpen size={18}/></div>
                            <div>
                                <div className="font-bold text-sm">Ανάγνωση & Γραφή</div>
                                <div className="text-[10px] text-slate-400">Κατανόηση Κειμένου + Έκθεση</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-300"><Headphones size={18}/></div>
                            <div>
                                <div className="font-bold text-sm">Ακρόαση</div>
                                <div className="text-[10px] text-slate-400">Ακουστικά αποσπάσματα & Ερωτήσεις</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="p-2 bg-orange-500/20 rounded-lg text-orange-300"><Mic size={18}/></div>
                            <div>
                                <div className="font-bold text-sm">Παραγωγή Λόγου</div>
                                <div className="text-[10px] text-slate-400">Ηχογράφηση απαντήσεων</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🔥 КНОПКА ПЕРЕХОДУ ДО СЕСІЇ */}
                <button 
                    onClick={() => router.push('/exam/session')} 
                    className="w-full py-4 mt-8 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-lg shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                    Έναρξη Εξέτασης <ChevronRight/>
                </button>
            </div>
        </div>
    </div>
  );
}