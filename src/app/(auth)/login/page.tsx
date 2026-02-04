"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Loader2, AlertCircle, CheckCircle, KeyRound } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "@/lib/firebase"; // Потрібен доступ до auth та db
import { collection, query, where, getDocs } from "firebase/firestore";

export default function LoginPage() {
  const { loginWithGoogle, loginWithEmailOrPhone } = useAuth();
  const router = useRouter();

  // --- STATES ---
  const [view, setView] = useState<'login' | 'reset'>('login'); // Перемикач режимів

  // Login States
  const [identifier, setIdentifier] = useState(""); 
  const [password, setPassword] = useState("");
  
  // Reset States
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resetMessage, setResetMessage] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --- LOGIN HANDLER ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginWithEmailOrPhone(identifier, password);
      // Успішний вхід перенаправить через auth-context або middleware
    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === 'auth/invalid-credential' || err.message.includes('not found')) {
        setError("Λανθασμένο email/τηλέφωνο ή κωδικός.");
      } else {
        setError("Παρουσιάστηκε σφάλμα κατά τη σύνδεση.");
      }
      setLoading(false);
    }
  };

  // --- RESET PASSWORD HANDLER ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus('loading');
    setResetMessage("");

    try {
      let emailToSend = resetIdentifier.trim();

      // 1. Якщо введено ТЕЛЕФОН (немає @), шукаємо email в базі
      if (!emailToSend.includes('@')) {
         const q = query(collection(db, "users"), where("phoneNumber", "==", emailToSend));
         const querySnapshot = await getDocs(q);

         if (querySnapshot.empty) {
             throw new Error("Ο αριθμός δεν βρέθηκε (Номер не знайдено)");
         }
         // Отримуємо email знайденого користувача
         emailToSend = querySnapshot.docs[0].data().email;
      }

      // 2. Відправляємо запит Firebase на цей email
      await sendPasswordResetEmail(auth, emailToSend);
      
      setResetStatus('success');
      setResetMessage(`Οι οδηγίες στάλθηκαν στο ${emailToSend}. Ελέγξτε τα εισερχόμενά σας (και τα spam).`);
      
    } catch (err: any) {
        console.error(err);
        setResetStatus('error');
        if (err.message.includes("δεν βρέθηκε") || err.code === 'auth/user-not-found') {
            setResetMessage("Δεν βρέθηκε λογαριασμός με αυτά τα στοιχεία.");
        } else if (err.code === 'auth/invalid-email') {
            setResetMessage("Μη έγκυρη μορφή email.");
        } else {
            setResetMessage("Σφάλμα αποστολής. Δοκιμάστε ξανά.");
        }
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white font-sans text-slate-900">
      
      {/* === MOBILE HEADER === */}
      <div className="lg:hidden bg-blue-900 p-6 pb-12 rounded-b-[2.5rem] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-800 to-slate-900 opacity-50 z-0"></div>
          <div className="relative z-10 flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors text-sm font-bold w-fit">
               <ArrowLeft className="w-4 h-4" /> Πίσω
            </Link>
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center font-bold text-xl border border-white/10 text-white">
                 P
               </div>
               <span className="font-montserrat font-bold text-lg text-white tracking-wide">
                 POLITOGRAFISI.GR
               </span>
            </div>
            <h2 className="text-2xl font-bold font-montserrat text-white leading-tight pr-4">
               Καλώς ήρθατε.
            </h2>
          </div>
      </div>

      {/* === DESKTOP LEFT SIDE === */}
      <div className="hidden lg:flex w-1/2 bg-blue-900 relative flex-col justify-between p-12 text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-800 to-slate-900 opacity-50 z-0"></div>
          
          <div className="relative z-10 flex items-center gap-3">
             <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center font-bold text-xl border border-white/10">
               P
             </div>
             <span className="font-montserrat font-bold text-xl tracking-wide text-white">
               POLITOGRAFISI.GR
             </span>
          </div>

          <div className="relative z-10 max-w-md">
              <h2 className="font-montserrat text-4xl font-bold leading-tight mb-6 text-white">
                  Καλώς ήρθατε στην πλατφόρμα επιτυχίας.
              </h2>
              <p className="text-blue-200 text-lg leading-relaxed font-medium">
                  "Η προετοιμασία είναι το κλειδί για την αυτοπεποίθηση."
              </p>
          </div>

          <div className="relative z-10 text-sm text-blue-300 font-medium">
              © 2026 Politografisi Online
          </div>
      </div>

      {/* === RIGHT SIDE (FORM AREA) === */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 lg:px-24 relative -mt-6 lg:mt-0 z-20">
        
        <div className="hidden lg:block absolute top-8 left-8 lg:static lg:mb-10 lg:mt-0">
          <Link 
            href="/" 
            className="group flex items-center gap-2 text-slate-400 hover:text-blue-700 transition-colors font-bold text-sm"
          >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> 
              Επιστροφή
          </Link>
        </div>

        <div className="w-full max-w-sm mx-auto bg-white rounded-3xl p-8 lg:p-0 shadow-xl shadow-slate-200/50 lg:shadow-none border border-slate-100 lg:border-none">
            
            {/* --- VIEW: LOGIN FORM --- */}
            {view === 'login' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="mb-8">
                        <h1 className="font-montserrat text-2xl lg:text-3xl font-bold text-slate-900 mb-2">Σύνδεση</h1>
                        <p className="text-slate-500 text-sm lg:text-base">
                            Εισάγετε τα στοιχεία σας για να συνεχίσετε.
                        </p>
                    </div>

                    <button 
                        onClick={loginWithGoogle}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-slate-700 font-bold py-3 px-6 rounded-xl transition-all duration-200 mb-6"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span className="font-montserrat text-sm font-bold">Σύνδεση με Google</span>
                    </button>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-slate-400 font-bold">ή με Email / Τηλέφωνο</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 animate-in shake">
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wide ml-1">Email ή Τηλέφωνο</label>
                            <input
                                type="text"
                                required
                                className="block w-full rounded-xl border-2 border-slate-100 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                                placeholder="email@example.com ή 69XXXXXXXX"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-xs font-bold text-slate-900 uppercase tracking-wide">Κωδικός</label>
                                <button 
                                    type="button"
                                    onClick={() => setView('reset')} 
                                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                                >
                                    Ξεχάσατε τον κωδικό;
                                </button>
                            </div>
                            <input
                                type="password"
                                required
                                className="block w-full rounded-xl border-2 border-slate-100 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 flex items-center justify-center gap-2 bg-slate-900 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-70"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5"/> : "Σύνδεση"}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-slate-500 mb-3">Δεν έχετε λογαριασμό;</p>
                        <Link href="/register" className="text-blue-600 font-bold hover:underline font-montserrat">
                            Δημιουργία Λογαριασμού
                        </Link>
                    </div>
                </div>
            )}

            {/* --- VIEW: RESET PASSWORD FORM --- */}
            {view === 'reset' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <button 
                        onClick={() => setView('login')}
                        className="flex items-center gap-2 text-slate-400 hover:text-slate-900 text-sm font-bold mb-6 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4"/> Επιστροφή στη Σύνδεση
                    </button>

                    <div className="mb-6">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                            <KeyRound className="h-6 w-6"/>
                        </div>
                        <h1 className="font-montserrat text-2xl font-bold text-slate-900 mb-2">Ανάκτηση Κωδικού</h1>
                        <p className="text-slate-500 text-sm">
                            Εισάγετε το <strong>Email</strong> ή το <strong>Τηλέφωνό</strong> σας. Θα σας στείλουμε έναν σύνδεσμο για να ορίσετε νέο κωδικό.
                        </p>
                    </div>

                    <form onSubmit={handleResetPassword} className="space-y-4">
                        {resetStatus === 'success' && (
                             <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 border border-emerald-100">
                                <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                <span className="font-medium">{resetMessage}</span>
                            </div>
                        )}

                        {resetStatus === 'error' && (
                             <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">
                                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                <span className="font-medium">{resetMessage}</span>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wide ml-1">Email ή Τηλέφωνο</label>
                            <input
                                type="text"
                                required
                                className="block w-full rounded-xl border-2 border-slate-100 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                                placeholder="π.χ. 69XXXXXXXX ή mail@example.com"
                                value={resetIdentifier}
                                onChange={(e) => setResetIdentifier(e.target.value)}
                                disabled={resetStatus === 'loading' || resetStatus === 'success'}
                            />
                        </div>

                        {resetStatus !== 'success' && (
                            <button
                                type="submit"
                                disabled={resetStatus === 'loading'}
                                className="w-full mt-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-blue-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-70"
                            >
                                {resetStatus === 'loading' ? <Loader2 className="animate-spin h-5 w-5"/> : "Αποστολή Συνδέσμου"}
                            </button>
                        )}
                        
                        {resetStatus === 'success' && (
                            <button
                                type="button"
                                onClick={() => setView('login')}
                                className="w-full mt-2 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-4 px-6 rounded-xl transition-all"
                            >
                                Επιστροφή στη Σύνδεση
                            </button>
                        )}
                    </form>
                </div>
            )}

            <div className="mt-10 lg:mt-12 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                <ShieldCheck className="h-4 w-4"/> Ασφαλής Σύνδεση SSL
            </div>
        </div>
        
        <div className="h-8 lg:hidden"></div> 
      </div>
    </div>
  );
}