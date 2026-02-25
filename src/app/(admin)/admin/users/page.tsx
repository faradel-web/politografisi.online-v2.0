"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore";
import { USER_ROLES } from "@/lib/constants";
import { useAuth } from "@/contexts/auth-context"; // --- NEW: Імпорт Auth
import { useRouter } from "next/navigation";   // --- NEW: Імпорт Router
import { 
  Loader2, User, Search, Shield, 
  MoreHorizontal, Calendar, Phone, Mail, CheckCircle, XCircle, ChevronDown, ShieldAlert 
} from "lucide-react";

// Тип даних користувача
type UserData = {
  id: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  role: string;
  subscriptionEndsAt?: any; // Timestamp
  createdAt?: string;
};

export default function UserManagementPage() {
  const { user: currentUser, loading: authLoading } = useAuth(); // --- NEW: Отримуємо поточного юзера
  const router = useRouter();

  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Стан для модального вікна
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Дані форми
  const [selectedRole, setSelectedRole] = useState("");
  const [subscriptionDate, setSubscriptionDate] = useState("");

  // --- 1. ЗАВАНТАЖЕННЯ (з перевіркою прав) ---
  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserData[];
      
      // Сортуємо: новіші зверху
      usersData.sort((a, b) => {
         const dateA = a.createdAt || "";
         const dateB = b.createdAt || "";
         return dateB.localeCompare(dateA);
      });
      
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // --- NEW: ЗАХИСТ СТОРІНКИ ---
    if (!authLoading) {
        if (!currentUser || currentUser.role !== USER_ROLES.ADMIN) {
            // Якщо не адмін - викидаємо на головну адмінку (де питання)
            router.push("/admin"); 
            return;
        }
        // Тільки якщо Адмін - вантажимо список
        fetchUsers();
    }
  }, [currentUser, authLoading, router]);

  // --- 2. ЗБЕРЕЖЕННЯ ---
  const handleSave = async () => {
    if (!editingUser) return;
    setIsSaving(true);

    try {
      const userRef = doc(db, "users", editingUser.id);
      
      let updateData: any = { role: selectedRole };

      // Логіка підписки
      if (selectedRole === USER_ROLES.STUDENT) {
        if (subscriptionDate) {
           updateData.subscriptionEndsAt = Timestamp.fromDate(new Date(subscriptionDate));
        }
      } else {
        updateData.subscriptionEndsAt = null;
      }

      await updateDoc(userRef, updateData);

      // Оновлюємо локально
      setUsers(prev => prev.map(u => {
        if (u.id === editingUser.id) {
            return { ...u, ...updateData };
        }
        return u;
      }));

      setEditingUser(null);
    } catch (error) {
      console.error("Error updating:", error);
      alert("Σφάλμα κατά την ενημέρωση (Помилка оновлення)");
    } finally {
      setIsSaving(false);
    }
  };

  // --- 3. HELPER FUNCTIONS ---

  const openEditModal = (user: UserData) => {
    setEditingUser(user);
    setSelectedRole(user.role || USER_ROLES.GUEST);
    
    if (user.subscriptionEndsAt) {
        const date = user.subscriptionEndsAt.toDate ? user.subscriptionEndsAt.toDate() : new Date(user.subscriptionEndsAt);
        setSubscriptionDate(date.toISOString().split('T')[0]);
    } else {
        setSubscriptionDate(new Date().toISOString().split('T')[0]);
    }
  };

  const addMonths = (months: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    if (months > 120) date.setFullYear(2099); 
    setSubscriptionDate(date.toISOString().split('T')[0]);
  };

  const filteredUsers = users.filter(u => 
    (u.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (u.displayName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (u.phoneNumber || "").includes(searchTerm)
  );

  const renderStatus = (user: UserData) => {
    if (user.role === USER_ROLES.ADMIN) return <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 w-fit border border-purple-200"><ShieldAlert className="h-3 w-3"/> Admin</span>;
    if (user.role === USER_ROLES.EDITOR) return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-lg text-xs font-bold w-fit border border-orange-200">Editor</span>;
    
    if (user.role === USER_ROLES.STUDENT) {
        const now = new Date();
        const end = user.subscriptionEndsAt?.toDate ? user.subscriptionEndsAt.toDate() : null;
        
        if (end && end > now) {
            return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 w-fit border border-emerald-200"><CheckCircle className="h-3 w-3"/> Active Student</span>;
        } else {
            return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 w-fit border border-red-200"><XCircle className="h-3 w-3"/> Expired</span>;
        }
    }
    return <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-xs font-bold w-fit border border-slate-200">Guest</span>;
  };

  // --- NEW: Показуємо лоадер, поки перевіряємо права ---
  if (authLoading || loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-8 w-8 text-indigo-600"/></div>;

  // --- NEW: Якщо не адмін (і редірект ще не спрацював) - не рендеримо контент ---
  if (currentUser?.role !== USER_ROLES.ADMIN) return null;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3 font-serif text-slate-900">
                Διαχείριση Χρηστών
            </h1>
            <p className="text-slate-500 font-medium mt-1">Κерування доступами та підписками</p>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
            <input 
                type="text" 
                placeholder="Αναζήτηση..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm font-medium"
            />
          </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-400 font-bold tracking-wider">
                <tr>
                    <th className="p-5">Χρήστης (User)</th>
                    <th className="p-5">Επικοινωνία (Contact)</th>
                    <th className="p-5">Ρόλος (Role)</th>
                    <th className="p-5">Λήξη (Expires)</th>
                    <th className="p-5 text-right">Ενέργειες</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="p-5">
                        <div className="font-bold text-slate-900 text-base">{user.displayName || "Χωρίς όνομα"}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5 select-all">{user.id.substring(0,8)}...</div>
                    </td>
                    <td className="p-5">
                        <div className="flex items-center gap-2 text-slate-600 mb-1 font-medium">
                            <Mail className="h-3.5 w-3.5 text-slate-400"/> {user.email}
                        </div>
                        {user.phoneNumber && (
                            <div className="flex items-center gap-2 text-slate-600 font-medium">
                                <Phone className="h-3.5 w-3.5 text-slate-400"/> {user.phoneNumber}
                            </div>
                        )}
                    </td>
                    <td className="p-5">
                        {renderStatus(user)}
                    </td>
                    <td className="p-5 text-slate-500 font-medium">
                        {user.role === USER_ROLES.STUDENT && user.subscriptionEndsAt ? (
                             <span className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 w-fit text-slate-600">
                                <Calendar className="h-3.5 w-3.5 text-slate-400"/>
                                {user.subscriptionEndsAt.toDate ? user.subscriptionEndsAt.toDate().toLocaleDateString('el-GR') : "..."}
                             </span>
                        ) : <span className="text-slate-300 ml-2">-</span>}
                    </td>
                    <td className="p-5 text-right">
                        <button 
                            onClick={() => openEditModal(user)}
                            className="bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-slate-400 hover:text-indigo-600 p-2.5 rounded-xl transition-all shadow-sm group-hover:opacity-100"
                            title="Επεξεργασία"
                        >
                            <MoreHorizontal className="h-5 w-5"/>
                        </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        {filteredUsers.length === 0 && (
            <div className="h-[300px] flex flex-col items-center justify-center gap-3 text-slate-400">
                <div className="bg-slate-50 p-4 rounded-full">
                    <User className="h-8 w-8 text-slate-300"/>
                </div>
                <p className="font-medium">Δεν βρέθηκαν χρήστες.</p>
            </div>
        )}
      </div>

      {/* --- MODAL --- */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all">
            <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
                
                <h2 className="text-2xl font-black mb-6 text-slate-900 font-serif">Επεξεργασία Χρήστη</h2>
                
                {/* User Info */}
                <div className="mb-8 bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-white border border-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xl shadow-sm">
                        {editingUser.displayName?.charAt(0) || "U"}
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 text-lg">{editingUser.displayName}</p>
                        <p className="text-slate-500 text-sm font-medium">{editingUser.email}</p>
                        {editingUser.phoneNumber && <p className="text-slate-400 text-xs mt-1">{editingUser.phoneNumber}</p>}
                    </div>
                </div>

                <div className="space-y-6 mb-8">
                    {/* Role Select */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Ρόλος (Role)</label>
                        <div className="relative">
                            <select 
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 appearance-none font-bold text-slate-700 shadow-sm"
                            >
                                <option value={USER_ROLES.GUEST}>Guest (Demo / Limited)</option>
                                <option value={USER_ROLES.STUDENT}>Student (Premium / Paid)</option>
                                <option value={USER_ROLES.EDITOR}>Editor (Content Manager)</option>
                                <option value={USER_ROLES.ADMIN}>Admin (Superuser)</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronDown className="h-5 w-5"/>
                            </div>
                        </div>
                    </div>

                    {/* Subscription Date */}
                    {selectedRole === USER_ROLES.STUDENT && (
                        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 animate-in slide-in-from-top-2">
                            <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wide mb-2">Λήξη Συνδρομής</label>
                            
                            <input 
                                type="date" 
                                value={subscriptionDate}
                                onChange={(e) => setSubscriptionDate(e.target.value)}
                                className="w-full p-3 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 mb-4 bg-white font-bold text-indigo-900 shadow-sm"
                            />

                            <div className="flex gap-2">
                                <QuickButton label="+1 Μήνας" onClick={() => addMonths(1)} />
                                <QuickButton label="+3 Μήνες" onClick={() => addMonths(3)} />
                                <QuickButton label="Lifetime" onClick={() => addMonths(1200)} highlight />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 justify-end pt-4 border-t border-slate-50">
                    <button 
                        onClick={() => setEditingUser(null)}
                        className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                    >
                        Ακύρωση
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-colors shadow-lg disabled:opacity-70 flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 className="animate-spin h-5 w-5"/> : <CheckCircle className="h-5 w-5"/>}
                        Αποθήκευση
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

// UI Helpers
const QuickButton = ({ label, onClick, highlight }: { label: string, onClick: () => void, highlight?: boolean }) => (
    <button 
        onClick={onClick} 
        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${
            highlight 
            ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-md' 
            : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300'
        }`}
    >
        {label}
    </button>
);