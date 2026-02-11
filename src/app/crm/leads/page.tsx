"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation"; 
import { db, auth } from "@/lib/firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { 
  Loader2, Mail, Phone, 
  Trash2, Search, 
  ShieldAlert, UserCircle, 
  CheckCircle, AlertTriangle,
  Crown, FileEdit, Users, Inbox, 
  Archive, ChevronRight, LayoutDashboard, UserCog, 
  CalendarClock, AlertOctagon,
  GraduationCap, PauseCircle, Timer, Skull
} from "lucide-react";

// --- ТИПИ ДАНИХ ---
interface UserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  role?: string;
  createdAt?: any;
  subscriptionEndsAt?: any;
  photoURL?: string;
  phoneNumber?: string;
  isArchived?: boolean; 
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
}

interface RequestItem {
  docId: string;
  message: string;
  topic: string;
  status: string;
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
  subscriptionEndsAt?: any;
  requests: RequestItem[]; 
  lastActive: any;
  avatar?: string;
  isConflict?: boolean; 
  conflictReason?: string;
  isArchived: boolean; 
}

export default function CrmUnifiedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [contacts, setContacts] = useState<UnifiedContact[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<'checking' | 'authorized' | 'guest' | 'forbidden'>('checking');
  const [searchTerm, setSearchTerm] = useState("");
  
  // ✅ СТАН ДЛЯ ВКЛАДОК
  const [activeTab, setActiveTab] = useState<'all' | 'admins' | 'editors' | 'paid' | 'free' | 'leads'>('all');

  const [archivingContact, setArchivingContact] = useState<UnifiedContact | null>(null); 
  
  // 1. ПЕРЕВІРКА ПРАВ
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userSnapshot = await getDoc(userDocRef);
          if (userSnapshot.exists() && ['admin', 'editor'].includes(userSnapshot.data().role || 'student')) {
              setAuthStatus('authorized');
          } else {
              setAuthStatus('forbidden');
              setLoading(false);
          }
        } catch (error) { setAuthStatus('guest'); setLoading(false); }
      } else { setAuthStatus('guest'); setLoading(false); }
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. ЗАВАНТАЖЕННЯ ДАНИХ
  useEffect(() => {
    if (authStatus !== 'authorized') return;
    setLoading(true);

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserData[]);
    });

    const qLeads = query(collection(db, "leads"), orderBy("createdAt", "desc"));
    const unsubLeads = onSnapshot(qLeads, (snap) => {
      setLeads(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LeadData[]);
    });

    return () => { unsubUsers(); unsubLeads(); };
  }, [authStatus]);

  // 3. ОБРОБКА ДАНИХ
  useEffect(() => {
    if (users.length === 0 && leads.length === 0) {
        if (authStatus === 'authorized') setLoading(false);
        return;
    }

    const mergedContacts: Record<string, UnifiedContact> = {};

    users.forEach(user => {
      if (!user.email) return;
      const emailKey = user.email.toLowerCase();
      
      let fName = user.firstName || user.displayName?.split(" ")[0] || "Άγνωστος";
      let lName = user.lastName || user.displayName?.split(" ").slice(1).join(" ") || "Χρήστης";

      mergedContacts[emailKey] = {
        id: user.id,
        email: user.email,
        firstName: fName,
        lastName: lName,
        phone: user.phoneNumber || "-",
        isRegistered: true,
        role: user.role || 'student',
        subscriptionEndsAt: user.subscriptionEndsAt,
        requests: [],
        lastActive: user.createdAt,
        avatar: user.photoURL,
        isArchived: user.isArchived || false 
      };
    });

    leads.forEach(lead => {
      if (!lead.email) return;
      const emailKey = lead.email.toLowerCase();
      const requestItem: RequestItem = {
          docId: lead.id,
          message: lead.message || "",
          topic: lead.topic || "general",
          status: lead.status || "new",
          createdAt: lead.createdAt
      };

      const existingUser = mergedContacts[emailKey];

      if (existingUser) {
          const isPhoneMatch = checkPhoneMatch(lead.phone || "", existingUser.phone);
          const isFirstPhoneAdd = (existingUser.phone === "-" || existingUser.phone === "") && (lead.phone && lead.phone.length > 5);

          if (isPhoneMatch || isFirstPhoneAdd) {
              existingUser.requests.push(requestItem);
              if (existingUser.phone === "-" || existingUser.phone === "") existingUser.phone = lead.phone || "-";
              if (lead.createdAt && (!existingUser.lastActive || lead.createdAt > existingUser.lastActive)) existingUser.lastActive = lead.createdAt;
          } else {
              const conflictKey = `${emailKey}_CONFLICT_${lead.id}`;
              mergedContacts[conflictKey] = {
                  id: lead.id,
                  email: lead.email,
                  firstName: lead.firstName || "Επισκέπτης",
                  lastName: lead.lastName || "",
                  phone: lead.phone || "-",
                  isRegistered: false,
                  role: 'guest',
                  subscriptionEndsAt: null,
                  requests: [requestItem],
                  lastActive: lead.createdAt,
                  isConflict: true, 
                  conflictReason: `Registered phone: ${existingUser.phone}`,
                  isArchived: lead.status === 'archived'
              };
          }
      } else {
        mergedContacts[emailKey] = {
          id: lead.id,
          email: lead.email,
          firstName: lead.firstName || "Επισκέπτης",
          lastName: lead.lastName || "",
          phone: lead.phone || "-",
          isRegistered: false,
          role: 'guest',
          subscriptionEndsAt: null,
          requests: [requestItem],
          lastActive: lead.createdAt,
          isArchived: lead.status === 'archived'
        };
      }
    });

    const contactsArray = Object.values(mergedContacts).sort((a, b) => {
        const dateA = a.lastActive?.toDate ? a.lastActive.toDate() : new Date(0);
        const dateB = b.lastActive?.toDate ? b.lastActive.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
    });

    setContacts(contactsArray);
    setLoading(false);
  }, [users, leads, authStatus]);

  // АВТОМАТИЧНИЙ ПЕРЕХІД
  useEffect(() => {
    const targetId = searchParams.get('id');
    if (targetId && contacts.length > 0) {
        const target = contacts.find(c => c.id === targetId || c.requests.some(r => r.docId === targetId));
        if (target) {
            router.push(`/leads/${target.id}`);
        }
    }
  }, [contacts, searchParams, router]);

  // --- ХЕЛПЕРИ ---
  const checkPhoneMatch = (p1: string | undefined, p2: string | undefined) => {
      if (!p1 || !p2) return false;
      const n1 = p1.replace(/\D/g, ''); 
      const n2 = p2.replace(/\D/g, '');
      if (n1.length < 7 || n2.length < 7) return n1 === n2;
      return n1.endsWith(n2) || n2.endsWith(n1);
  };

  const renderSubscriptionInfo = (subEndsAt: any, role: string) => {
    if (role === 'admin' || role === 'editor') return <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">TEAM</span>;
    let isValid = false;
    let dateStr = "";
    if (subEndsAt) {
        const date = subEndsAt.toDate ? subEndsAt.toDate() : new Date(subEndsAt);
        isValid = date > new Date();
        dateStr = date.toLocaleDateString('el-GR');
    }
    if (isValid) {
        return (
            <div className="flex flex-col items-start gap-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-green-100 text-green-700 border-green-200 flex items-center gap-1 w-fit"><CheckCircle size={10}/> NEO</span>
                <span className="text-[10px] font-bold text-green-600 flex items-center gap-1"><CalendarClock size={10}/> {dateStr}</span>
            </div>
        );
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1 w-fit"><AlertTriangle size={10}/> FREE</span>;
  };

  const confirmArchive = async (category: string) => {
      if (!archivingContact) return;
      try {
          if (archivingContact.isRegistered) {
              await updateDoc(doc(db, "users", archivingContact.id), { isArchived: true, archiveCategory: category });
          } else {
              for (const req of archivingContact.requests) { await updateDoc(doc(db, "leads", req.docId), { status: 'archived', archiveCategory: category }); }
          }
          setArchivingContact(null);
      } catch (error) { console.error(error); }
  };

  const handleStatusChange = async (leadDocId: string, newStatus: string) => {
      try { await updateDoc(doc(db, "leads", leadDocId), { status: newStatus }); } catch (error) { console.error(error); }
  };

  const handleDeleteRequest = async (leadDocId: string) => {
    if (!confirm("Διαγραφή μηνύματος;")) return;
    try { await deleteDoc(doc(db, "leads", leadDocId)); } catch (error) { console.error(error); }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('el-GR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(date);
  };

  const getTopicLabel = (topic: string) => {
      switch(topic) {
          case 'pack_1_month': return <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">📦 1 Month</span>;
          case 'pack_3_months': return <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">📦 3 Months</span>;
          default: return <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">✉️ General</span>;
      }
  };

  const getStatusStyle = (status: string) => {
      switch(status) {
          case 'new': return 'bg-blue-50 text-blue-700 border-blue-200';
          case 'seen': return 'bg-purple-50 text-purple-700 border-purple-200';
          case 'in_progress': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
          case 'answered': return 'bg-green-50 text-green-700 border-green-200';
          case 'archived': return 'bg-slate-100 text-slate-400 border-slate-200';
          default: return 'bg-white text-slate-600 border-slate-200';
      }
  };

  const activeContacts = contacts.filter(c => !c.isArchived && (c.email.toLowerCase().includes(searchTerm.toLowerCase()) || c.lastName.toLowerCase().includes(searchTerm.toLowerCase())));

  const adminUsers = activeContacts.filter(c => c.role === 'admin');
  const editorUsers = activeContacts.filter(c => c.role === 'editor');
  
  const paidStudents = activeContacts.filter(c => {
      if (!c.isRegistered || c.role === 'admin' || c.role === 'editor') return false;
      if (!c.subscriptionEndsAt) return false;
      const date = c.subscriptionEndsAt.toDate ? c.subscriptionEndsAt.toDate() : new Date(c.subscriptionEndsAt);
      return date > new Date();
  });
  
  const freeStudents = activeContacts.filter(c => {
      if (!c.isRegistered || c.role === 'admin' || c.role === 'editor') return false;
      if (!c.subscriptionEndsAt) return true;
      const date = c.subscriptionEndsAt.toDate ? c.subscriptionEndsAt.toDate() : new Date(c.subscriptionEndsAt);
      return date <= new Date();
  });
  
  const guestLeads = activeContacts.filter(c => !c.isRegistered);

  const renderSection = (title: string, icon: any, data: UnifiedContact[], colorClass: string) => (
    <div className={`rounded-2xl shadow-sm border overflow-hidden mb-8 ${colorClass}`}>
        <div className="p-4 border-b border-slate-200/50 flex justify-between items-center bg-white/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colorClass.replace('border-', 'bg-').replace('200', '100')} text-slate-700`}>{icon}</div>
                <h2 className="text-lg font-bold text-slate-800">{title}</h2>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-white rounded-full text-slate-500 shadow-sm border border-slate-100">{data.length}</span>
        </div>
        <div className="overflow-x-auto bg-white">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 text-xs uppercase text-slate-400 font-bold">
                    <tr><th className="p-4 w-1/4">User Info</th><th className="p-4 w-1/4">Contact</th><th className="p-4 w-1/2">Requests</th><th className="p-4 text-right">Manage</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                    {data.length === 0 ? <tr><td colSpan={4} className="p-6 text-center text-slate-400 italic text-xs">No records.</td></tr> : 
                        data.map(contact => (
                            <tr key={contact.id} onClick={() => router.push(`/leads/${contact.id}`)} className="hover:bg-blue-50 transition-colors align-top cursor-pointer group">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 relative group-hover:border-blue-200">
                                            {contact.isConflict && <div className="absolute inset-0 bg-red-100 flex items-center justify-center z-10"><AlertOctagon className="text-red-600" size={16}/></div>}
                                            {!contact.isConflict && (contact.avatar ? <img src={contact.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer"/> : <UserCircle size={16} className="text-slate-400"/>)}
                                        </div>
                                        <div>
                                            <p className={`font-bold ${contact.isConflict ? 'text-red-600' : 'text-slate-800'} group-hover:text-blue-700`}>{contact.lastName.toUpperCase()} {contact.firstName}</p>
                                            <div className="mt-1">{contact.isRegistered && renderSubscriptionInfo(contact.subscriptionEndsAt, contact.role)}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="text-[11px] space-y-1 text-slate-600">
                                        <div className="flex items-center gap-1"><Mail size={12}/> {contact.email}</div>
                                        <div className="flex items-center gap-1"><Phone size={12}/> {contact.phone}</div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="space-y-2">
                                        {contact.requests.map((req) => (
                                            <div key={req.docId} className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex justify-between items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">{getTopicLabel(req.topic)} <span className="text-[9px] text-slate-400">{formatDate(req.createdAt)}</span></div>
                                                    <p className="text-[11px] text-slate-700 italic">"{req.message}"</p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <select 
                                                        value={req.status} 
                                                        onChange={(e) => handleStatusChange(req.docId, e.target.value)} 
                                                        onClick={(e) => e.stopPropagation()}
                                                        className={`text-[9px] font-bold p-1 rounded border outline-none cursor-pointer ${getStatusStyle(req.status)}`}
                                                    >
                                                        <option value="new">🔵 Νέο</option>
                                                        <option value="seen">👁️ Είδαν</option>
                                                        <option value="in_progress">🟡 Σε εξέλιξη</option>
                                                        <option value="answered">✅ Απαντήθηκε</option>
                                                        <option value="archived">⚪ Αρχείο</option>
                                                    </select>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteRequest(req.docId); }} className="p-1 text-slate-300 hover:text-red-500"><Trash2 size={12}/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-1">
                                        <button onClick={(e) => { e.stopPropagation(); setArchivingContact(contact); }} className="p-2 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-xl transition-all" title="Αρχειοθέτηση"><Archive size={16}/></button>
                                        <button onClick={(e) => { e.stopPropagation(); router.push(`/leads/${contact.id}`); }} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm" title="Προφίλ"><UserCog size={16}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
        </div>
    </div>
  );

  if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;
  if (authStatus !== 'authorized') return null;

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto p-4">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div><h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">CRM Leads</h1><p className="text-sm text-slate-500">Ενεργές επαφές: {activeContacts.length}</p></div>
          <div className="flex items-center gap-3 w-full md:w-auto">
             <button onClick={() => router.push('/')} className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm text-sm"><LayoutDashboard size={16}/> Dashboard</button>
             <div className="relative flex-1 md:w-64"><Search className="absolute left-3 top-2.5 text-slate-400 h-4 w-4"/><input type="text" placeholder="Αναζήτηση..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"/></div>
             <button onClick={() => router.push('/archive')} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg text-sm"><Archive size={16}/> Αρχειοθήκη <ChevronRight size={14}/></button>
          </div>
      </div>

      {/* ✅ ВКЛАДКИ (TABS) */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
          <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all border ${activeTab === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>Όλοι ({activeContacts.length})</button>
          <button onClick={() => setActiveTab('paid')} className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all border ${activeTab === 'paid' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-green-50'}`}>Συνδρομητές ({paidStudents.length})</button>
          <button onClick={() => setActiveTab('free')} className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all border ${activeTab === 'free' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-blue-50'}`}>Εγγεγραμμένοι ({freeStudents.length})</button>
          <button onClick={() => setActiveTab('leads')} className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all border ${activeTab === 'leads' ? 'bg-slate-600 text-white border-slate-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>Αιτήματα ({guestLeads.length})</button>
          <button onClick={() => setActiveTab('admins')} className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all border ${activeTab === 'admins' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-red-50'}`}>Διαχειριστές ({adminUsers.length + editorUsers.length})</button>
      </div>

      {/* SECTIONS З УМОВНИМ РЕНДЕРИНГОМ */}
      {(activeTab === 'all' || activeTab === 'admins') && (
          <>
            {adminUsers.length > 0 && renderSection("Διαχειριστές (Admins)", <ShieldAlert size={20}/>, adminUsers, "border-red-200 bg-red-50")}
            {editorUsers.length > 0 && renderSection("Συντάκτες (Editors)", <FileEdit size={20}/>, editorUsers, "border-orange-200 bg-orange-50")}
          </>
      )}
      
      {(activeTab === 'all' || activeTab === 'paid') && renderSection("Συνδρομητές (Paid Users)", <Crown size={20}/>, paidStudents, "border-green-200 bg-green-50")}
      
      {(activeTab === 'all' || activeTab === 'free') && renderSection("Εγγεγραμμένοι (Free Users)", <Users size={20}/>, freeStudents, "border-blue-200 bg-blue-50")}
      
      {(activeTab === 'all' || activeTab === 'leads') && renderSection("Αιτήματα Επισκεπτών (Leads)", <Inbox size={20}/>, guestLeads, "border-slate-200 bg-slate-50")}

      {/* ARCHIVE MODAL */}
      {archivingContact && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
                  <div className="p-6 text-center border-b border-slate-100">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500"><Archive size={32}/></div>
                      <h3 className="text-xl font-black text-slate-800 uppercase">Αρχειοθέτηση</h3>
                      <p className="text-sm text-slate-500 mt-1">Επιλέξτε την αιτία αρχειοθέτησης για τον χρήστη <br/><b>{archivingContact.email}</b></p>
                  </div>
                  <div className="p-4 grid grid-cols-1 gap-2 bg-slate-50/50">
                      {archivingContact.isRegistered ? (
                          <>
                              <button onClick={() => confirmArchive('completed')} className="flex items-center gap-3 w-full p-4 bg-white hover:bg-green-50 border border-slate-200 rounded-2xl text-left transition-all group"><div className="p-2 bg-green-100 text-green-600 rounded-lg group-hover:scale-110 transition-transform"><GraduationCap size={20}/></div><div><div className="font-bold text-slate-800">Ολοκλήρωση</div><div className="text-[10px] text-slate-400">Ολοκλήρωσαν την εκπαίδευση</div></div></button>
                              <button onClick={() => confirmArchive('paused')} className="flex items-center gap-3 w-full p-4 bg-white hover:bg-orange-50 border border-slate-200 rounded-2xl text-left transition-all group"><div className="p-2 bg-orange-100 text-orange-600 rounded-lg group-hover:scale-110 transition-transform"><PauseCircle size={20}/></div><div><div className="font-bold text-slate-800">Διακοπή</div><div className="text-[10px] text-slate-400">Διέκοψαν / Σε αναμονή</div></div></button>
                          </>
                      ) : (
                          <>
                              <button onClick={() => confirmArchive('potential')} className="flex items-center gap-3 w-full p-4 bg-white hover:bg-blue-50 border border-slate-200 rounded-2xl text-left transition-all group"><div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:scale-110 transition-transform"><Timer size={20}/></div><div><div className="font-bold text-slate-800">Ενδιαφέρον</div><div className="text-[10px] text-slate-400">Σκέφτονται / Μελλοντικά</div></div></button>
                              <button onClick={() => confirmArchive('spam')} className="flex items-center gap-3 w-full p-4 bg-white hover:bg-red-50 border border-slate-200 rounded-2xl text-left transition-all group"><div className="p-2 bg-red-100 text-red-600 rounded-lg group-hover:scale-110 transition-transform"><Skull size={20}/></div><div><div className="font-bold text-slate-800">Απόρριψη / Spam</div><div className="text-[10px] text-slate-400">Δεν ενδιαφέρεται καθόλου</div></div></button>
                          </>
                      )}
                  </div>
                  <button onClick={() => setArchivingContact(null)} className="w-full p-4 text-slate-400 font-bold hover:text-slate-600 hover:bg-slate-100 transition-colors uppercase text-xs">Ακύρωση</button>
              </div>
          </div>
      )}
    </div>
  );
}