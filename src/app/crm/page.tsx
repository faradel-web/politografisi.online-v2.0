"use client";

import { useState, useEffect } from "react";
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { auth } from "@/lib/firebase"; 
import { useRouter } from "next/navigation";
import { ShieldCheck, Mail, Loader2, ArrowRight, AlertCircle } from "lucide-react";

export default function CrmLoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  // 1. ПЕРЕВІРКА: Чи повернувся користувач з пошти? (Обробка Magic Link)
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      setStatus('loading');
      let emailForSignIn = window.localStorage.getItem('emailForSignIn');
      
      if (!emailForSignIn) {
        emailForSignIn = window.prompt('Παρακαλώ επιβεβαιώστε το email σας για είσοδο (Будь ласка, підтвердіть email):');
      }

      if (emailForSignIn) {
        signInWithEmailLink(auth, emailForSignIn, window.location.href)
          .then(() => {
            window.localStorage.removeItem('emailForSignIn');
            setStatus('success');
            // ✅ Успішний вхід -> переходимо до таблиці
            router.push('/leads'); 
          })
          .catch((error) => {
            console.error(error);
            setStatus('error');
            setErrorMessage(error.message);
          });
      }
    }
  }, [router]);

  // 2. ФУНКЦІЯ: Відправка листа
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage("");

    const actionCodeSettings = {
      // URL, куди повернеться користувач.
      // window.location.href динамічно бере поточний домен (crm.localhost або crm.politografisi.online)
      url: window.location.href, 
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setStatus('sent');
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      
      if (error.code === 'auth/unauthorized-continue-uri') {
        setErrorMessage("Firebase Error: Domain not allowed. Add domain to Firebase Console.");
      } else {
        setErrorMessage(error.message);
      }
    }
  };

  // --- UI ---

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600 h-10 w-10"/></div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      
      {/* Логотип */}
      <div className="mb-8 p-4 bg-white rounded-full shadow-xl shadow-slate-200/50">
        <ShieldCheck className="h-12 w-12 text-slate-700" strokeWidth={1.5} />
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-white">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 mb-2 font-serif">CRM Login</h1>
          <p className="text-slate-500 font-medium text-sm">
            Για λόγους ασφαλείας, απαιτείται επαλήθευση email για πρόσβαση στη βάση δεδομένων.
          </p>
        </div>

        {/* Статус: Лист відправлено */}
        {status === 'sent' ? (
          <div className="bg-green-50 text-green-800 p-4 rounded-xl flex items-start gap-3 border border-green-100 animate-in fade-in slide-in-from-bottom-2">
             <div className="bg-green-100 p-1 rounded-full"><ShieldCheck size={16}/></div>
             <div>
               <p className="font-bold text-sm">Σύνδεσμος εστάλη!</p>
               <p className="text-xs mt-1 opacity-80">Ελέγξτε τα εισερχόμενα (και τα Spam) στο {email}. Κάντε κλικ στο link για είσοδο.</p>
             </div>
          </div>
        ) : (
          /* Форма входу */
          <form onSubmit={handleLogin} className="space-y-4">
            
            {status === 'error' && (
               <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
                 <AlertCircle size={16}/> {errorMessage}
               </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                Email Διαχειριστή
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20}/>
                <input 
                  type="email" 
                  required
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 pl-12 pr-4 font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:font-normal"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-slate-900/20 active:scale-[0.98]"
            >
              <span>Αποστολή Συνδέσμου</span>
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18}/>
            </button>
          </form>
        )}
      </div>

      <div className="mt-8 text-center">
         <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2 justify-center">
           <ShieldCheck size={12}/> Secure Double-Gate Access
         </p>
      </div>
    </div>
  );
}