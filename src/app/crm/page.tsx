"use client";

import { useState, useEffect } from "react";
import { 
  getAuth, 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink 
} from "firebase/auth";
import { app } from "@/lib/firebase"; // Переконайся, що шлях вірний
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldCheck, Loader2, CheckCircle } from "lucide-react";

export default function CrmLoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'verifying' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const auth = getAuth(app);

  // 1. ПЕРЕВІРКА ПРИ ПОВЕРНЕННІ З ПОШТИ
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      setStatus('verifying');
      // Отримуємо email з localStorage (ми його туди збережемо при відправці)
      let emailForSignIn = window.localStorage.getItem('emailForSignIn');
      
      if (!emailForSignIn) {
        // Якщо користувач відкрив посилання на іншому пристрої, запитуємо email знову
        emailForSignIn = window.prompt('Παρακαλώ επιβεβαιώστε το email σας για λόγους ασφαλείας:');
      }

      if (emailForSignIn) {
        signInWithEmailLink(auth, emailForSignIn, window.location.href)
          .then((result) => {
            // Успішний вхід!
            window.localStorage.removeItem('emailForSignIn');
            // Перенаправляємо на таблицю лідів
            router.push('/leads');
          })
          .catch((error) => {
            console.error("Error signing in", error);
            setStatus('error');
            setErrorMessage("Ο σύνδεσμος έληξε ή είναι άκυρος.");
          });
      }
    }
  }, [auth, router]);

  // 2. ВІДПРАВКА ПОСИЛАННЯ
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage("");

    const actionCodeSettings = {
      // URL, куди повернеться користувач. 
      // ВАЖЛИВО: Це має бути адреса CRM
      url: window.location.href, // Поточна сторінка (crm.politografisi.online)
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email); // Зберігаємо email для перевірки
      setStatus('sent');
    } catch (error: any) {
      console.error("Error sending email:", error);
      setStatus('error');
      setErrorMessage(error.message || "Σφάλμα αποστολής. Ελέγξτε το email.");
    }
  };

  // --- UI СТАНИ ---

  if (status === 'verifying') {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh]">
              <Loader2 className="animate-spin h-10 w-10 text-blue-600 mb-4"/>
              <h2 className="text-xl font-bold text-slate-800">Επαλήθευση στοιχείων...</h2>
          </div>
      );
  }

  if (status === 'sent') {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto animate-in fade-in zoom-in">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle size={40}/>
              </div>
              <h1 className="text-2xl font-black text-slate-900 mb-2">Ελέγξτε το email σας</h1>
              <p className="text-slate-600 mb-8">
                  Στείλαμε έναν σύνδεσμο ασφαλείας στο <strong>{email}</strong>. <br/>
                  Πατήστε τον για να εισέλθετε.
              </p>
              <button onClick={() => setStatus('idle')} className="text-sm text-blue-600 font-bold hover:underline">
                  Επιστροφή / Δοκιμάστε ξανά
              </button>
          </div>
      );
  }

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] max-w-md mx-auto">
      <div className="mb-8 p-4 bg-white rounded-full shadow-sm border border-slate-200">
        <Lock className="text-slate-400 h-8 w-8" />
      </div>
      
      <h1 className="text-3xl font-black text-slate-900 mb-2">CRM Login</h1>
      <p className="text-slate-500 mb-8 text-center text-sm">
        Για λόγους ασφαλείας, απαιτείται επαλήθευση email για πρόσβαση στη βάση δεδομένων.
      </p>

      {status === 'error' && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-lg border border-red-100 w-full text-center">
              {errorMessage}
          </div>
      )}

      <form onSubmit={handleLogin} className="w-full space-y-4">
        <div>
            <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Email Διαχειριστή</label>
            <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-slate-400 h-5 w-5"/>
                <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-900"
                    placeholder="admin@politografisi.online"
                />
            </div>
        </div>

        <button 
            type="submit" 
            disabled={status === 'sending'}
            className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
            {status === 'sending' ? <Loader2 className="animate-spin h-5 w-5"/> : <>Αποστολή Συνδέσμου <ArrowRight size={18}/></>}
        </button>
      </form>
      
      <div className="mt-8 flex items-center gap-2 text-[10px] text-slate-400 uppercase font-bold tracking-widest">
        <ShieldCheck size={12}/> Secure Double-Gate Access
      </div>
    </div>
  );
}