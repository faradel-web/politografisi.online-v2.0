"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, addDoc, Timestamp, deleteDoc, doc, getDoc, limit } from "firebase/firestore";
import { useRouter } from "next/navigation";
import {
  Loader2, TrendingUp, TrendingDown, Wallet,
  Plus, X, User, Tag, ArrowUpRight, ArrowDownRight, Users,
  MessageSquare, UserPlus, Clock
} from "lucide-react";
import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer
} from 'recharts';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: any;
  description: string;
  userId?: string;
  userName?: string;
  paymentMethod?: string;
  category?: string;
}

interface UserData {
  id: string;
  email: string;
  lastName?: string;
  firstName?: string;
  createdAt?: any;
  timestamp?: any;
}

interface LeadData {
  id: string;
  email: string;
  firstName?: string;
  message?: string;
  createdAt?: any;
  timestamp?: any;
}

interface ActivityItem {
  id: string;
  kind: 'transaction' | 'user' | 'lead';
  date: Date;
  title: string;
  subtitle: string;
  amount?: number;
  icon: any;
  colorClass: string;
}

const getValidDate = (obj: any): Date | null => {
  if (!obj) return null;
  if (obj.toDate) return obj.toDate();
  if (obj instanceof Date) return obj;
  if (typeof obj === 'string') {
    const d = new Date(obj);
    if (!isNaN(d.getTime())) return d;
  }

  const val = obj.createdAt || obj.timestamp || obj.date;
  if (!val) return null;
  if (val.toDate) return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === 'string') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

export default function CrmDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [leads, setLeads] = useState<LeadData[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transType, setTransType] = useState<'income' | 'expense'>('income');
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split('T')[0],
    userId: "",
    paymentMethod: "card",
    category: "other",
    description: ""
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push('/login');
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!['admin', 'editor'].includes(snap.data()?.role)) router.push('/login');
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    setLoading(true);
    const unsubUsers = onSnapshot(query(collection(db, "users"), orderBy("createdAt", "desc"), limit(20)), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserData)));
    });
    const unsubLeads = onSnapshot(query(collection(db, "leads"), orderBy("createdAt", "desc"), limit(20)), (snap) => {
      setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() } as LeadData)));
    });
    const unsubTrans = onSnapshot(query(collection(db, "transactions"), orderBy("date", "desc"), limit(20)), (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    });
    return () => { unsubUsers(); unsubLeads(); unsubTrans(); };
  }, []);

  useEffect(() => {
    if (transactions.length === 0 && users.length === 0 && leads.length === 0) {
      setLoading(false);
      return;
    }

    const rawActivities: ActivityItem[] = [];

    transactions.forEach(t => {
      const date = getValidDate(t.date) || new Date();
      let categoryLabel = t.category;
      if (t.type === 'expense') {
        switch (t.category) {
          case 'editors': categoryLabel = 'Επιμελητές (Editors)'; break;
          case 'hosting': categoryLabel = 'Hosting / Server'; break;
          case 'ads': categoryLabel = 'Διαφήμιση (Ads)'; break;
          case 'ai': categoryLabel = 'AI Tools'; break;
          default: categoryLabel = 'Άλλα έξοδα';
        }
      }
      rawActivities.push({
        id: t.id,
        kind: 'transaction',
        date: date,
        title: t.type === 'income' ? (t.userName || 'Έσοδα') : (categoryLabel || 'Έξοδα'),
        subtitle: t.description,
        amount: t.type === 'income' ? t.amount : -t.amount,
        icon: t.type === 'income' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />,
        colorClass: t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
      });
    });

    users.forEach(u => {
      const date = getValidDate(u);
      if (date) {
        rawActivities.push({
          id: u.id,
          kind: 'user',
          date: date,
          title: `${u.lastName || ''} ${u.firstName || ''}`.trim() || u.email,
          subtitle: 'Νέα εγγραφή σπουδαστή',
          icon: <UserPlus size={18} />,
          colorClass: 'bg-blue-100 text-blue-600'
        });
      }
    });

    leads.forEach(l => {
      const date = getValidDate(l);
      if (date) {
        rawActivities.push({
          id: l.id,
          kind: 'lead',
          date: date,
          title: l.firstName || l.email,
          subtitle: l.message ? `"${l.message.substring(0, 40)}..."` : 'Νέο μήνυμα',
          icon: <MessageSquare size={18} />,
          colorClass: 'bg-purple-100 text-purple-600'
        });
      }
    });

    rawActivities.sort((a, b) => b.date.getTime() - a.date.getTime());
    setActivities(rawActivities);
    setLoading(false);
  }, [transactions, users, leads]);

  // ✅ ОНОВЛЕНА ФУНКЦІЯ: Передаємо ID в URL
  const handleActivityClick = (item: ActivityItem) => {
    if (item.kind === 'user' || item.kind === 'lead') {
      // Ми додаємо параметр ?id=... до посилання
      router.push(`/leads?id=${item.id}`);
    }
  };

  const handleAddTransaction = async () => {
    if (!formData.amount || !formData.date) return alert("Παρακαλώ συμπληρώστε ποσό και ημερομηνία");
    try {
      const payload: any = {
        type: transType,
        amount: parseFloat(formData.amount),
        date: Timestamp.fromDate(new Date(formData.date)),
        description: formData.description || (transType === 'income' ? 'Πληρωμή' : 'Έξοδο'),
        createdAt: Timestamp.now()
      };
      if (transType === 'income') {
        const selectedUser = users.find(u => u.id === formData.userId);
        payload.userId = formData.userId;
        payload.userName = selectedUser ? `${selectedUser.lastName || ''} ${selectedUser.firstName || ''}` : "Άγνωστος";
        payload.paymentMethod = formData.paymentMethod;
      } else {
        payload.category = formData.category;
      }
      await addDoc(collection(db, "transactions"), payload);
      setIsModalOpen(false);
      setFormData({ ...formData, amount: "", description: "" });
    } catch (e) { console.error(e); alert("Σφάλμα αποθήκευσης"); }
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const chartData = transactions.slice(0, 10).reverse().map(t => ({
    name: '',
    inc: t.type === 'income' ? t.amount : 0,
    exp: t.type === 'expense' ? t.amount : 0,
  }));

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 pb-20 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Dashboard</h1>
          <p className="text-slate-500 font-medium">Επισκόπηση & Οικονομικά</p>
        </div>
        <button
          onClick={() => router.push('/crm/leads')}
          className="px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
        >
          <Users size={18} /> Όλοι οι Χρήστες
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 min-h-[500px]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 rounded-full"><Clock size={20} className="text-slate-600" /></div>
              <h2 className="text-xl font-black text-slate-800 uppercase">Πρόσφατη Δραστηριότητα</h2>
            </div>

            <div className="space-y-6 relative before:absolute before:left-[19px] before:top-10 before:bottom-0 before:w-[2px] before:bg-slate-100">
              {activities.map((item) => (
                <div
                  key={`${item.kind}-${item.id}`}
                  onClick={() => handleActivityClick(item)}
                  className={`relative flex gap-4 items-start group ${item.kind !== 'transaction' ? 'cursor-pointer' : ''}`}
                >
                  <div className={`relative z-10 shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm ${item.colorClass}`}>
                    {item.icon}
                  </div>

                  <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all group-hover:bg-white group-hover:shadow-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-800 text-sm md:text-base group-hover:text-blue-600 transition-colors">{item.title}</p>
                        <p className="text-slate-500 text-xs md:text-sm mt-0.5">{item.subtitle}</p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100 whitespace-nowrap">
                        {item.date.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {item.kind === 'transaction' && item.amount !== undefined && (
                      <div className={`mt-2 font-black text-lg ${item.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.amount > 0 ? '+' : ''}€{item.amount}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {activities.length === 0 && <div className="text-center py-10 text-slate-400 italic">Δεν υπάρχει δραστηριότητα...</div>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <button onClick={() => setIsModalOpen(true)} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-lg hover:bg-black transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 active:scale-95"><Plus size={24} /> <span>Νέα Συναλλαγή</span></button>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-green-100 shadow-sm">
              <div className="p-2 bg-green-50 w-fit rounded-xl mb-3 text-green-600"><TrendingUp size={20} /></div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Έσοδα</p>
              <p className="text-xl font-black text-slate-800">€{totalIncome}</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-red-100 shadow-sm">
              <div className="p-2 bg-red-50 w-fit rounded-xl mb-3 text-red-600"><TrendingDown size={20} /></div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Έξοδα</p>
              <p className="text-xl font-black text-slate-800">€{totalExpense}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800">Επισκόπηση</h3>
              <span className={`text-xs font-black px-2 py-1 rounded-lg ${totalIncome - totalExpense >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>{totalIncome - totalExpense >= 0 ? '+' : ''}€{totalIncome - totalExpense}</span>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis hide /><Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} /><Bar dataKey="inc" fill="#22c55e" radius={[4, 4, 4, 4]} barSize={8} /><Bar dataKey="exp" fill="#ef4444" radius={[4, 4, 4, 4]} barSize={8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Wallet /> Νέα Συναλλαγή</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors"><X /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 rounded-xl">
              <button onClick={() => setTransType('income')} className={`py-2 rounded-lg font-bold text-sm transition-all ${transType === 'income' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Έσοδα (In)</button>
              <button onClick={() => setTransType('expense')} className={`py-2 rounded-lg font-bold text-sm transition-all ${transType === 'expense' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Έξοδα (Out)</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">ΠΟΣΟ (€)</label><input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-slate-900 transition-all" /></div>
              <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">ΗΜΕΡΟΜΗΝΙΑ</label><input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-slate-900 transition-all" /></div>
            </div>
            {transType === 'income' ? (
              <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">ΣΠΟΥΔΑΣΤΗΣ</label><div className="relative"><User className="absolute left-3 top-3.5 text-slate-400" size={16} /><select value={formData.userId} onChange={(e) => setFormData({ ...formData, userId: e.target.value })} className="w-full pl-10 p-3 bg-slate-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-slate-900 appearance-none"><option value="">Επιλογή...</option>{users.map(u => <option key={u.id} value={u.id}>{u.lastName} {u.firstName}</option>)}</select></div></div>
            ) : (
              <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">ΚΑΤΗΓΟΡΙΑ</label><div className="relative"><Tag className="absolute left-3 top-3.5 text-slate-400" size={16} /><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full pl-10 p-3 bg-slate-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-slate-900 appearance-none"><option value="editors">Επιμελητές</option><option value="hosting">Hosting</option><option value="ads">Διαφήμιση</option><option value="ai">AI Tools</option><option value="other">Άλλα</option></select></div></div>
            )}
            <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">ΣΧΟΛΙΑ</label><input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Λεπτομέρειες..." className="w-full p-3 bg-slate-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-slate-900" /></div>
            <button onClick={handleAddTransaction} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg mt-2">Αποθήκευση</button>
          </div>
        </div>
      )}
    </div>
  );
}