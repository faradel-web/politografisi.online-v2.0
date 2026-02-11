"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { 
  Loader2, Mail, Phone, Search, UserCircle, 
  CheckCircle, AlertTriangle, Inbox, Trash2, 
  ArchiveRestore, GraduationCap, PauseCircle, Timer, 
  Skull, ArrowLeft
} from "lucide-react";

// --- ТИПИ ДАНИХ ---
interface UserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string; // ✅ Додано displayName, щоб виправити помилку
  role?: string;
  createdAt?: any;
  subscriptionEndsAt?: any;
  phoneNumber?: string;
  isArchived?: boolean; 
  archiveCategory?: 'completed' | 'paused' | 'potential' | 'spam';
}

interface LeadData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  message?: string;
  topic?: string;
  createdAt: any;
  status: string;
  archiveCategory?: 'completed' | 'paused' | 'potential' | 'spam';
}

interface RequestItem {
  docId: string;
  message: string;
  topic: string;
  createdAt: any;
}

interface UnifiedContact {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  isRegistered: boolean;
  role: string;          
  requests: RequestItem[]; 
  lastActive: any;
  archiveCategory: string;
}

export default function CrmArchivePage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<UnifiedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<'checking' | 'authorized' | 'forbidden'>('checking');
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const role = userDoc.data()?.role;
        if (role === 'admin' || role === 'editor') {
          setAuthStatus('authorized');
        } else {
          setAuthStatus('forbidden');
          setLoading(false);
        }
      } else {
        router.push('/crm');
      }
    });
    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    if (authStatus !== 'authorized') return;

    const unsubUsers = onSnapshot(collection(db, "users"), (uSnap) => {
      const unsubLeads = onSnapshot(collection(db, "leads"), (lSnap) => {
        
        const merged: Record<string, UnifiedContact> = {};
        const allUsers = uSnap.docs.map(d => ({id: d.id, ...d.data()})) as UserData[];
        const allLeads = lSnap.docs.map(d => ({id: d.id, ...d.data()})) as LeadData[];

        allUsers.filter(u => u.isArchived).forEach(u => {
          // ✅ Покращена логіка парсингу імені (як у файлі leads)
          let fName = u.firstName || u.displayName?.split(" ")[0] || "Άγνωστος";
          let lName = u.lastName || u.displayName?.split(" ").slice(1).join(" ") || "Χρήστης";

          merged[u.email.toLowerCase()] = {
            id: u.id,
            email: u.email,
            firstName: fName,
            lastName: lName,
            phone: u.phoneNumber || "-",
            isRegistered: true,
            role: u.role || 'student',
            requests: [],
            lastActive: u.createdAt,
            archiveCategory: u.archiveCategory || 'paused'
          };
        });

        allLeads.forEach(l => {
          const emailKey = l.email.toLowerCase();
          const isLeadArchived = l.status === 'archived' || (merged[emailKey] && merged[emailKey].isRegistered);

          if (isLeadArchived) {
            const req = { docId: l.id, message: l.message || "", topic: l.topic || "general", createdAt: l.createdAt };
            
            if (merged[emailKey]) {
                merged[emailKey].requests.push(req);
                if (merged[emailKey].phone === "-") merged[emailKey].phone = l.phone || "-";
            } else {
                merged[emailKey] = {
                    id: l.id,
                    email: l.email,
                    firstName: l.firstName || "Επισκέπτης",
                    lastName: l.lastName || "",
                    phone: l.phone || "-",
                    isRegistered: false,
                    role: 'guest',
                    requests: [req],
                    lastActive: l.createdAt,
                    archiveCategory: l.archiveCategory || 'potential'
                };
            }
          }
        });

        setContacts(Object.values(merged));
        setLoading(false);
      });
    });
  }, [authStatus]);

  const restoreContact = async (contact: UnifiedContact) => {
    try {
        if (contact.isRegistered) {
            await updateDoc(doc(db, "users", contact.id), { isArchived: false, archiveCategory: null });
        } else {
            for (const r of contact.requests) {
                await updateDoc(doc(db, "leads", r.docId), { status: 'new', archiveCategory: null });
            }
        }
        alert("Επαναφέρθηκε με επιτυχία!");
    } catch (e) { console.error(e); }
  };

  const hardDelete = async (contact: UnifiedContact) => {
    if (!confirm("🚨 ΟΡΙΣΤΙΚΗ ΔΙΑΓΡΑΦΗ; Δεν μπορεί να αναιρεθεί!")) return;
    try {
        if (contact.isRegistered) {
            await deleteDoc(doc(db, "users", contact.id));
        } else {
            for (const r of contact.requests) await deleteDoc(doc(db, "leads", r.docId));
        }
    } catch (e) { console.error(e); }
  };

  const filtered = contacts.filter(c => 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.firstName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const completed = filtered.filter(c => c.archiveCategory === 'completed');
  const paused = filtered.filter(c => c.archiveCategory === 'paused');
  const potential = filtered.filter(c => c.archiveCategory === 'potential');
  const spam = filtered.filter(c => c.archiveCategory === 'spam');

  const renderArchiveSection = (title: string, icon: any, data: UnifiedContact[], color: string) => (
    <div className={`mb-10 rounded-2xl border ${color} bg-white overflow-hidden shadow-sm`}>
        <div className="p-4 border-b flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-2 font-bold text-slate-700">{icon} {title}</div>
            <span className="text-xs font-bold bg-white px-2 py-1 rounded-full border">{data.length}</span>
        </div>
        <table className="w-full text-left text-sm">
            <tbody className="divide-y">
                {data.length === 0 ? <tr><td className="p-4 text-slate-400 italic text-center">Κενό αρχείο</td></tr> : 
                    data.map(c => (
                        <tr key={`${c.id}-${c.email}`} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4">
                                <div className="font-bold text-slate-800">{c.lastName.toUpperCase()} {c.firstName}</div>
                                <div className="text-[10px] text-slate-400 font-medium">{c.email}</div>
                            </td>
                            <td className="p-4 text-xs text-slate-500 italic max-w-[200px] truncate">
                                {c.requests.length > 0 ? `"${c.requests[0].message}"` : "Χωρίς ιστορικό"}
                            </td>
                            <td className="p-4 text-right flex justify-end gap-1">
                                <button onClick={() => restoreContact(c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Restore"><ArchiveRestore size={18}/></button>
                                <button onClick={() => hardDelete(c)} className="p-2 text-slate-300 hover:text-red-600 rounded-xl transition-all"><Trash2 size={18}/></button>
                            </td>
                        </tr>
                    ))
                }
            </tbody>
        </table>
    </div>
  );

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 pb-20">
        <button onClick={() => router.push('/crm/leads')} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-slate-800 font-bold transition-colors text-sm uppercase tracking-wider">
            <ArrowLeft size={18}/> Επιστροφή στο CRM
        </button>

        <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div>
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Αρχειοθήκη</h1>
                <p className="text-slate-500 text-sm font-medium">Διαχείριση παλαιών επαφών και αιτημάτων</p>
            </div>
            <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-3 text-slate-400" size={18}/>
                <input 
                    type="text" placeholder="Αναζήτηση στο αρχείο..." 
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-medium"
                />
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {renderArchiveSection("Ολοκλήρωσαν την εκπαίδευση", <GraduationCap className="text-green-600"/>, completed, "border-green-100 shadow-green-100/20")}
            {renderArchiveSection("Διέκοψαν / Σε αναμονή", <PauseCircle className="text-orange-600"/>, paused, "border-orange-100 shadow-orange-100/20")}
            {renderArchiveSection("Σκέφτονται / Μελλοντική Επικοινωνία", <Timer className="text-blue-600"/>, potential, "border-blue-100 shadow-blue-100/20")}
            {renderArchiveSection("Spam / Απόρριψη", <Skull className="text-slate-400"/>, spam, "border-slate-200 shadow-slate-100/20")}
        </div>
    </div>
  );
}