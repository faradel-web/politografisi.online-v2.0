"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"; 
import { doc, setDoc } from "firebase/firestore";
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context"; // Для кнопки Google

export default function RegisterPage() {
  const router = useRouter();
  const { loginWithGoogle } = useAuth(); // Використовуємо глобальну функцію

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "", // Окреме поле
    lastName: "",  // Окреме поле
    phone: "", 
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валідація
    if (formData.password.length < 6) {
      setError("Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.");
      return;
    }
    if (formData.phone.length < 10) {
      setError("Παρακαλώ εισάγετε έγκυρο αριθμό τηλεφώνου.");
      return;
    }
    if (!formData.firstName || !formData.lastName) {
      setError("Παρακαλώ συμπληρώστε Όνομα και Επίθετο.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // 1. Створюємо користувача в Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      // 2. Оновлюємо базовий профіль
      await updateProfile(user, {
        displayName: `${formData.firstName} ${formData.lastName}`
      });

      // 3. Зберігаємо розширені дані в Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: `${formData.firstName} ${formData.lastName}`,
        phoneNumber: formData.phone,
        role: "guest",
        createdAt: new Date().toISOString(),
        progress: {},
      });
      
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Registration error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Το email χρησιμοποιείται ήδη.");
      } else {
        setError("Σφάλμα εγγραφής: " + (err.message || "Δοκιμάστε ξανά."));
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white font-sans text-slate-900">
      
      {/* === MOBILE HEADER === */}
      <div className="lg:hidden bg-blue-900 p-6 pb-12 rounded-b-[2.5rem] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-800 to-slate-900 opacity-50 z-0"></div>
          <div className="relative z-10 flex flex-col gap-5">
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

            <div className="flex flex-wrap gap-3 text-white/90 text-xs font-bold mt-1 uppercase">
                <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg backdrop-blur-sm border border-white/5">
                    <CheckCircle2 className="w-3 h-3 text-green-400"/> ΔΩΡΕΑΝ ΕΓΓΡΑΦΗ
                </span>
            </div>
          </div>
      </div>

      {/* === DESKTOP LEFT SIDE === */}
      <div className="hidden lg:flex w-1/2 bg-blue-900 relative flex-col justify-between p-12 text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-800 to-slate-900 opacity-50 z-0"></div>
          
          <div className="relative z-10 flex items-center gap-3">
             <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center font-bold text-xl border border-white/10 transition-transform group-hover:scale-105">
                  P
                </div>
                <span className="font-montserrat font-bold text-xl tracking-wide text-white">
                  POLITOGRAFISI.GR
                </span>
             </Link>
          </div>

          <div className="relative z-10 max-w-lg space-y-8">
              <h2 className="font-montserrat text-4xl font-bold leading-tight text-white">
                  Δημιουργήστε τον λογαριασμό σας σήμερα.
              </h2>
              
              <div className="space-y-4">
                  <div className="flex gap-4 p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors group cursor-default">
                      <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 flex-shrink-0 group-hover:scale-110 transition-transform">
                          <CheckCircle2 className="h-6 w-6"/>
                      </div>
                      <div>
                          <h4 className="font-bold text-lg text-white font-montserrat tracking-wide">
                              ΞΕΚΙΝΗΣΤΕ ΔΩΡΕΑΝ ΣΗΜΕΡΑ
                          </h4>
                          <p className="text-blue-100 text-sm mt-1 leading-relaxed opacity-90">
                              Δοκιμάστε την πλατφόρμα με περιορισμένη πρόσβαση πριν γίνετε συνδρομητής.
                          </p>
                      </div>
                  </div>
              </div>
          </div>

          <div className="relative z-10 text-sm text-blue-300 font-medium">
              © 2026 Politografisi Online
          </div>
      </div>

      {/* === RIGHT SIDE (FORM) === */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 lg:px-24 relative -mt-6 lg:mt-0 z-20">
        
        <div className="hidden lg:block absolute top-8 left-8 lg:static lg:mb-8 lg:mt-0">
            <Link href="/" className="group flex items-center gap-2 text-slate-400 hover:text-blue-700 transition-colors font-bold text-sm">
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Επιστροφή
            </Link>
        </div>

        <div className="w-full max-w-sm mx-auto bg-white rounded-3xl p-8 lg:p-0 shadow-xl shadow-slate-200/50 lg:shadow-none border border-slate-100 lg:border-none">
            <div className="mb-6">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2 font-montserrat">Εγγραφή</h1>
                <p className="text-slate-500 text-sm lg:text-base">
                    Συμπληρώστε τη φόρμα για να αποκτήσετε πρόσβαση.
                </p>
            </div>

            {/* GOOGLE BUTTON */}
            <button 
                onClick={loginWithGoogle}
                type="button"
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-slate-700 font-bold py-3 px-6 rounded-xl transition-all duration-200 mb-6"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-sm">Εγγραφή με Google</span>
            </button>

            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-400 font-bold">ή με Email</span>
                </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
                {error && (
                    <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium">{error}</span>
                    </div>
                )}
                
                {/* ІМ'Я та ПРІЗВИЩЕ в один рядок на великих екранах */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wide ml-1">Όνομα</label>
                        <input
                            type="text"
                            required
                            className="block w-full rounded-xl border-2 border-slate-100 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                            placeholder="Όνομα"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            disabled={loading}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wide ml-1">Επίθετο</label>
                        <input
                            type="text"
                            required
                            className="block w-full rounded-xl border-2 border-slate-100 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                            placeholder="Επίθετο"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Телефон */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wide ml-1">Τηλέφωνο</label>
                    <input
                        type="tel"
                        required
                        className="block w-full rounded-xl border-2 border-slate-100 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                        placeholder="69XXXXXXXX"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={loading}
                    />
                </div>

                {/* Email */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wide ml-1">Email</label>
                    <input
                        type="email"
                        required
                        className="block w-full rounded-xl border-2 border-slate-100 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={loading}
                    />
                </div>

                {/* Password */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wide ml-1">Κωδικός</label>
                    <input
                        type="password"
                        required
                        className="block w-full rounded-xl border-2 border-slate-100 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        disabled={loading}
                    />
                    <p className="text-xs text-slate-400 ml-1">Τουλάχιστον 6 χαρακτήρες</p>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5 active:scale-95 disabled:opacity-70"
                >
                    {loading ? <Loader2 className="animate-spin h-5 w-5"/> : "Δημιουργία Λογαριασμού"}
                </button>
            </form>

            <div className="mt-8 text-center">
                <p className="text-sm text-slate-500 mb-4">Έχετε ήδη λογαριασμό;</p>
                <Link href="/login" className="text-blue-600 font-bold hover:underline font-montserrat">
                    Σύνδεση εδώ
                </Link>
            </div>
        </div>
        
        <div className="h-8 lg:hidden"></div> 
      </div>
    </div>
  );
}