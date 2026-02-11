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

  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      setStatus('loading');
      let emailForSignIn = window.localStorage.getItem('emailForSignIn');
      
      if (!emailForSignIn) {
        emailForSignIn = window.prompt('Παρακαλώ επιβεβαιώστε το email σας για είσοδο:');
      }

      if (emailForSignIn) {
        signInWithEmailLink(auth, emailForSignIn, window.location.href)
          .then(() => {
            window.localStorage.removeItem('emailForSignIn');
            setStatus('success');
            // ✅ ЗМІНА: Переходимо на ГOЛОВНУ (Дашборд), а не в leads
            router.push('/'); 
          })
          .catch((error) => {
            console.error(error);
            setStatus('error');
            setErrorMessage(error.message);
          });
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage("");

    const actionCodeSettings = {
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
      setErrorMessage(error.message);
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600 h-10 w-10"/></div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="mb-8 p-4 bg-white rounded-full shadow-xl shadow-slate-200/50">
        <ShieldCheck className="h-12 w-12 text-slate-700" strokeWidth={1.5} />
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-white">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 mb-2 font-serif">CRM Login</h1>
          <p className="text-slate-500 font-medium text-sm">
            Please verify your email to access the database.
          </p>
        </div>

        {status === 'sent' ? (
          <div className="bg-green-50 text-green-800 p-4 rounded-xl flex items-start gap-3 border border-green-100 animate-in fade-in slide-in-from-bottom-2">
             <div className="bg-green-100 p-1 rounded-full"><ShieldCheck size={16}/></div>
             <div>
               <p className="font-bold text-sm">Link Sent!</p>
               <p className="text-xs mt-1 opacity-80">Check your inbox (and Spam) for {email}.</p>
             </div>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            {status === 'error' && (
               <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
                 <AlertCircle size={16}/> {errorMessage}
               </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Admin Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20}/>
                <input type="email" required placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 pl-12 pr-4 font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all"/>
              </div>
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-slate-900/20 active:scale-[0.98]">
              <span>Send Magic Link</span>
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18}/>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}