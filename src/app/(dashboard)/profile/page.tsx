"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { updateProfile, signOut } from "firebase/auth";
import { auth, storage, db } from "@/lib/firebase"; 
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore"; 
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  User, Mail, Save, LogOut, Loader2, 
  ArrowLeft, Shield, Camera, CheckCircle, Phone, Lock, Sparkles, Crown, Zap, Check
} from "lucide-react";
import { USER_ROLES, GUEST_LIMITS } from "@/lib/constants";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  // Роздільні поля для імені
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(""); 
  const [photoURL, setPhotoURL] = useState(""); 
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false); 
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhoneNumber(user.phoneNumber || "");
      setPhotoURL(user.photoURL || "");
    }
  }, [user]);

  // --- ЗАВАНТАЖЕННЯ ФОТО ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    if (file.size > 5 * 1024 * 1024) {
        alert("Το αρχείο είναι πολύ μεγάλο (max 5MB).");
        return;
    }

    setIsUploading(true);
    try {
        const storageRef = ref(storage, `avatars/${auth.currentUser.uid}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        await updateProfile(auth.currentUser, { photoURL: url });
        setPhotoURL(url);
        setMessage({ type: 'success', text: "Η φωτογραφία ενημερώθηκε!" });
        window.location.reload(); 

    } catch (error) {
        console.error("Upload error:", error);
        setMessage({ type: 'error', text: "Σφάλμα κατά τη μεταφόρτωση." });
    } finally {
        setIsUploading(false);
    }
  };

  // --- ЗБЕРЕЖЕННЯ ДАНИХ ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setIsSaving(true);
    setMessage(null);

    try {
      const fullName = `${firstName} ${lastName}`.trim();

      // 1. Оновлюємо профіль Auth
      await updateProfile(auth.currentUser, { displayName: fullName });

      // 2. Оновлюємо дані в Firestore
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
          firstName: firstName,
          lastName: lastName,
          displayName: fullName,
          phoneNumber: phoneNumber 
      });

      setMessage({ type: 'success', text: "Το προφίλ ενημερώθηκε επιτυχώς!" }); 
    } catch (error) {
      console.error("Profile save error:", error);
      setMessage({ type: 'error', text: "Παρουσιάστηκε σφάλμα." }); 
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm("Είστε σίγουροι ότι θέλετε να αποσυνδεθείτε;")) return; 
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  // --- РЕНДЕРИНГ ПЛАНУ ---
  const renderPlanInfo = () => {
      const role = (user as any)?.role || "guest";
      const isStudent = role === USER_ROLES.STUDENT || role === USER_ROLES.ADMIN || role === USER_ROLES.EDITOR;

      if (isStudent) {
          // --- PREMIUM VIEW ---
          return (
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-[2rem] shadow-xl shadow-emerald-200 mb-8 text-white">
                  {/* Decorative Background Elements */}
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-black/5 rounded-full blur-xl"></div>
                  
                  <div className="relative z-10 flex justify-between items-start">
                      <div>
                          <div className="flex items-center gap-2 mb-1">
                              <Crown className="h-5 w-5 text-yellow-300 fill-yellow-300"/>
                              <p className="text-xs font-bold uppercase tracking-widest text-emerald-100">Τρέχον Πλάνο</p>
                          </div>
                          <h3 className="text-3xl font-black mb-1">Premium Student</h3>
                          <p className="text-sm text-emerald-50 font-medium">Έχετε πλήρη πρόσβαση σε όλα.</p>
                      </div>
                      <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm border border-white/10">
                          <CheckCircle className="h-8 w-8 text-white"/>
                      </div>
                  </div>

                  <div className="relative z-10 mt-8 flex flex-wrap gap-4">
                      <div className="flex items-center gap-2 text-xs font-bold bg-black/10 px-3 py-1.5 rounded-lg border border-white/5">
                          <Sparkles className="h-3 w-3 text-yellow-300"/> Απεριόριστα Τεστ
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold bg-black/10 px-3 py-1.5 rounded-lg border border-white/5">
                          <Sparkles className="h-3 w-3 text-yellow-300"/> Πρόσβαση 360°
                      </div>
                  </div>
              </div>
          )
      }

      // --- GUEST VIEW (UPGRADED for Conversion) ---
      return (
          <div className="bg-white p-8 rounded-[2rem] border-2 border-blue-50 shadow-xl shadow-blue-100/50 mb-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-10 -mt-10 blur-3xl opacity-50"></div>
              
              <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                      <div>
                          <h3 className="font-black text-slate-900 text-2xl mb-1">Basic Plan</h3>
                          <p className="text-slate-500 font-medium text-sm">Ο λογαριασμός σας είναι ενεργός αλλά περιορισμένος.</p>
                      </div>
                      <div className="bg-slate-100 p-3 rounded-2xl text-slate-400">
                          <Lock className="h-6 w-6"/>
                      </div>
                  </div>

                  {/* Feature Comparison List */}
                  <div className="space-y-3 mb-8">
                      <div className="flex items-center gap-3">
                          <div className="p-1 bg-green-100 rounded text-green-700"><Check size={12} strokeWidth={4}/></div>
                          <span className="text-sm font-bold text-slate-700">Βασική Θεωρία</span>
                      </div>
                      
                      {/* Locked Features (Incentive) */}
                      <div className="flex items-center gap-3 opacity-60">
                          <div className="p-1 bg-slate-100 rounded text-slate-400"><Lock size={12}/></div>
                          <span className="text-sm font-bold text-slate-500">Απεριόριστα Τεστ (Όριο: {GUEST_LIMITS.CONTENT_ITEMS})</span>
                      </div>
                      <div className="flex items-center gap-3 opacity-60">
                          <div className="p-1 bg-slate-100 rounded text-slate-400"><Lock size={12}/></div>
                          <span className="text-sm font-bold text-slate-500">AI Διορθώσεις (Έκθεση & Ομιλία)</span>
                      </div>
                      <div className="flex items-center gap-3 opacity-60">
                          <div className="p-1 bg-slate-100 rounded text-slate-400"><Lock size={12}/></div>
                          <span className="text-sm font-bold text-slate-500">Πρόσβαση στην Τράπεζα Θεμάτων</span>
                      </div>
                  </div>

                  {/* Call to Action Button */}
                  <Link href="/#pricing" className="w-full block">
                      <div className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black text-center shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group-hover:from-blue-700 group-hover:to-indigo-700">
                          <Zap className="h-5 w-5 fill-yellow-300 text-yellow-300 animate-pulse"/>
                          Ξεκλειδώστε Πλήρη Πρόσβαση
                      </div>
                  </Link>
                  <p className="text-center text-xs font-bold text-slate-400 mt-3">
                      Εφάπαξ πληρωμή. Χωρίς συνδρομές.
                  </p>
              </div>
          </div>
      )
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin h-10 w-10 text-blue-600"/></div>;

  const initials = user.displayName 
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : user.email?.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      
      {/* HEADER */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 sticky top-0 z-20 shadow-sm/50 backdrop-blur-md bg-white/90">
         <div className="max-w-2xl mx-auto flex items-center gap-4">
            <Link href="/dashboard" className="p-2 -ml-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-900">
                <ArrowLeft className="h-5 w-5"/>
            </Link>
            <h1 className="text-xl font-black text-slate-900 font-montserrat">
                Το Προφίλ μου
            </h1>
         </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 sm:p-8 space-y-8">
        
        {/* AVATAR CARD */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-blue-50 to-white"></div>
            
            <label className="relative mb-4 group cursor-pointer z-10">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                
                <div className="w-28 h-28 rounded-full bg-white text-slate-900 flex items-center justify-center text-3xl font-black shadow-xl shadow-slate-200 overflow-hidden border-[6px] border-white transition-all group-hover:shadow-2xl group-hover:scale-105 relative">
                    
                    {/* Image or Initials */}
                    {photoURL ? (
                        <img src={photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-slate-300">{initials}</span>
                    )}

                    {/* Loading Overlay */}
                    {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                            <Loader2 className="animate-spin h-8 w-8 text-white"/>
                        </div>
                    )}

                    {/* Hover Overlay */}
                    {!isUploading && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                            <Camera className="h-8 w-8 text-white drop-shadow-md"/>
                        </div>
                    )}
                </div>
                
                {!isUploading && (
                    <div className="absolute bottom-1 right-1 bg-blue-600 text-white p-2 rounded-full border-4 border-white shadow-lg group-hover:bg-blue-700 transition-colors">
                        <Camera className="h-4 w-4"/>
                    </div>
                )}
            </label>
            
            <div className="z-10">
                <h2 className="text-2xl font-black text-slate-900 font-montserrat mb-1">{user.displayName || "Χρήστης"}</h2>
                <p className="text-slate-400 font-medium text-sm">{user.email}</p>
            </div>
        </div>

        {/* PLAN INFO */}
        {renderPlanInfo()}

        {/* FORM */}
        <form onSubmit={handleSave} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-50">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><User className="h-5 w-5"/></div>
                <h3 className="font-bold text-slate-900 text-lg">Προσωπικά Στοιχεία</h3>
            </div>

            {/* Email (Read Only) */}
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email</label>
                <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300"/>
                    <input 
                        type="email" 
                        value={user.email || ""} 
                        disabled 
                        className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-500 font-bold cursor-not-allowed appearance-none"
                    />
                </div>
            </div>

            {/* First & Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Όνομα</label>
                    <input 
                        type="text" 
                        value={firstName} 
                        onChange={(e) => setFirstName(e.target.value)} 
                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all appearance-none" 
                        placeholder="Όνομα"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Επίθετο</label>
                    <input 
                        type="text" 
                        value={lastName} 
                        onChange={(e) => setLastName(e.target.value)} 
                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all appearance-none" 
                        placeholder="Επίθετο"
                    />
                </div>
            </div>

            {/* Phone Number */}
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Τηλέφωνο</label>
                <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"/>
                    <input 
                        type="tel" 
                        value={phoneNumber} 
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+30..."
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all appearance-none"
                    />
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {message.type === 'success' ? <Shield className="h-5 w-5"/> : <div className="h-2 w-2 rounded-full bg-red-500 shrink-0"></div>}
                    {message.text}
                </div>
            )}

            <button type="submit" disabled={isSaving} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-slate-800 hover:scale-[1.01] transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:scale-100">
                {isSaving ? <Loader2 className="animate-spin h-5 w-5"/> : <Save className="h-5 w-5"/>}
                Αποθήκευση Αλλαγών
            </button>
        </form>

        <div className="bg-red-50 p-8 rounded-[2.5rem] border border-red-100 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
                <h3 className="font-black text-red-900 text-lg mb-1">Αποσύνδεση</h3>
                <p className="text-red-700/70 text-sm font-medium">Θέλετε να βγείτε από τον λογαριασμό σας;</p>
            </div>
            <button onClick={handleLogout} className="px-8 py-3 bg-white border border-red-200 text-red-600 rounded-2xl font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center gap-2 w-full sm:w-auto justify-center hover:shadow-red-200">
                <LogOut className="h-4 w-4"/>
                Έξοδος
            </button>
        </div>

      </div>
    </div>
  );
}