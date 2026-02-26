"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, addDoc, Timestamp, deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import {
    Loader2, Wallet, Plus, X, User, Tag, ArrowUpRight, ArrowDownRight, ArrowLeft, Trash2, Edit, Save
} from "lucide-react";

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

export default function TransactionsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [users, setUsers] = useState<UserData[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [transType, setTransType] = useState<'income' | 'expense'>('income');
    const [editingId, setEditingId] = useState<string | null>(null);

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
        const unsubUsers = onSnapshot(query(collection(db, "users")), (snap) => {
            setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserData)));
        });
        const unsubTrans = onSnapshot(query(collection(db, "transactions"), orderBy("date", "desc")), (snap) => {
            setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
            setLoading(false);
        });
        return () => { unsubUsers(); unsubTrans(); };
    }, []);

    const openAddModal = () => {
        setEditingId(null);
        setTransType('income');
        setFormData({
            amount: "",
            date: new Date().toISOString().split('T')[0],
            userId: "",
            paymentMethod: "card",
            category: "other",
            description: ""
        });
        setIsModalOpen(true);
    };

    const openEditModal = (t: Transaction) => {
        setEditingId(t.id);
        setTransType(t.type);

        let dateStr = new Date().toISOString().split('T')[0];
        const d = getValidDate(t.date);
        if (d) {
            // Adjust for local timezone
            const offset = d.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(d.getTime() - offset)).toISOString().slice(0, -1);
            dateStr = localISOTime.split('T')[0];
        }

        setFormData({
            amount: t.amount.toString(),
            date: dateStr,
            userId: t.userId || "",
            paymentMethod: t.paymentMethod || "card",
            category: t.category || "other",
            description: t.description || ""
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Είστε σίγουροι; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.")) return;
        try {
            await deleteDoc(doc(db, "transactions", id));
        } catch (e) {
            console.error(e);
            alert("Σφάλμα διαγραφής");
        }
    };

    const handleSave = async () => {
        if (!formData.amount || !formData.date) return alert("Παρακαλώ συμπληρώστε ποσό και ημερομηνία");
        try {
            const payload: any = {
                type: transType,
                amount: parseFloat(formData.amount),
                date: Timestamp.fromDate(new Date(formData.date)),
                description: formData.description || (transType === 'income' ? 'Πληρωμή' : 'Έξοδο'),
            };

            if (transType === 'income') {
                const selectedUser = users.find(u => u.id === formData.userId);
                payload.userId = formData.userId;
                payload.userName = selectedUser ? `${selectedUser.lastName || ''} ${selectedUser.firstName || ''}`.trim() : "Άγνωστος";
                payload.paymentMethod = formData.paymentMethod;
                payload.category = null;
            } else {
                payload.category = formData.category;
                payload.userId = null;
                payload.userName = null;
                payload.paymentMethod = null;
            }

            if (editingId) {
                await updateDoc(doc(db, "transactions", editingId), payload);
            } else {
                payload.createdAt = Timestamp.now();
                await addDoc(collection(db, "transactions"), payload);
            }

            setIsModalOpen(false);
        } catch (e) {
            console.error(e);
            alert("Σφάλμα αποθήκευσης");
        }
    };

    const getCategoryLabel = (cat?: string) => {
        switch (cat) {
            case 'editors': return 'Επιμελητές (Editors)';
            case 'hosting': return 'Hosting / Server';
            case 'ads': return 'Διαφήμιση (Ads)';
            case 'ai': return 'AI Tools';
            default: return 'Άλλα έξοδα';
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 pb-20 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <button onClick={() => router.push('/crm')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-2 text-sm font-bold">
                        <ArrowLeft size={16} /> Επιστροφή στο Dashboard
                    </button>
                    <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Οικονομικά</h1>
                    <p className="text-slate-500 font-medium">Διαχείριση Εσόδων & Εξόδων</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-sm hover:bg-black transition-all flex items-center gap-2"
                >
                    <Plus size={18} /> Νέα Συναλλαγή
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 hidden md:grid grid-cols-12 gap-4 text-xs font-bold text-slate-400 uppercase tracking-wide">
                    <div className="col-span-2">Ημερομηνια</div>
                    <div className="col-span-1">Τυπος</div>
                    <div className="col-span-3">Συναλλασσομενος / Κατηγορια</div>
                    <div className="col-span-3">Λεπτομερειες</div>
                    <div className="col-span-1 text-right">Ποσο</div>
                    <div className="col-span-2 text-right">Ενεργειες</div>
                </div>
                <div className="divide-y divide-slate-100">
                    {transactions.map(t => {
                        const d = getValidDate(t.date);
                        return (
                            <div key={t.id} className="p-4 md:grid grid-cols-12 gap-4 items-center hover:bg-slate-50 transition-colors">
                                <div className="col-span-2 text-sm font-medium text-slate-600 mb-2 md:mb-0">
                                    {d ? d.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                                </div>
                                <div className="col-span-1 mb-2 md:mb-0">
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {t.type === 'income' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                                    </span>
                                </div>
                                <div className="col-span-3 font-bold text-slate-800 mb-1 md:mb-0">
                                    {t.type === 'income' ? (t.userName || 'Άγνωστος (Έσοδο)') : getCategoryLabel(t.category)}
                                </div>
                                <div className="col-span-3 text-slate-500 text-sm mb-2 md:mb-0">
                                    {t.description}
                                </div>
                                <div className={`col-span-1 text-right font-black ${t.type === 'income' ? 'text-green-600' : 'text-red-600'} mb-2 md:mb-0`}>
                                    {t.type === 'income' ? '+' : '-'}€{t.amount}
                                </div>
                                <div className="col-span-2 flex justify-end gap-2">
                                    <button onClick={() => openEditModal(t)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16} /></button>
                                    <button onClick={() => handleDelete(t.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        );
                    })}
                    {transactions.length === 0 && (
                        <div className="p-10 text-center text-slate-400 italic">Δεν υπάρχουν οικονομικές συναλλαγές.</div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Wallet /> {editingId ? 'Επεξεργασία Συναλλαγής' : 'Νέα Συναλλαγή'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors"><X /></button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 rounded-xl">
                            <button type="button" onClick={() => setTransType('income')} className={`py-2 rounded-lg font-bold text-sm transition-all ${transType === 'income' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Έσοδα (In)</button>
                            <button type="button" onClick={() => setTransType('expense')} className={`py-2 rounded-lg font-bold text-sm transition-all ${transType === 'expense' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Έξοδα (Out)</button>
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

                        <button onClick={handleSave} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg mt-2 flex items-center justify-center gap-2"><Save size={18} /> Αποθήκευση</button>
                    </div>
                </div>
            )}
        </div>
    );
}
