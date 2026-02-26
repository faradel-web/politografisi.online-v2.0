"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc, Timestamp, deleteDoc } from "firebase/firestore";
import {
    Loader2, ArrowLeft, Phone, Calendar,
    User, Shield, CreditCard, MessageSquare,
    Save, CheckCircle, AlertOctagon, UserCircle, Trash2
} from "lucide-react";

// Τύποςи
interface UserProfile {
    id: string;
    type: 'user' | 'lead';
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: string;
    createdAt: any;
    subscriptionEndsAt?: any;
    isArchived: boolean;
    photoURL?: string;
}

interface Transaction {
    id: string;
    amount: number;
    type: 'income' | 'expense';
    date: any;
    description: string;
}

interface Message {
    id: string;
    text: string;
    date: any;
    topic: string;
    status: string;
}

export default function UserProfilePage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'finance' | 'history'>('overview');

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ firstName: "", lastName: "", phone: "", role: "student", subDate: "" });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Users
                let userSnap = await getDoc(doc(db, "users", id));
                let type: 'user' | 'lead' = 'user';
                let data = userSnap.data();

                // 2. Leads
                if (!userSnap.exists()) {
                    userSnap = await getDoc(doc(db, "leads", id));
                    if (userSnap.exists()) {
                        type = 'lead';
                        data = userSnap.data();
                    } else {
                        alert("Ο χρήστης δεν βρέθηκε");
                        router.push('/crm/leads');
                        return;
                    }
                }

                // 3. Profile
                const p: UserProfile = {
                    id: id,
                    type: type,
                    email: data?.email || "",
                    firstName: data?.firstName || data?.displayName?.split(' ')[0] || "Άγνωστος",
                    lastName: data?.lastName || data?.displayName?.split(' ').slice(1).join(' ') || "",
                    phone: data?.phoneNumber || data?.phone || "-",
                    role: data?.role || "guest",
                    createdAt: data?.createdAt,
                    subscriptionEndsAt: data?.subscriptionEndsAt,
                    isArchived: data?.isArchived || data?.status === 'archived',
                    // 🔥 Пошук фото у всіх можливих полях
                    photoURL: data?.photoURL || data?.avatar || data?.avatarUrl || data?.image || ""
                };

                setProfile(p);
                setEditForm({
                    firstName: p.firstName,
                    lastName: p.lastName,
                    phone: p.phone,
                    role: p.role,
                    subDate: p.subscriptionEndsAt ? new Date(p.subscriptionEndsAt.toDate()).toISOString().split('T')[0] : ""
                });

                // 4. Transactions
                if (type === 'user') {
                    const qTrans = query(collection(db, "transactions"), where("userId", "==", id), orderBy("date", "desc"));
                    const transSnaps = await getDocs(qTrans);
                    setTransactions(transSnaps.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
                }

                // 5. Messages
                if (p.email) {
                    const qMsgs = query(collection(db, "leads"), where("email", "==", p.email), orderBy("createdAt", "asc"));
                    const msgSnaps = await getDocs(qMsgs);
                    setMessages(msgSnaps.docs.map(d => ({
                        id: d.id,
                        text: d.data().message,
                        date: d.data().createdAt,
                        topic: d.data().topic,
                        status: d.data().status || 'new'
                    } as Message)));
                }

                setLoading(false);
            } catch (e) { console.error(e); }
        };
        fetchData();
    }, [id, router]);

    // --- ACTIONS ---

    const handleSave = async () => {
        if (!profile) return;
        try {
            const ref = doc(db, profile.type === 'user' ? "users" : "leads", id);
            const updateData: any = {
                firstName: editForm.firstName,
                lastName: editForm.lastName,
                [profile.type === 'user' ? 'phoneNumber' : 'phone']: editForm.phone,
            };

            if (profile.type === 'user') {
                updateData.displayName = `${editForm.firstName} ${editForm.lastName}`.trim();
                updateData.role = editForm.role;

                if (editForm.subDate) {
                    // 🔥 ВАЖЛИВО: Встановлюємо 23:59:59 для коректної роботи підписки
                    const newDate = new Date(editForm.subDate);
                    newDate.setHours(23, 59, 59, 999);
                    updateData.subscriptionEndsAt = Timestamp.fromDate(newDate);
                } else {
                    updateData.subscriptionEndsAt = null;
                }
            }

            await updateDoc(ref, updateData);

            // Оновлюємо стейт
            const updatedSubDate = editForm.subDate ? Timestamp.fromDate(new Date(new Date(editForm.subDate).setHours(23, 59, 59, 999))) : null;

            setProfile({ ...profile, ...editForm, subscriptionEndsAt: updatedSubDate });
            setIsEditing(false);
            alert("Επιτυχής αποθήκευση!");
        } catch (e) { console.error(e); alert("Σφάλμα κατά την αποθήκευση"); }
    };

    // Оновлення статусу повідомлення
    const handleMessageStatusChange = async (msgId: string, newStatus: string) => {
        try {
            const msgRef = doc(db, "leads", msgId);
            await updateDoc(msgRef, { status: newStatus });
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: newStatus } : m));
        } catch (error) {
            console.error(error);
            alert("Σφάλμα ενημέρωσης κατάστασης");
        }
    };

    // Видалення повідомлення
    const handleDeleteMessage = async (msgId: string) => {
        if (!confirm("Διαγραφή μηνύματος;")) return;
        try {
            await deleteDoc(doc(db, "leads", msgId));
            setMessages(prev => prev.filter(m => m.id !== msgId));
        } catch (error) {
            console.error(error);
            alert("Σφάλμα διαγραφής");
        }
    };

    // --- HELPERS ---

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'admin': return 'Διαχειριστής (Admin)';
            case 'editor': return 'Συντάκτης (Editor)';
            case 'student': return 'Σπουδαστής (Student)';
            default: return 'Επισκέπτης (Guest)';
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'new': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'seen': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'in_progress': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'answered': return 'bg-green-50 text-green-700 border-green-200';
            case 'archived': return 'bg-slate-100 text-slate-400 border-slate-200';
            default: return 'bg-white text-slate-600 border-slate-200';
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
    if (!profile) return null;

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 pb-20">

            {/* HEADER */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.push('/crm/leads')} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                    <ArrowLeft size={20} className="text-slate-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                        {profile.lastName.toUpperCase()} {profile.firstName}
                        {profile.isArchived && <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-1 rounded-lg border font-bold">ARCHIVED</span>}
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">{profile.email}</p>
                </div>
                <div className="ml-auto flex gap-2">
                    {isEditing ? (
                        <>
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-xl transition-colors">Ακύρωση</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"><Save size={18} /> Αποθήκευση</button>
                        </>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="px-6 py-2 bg-white text-slate-700 border border-slate-200 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm text-sm">
                            Επεξεργασία
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* ЛІВА КОЛОНКА */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="flex justify-center mb-6">
                            <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 border-4 border-white shadow-lg overflow-hidden relative">
                                {profile.photoURL ? (
                                    <img
                                        src={profile.photoURL}
                                        alt="avatar"
                                        referrerPolicy="no-referrer" // Критично для Google
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('bg-slate-100'); }}
                                    />
                                ) : (<UserCircle size={64} className="text-slate-300" />)}
                                {!profile.photoURL && <UserCircle size={64} className="absolute text-slate-300" />}
                            </div>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ρόλος (Role)</label>
                                {isEditing && profile.type === 'user' ? (
                                    <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm mt-1 outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="student">Σπουδαστής</option><option value="editor">Συντάκτης</option><option value="admin">Διαχειριστής</option>
                                    </select>
                                ) : (
                                    <div className="flex items-center gap-2 mt-1"><Shield size={16} className="text-blue-600" /><span className="font-bold text-slate-800">{getRoleLabel(profile.role)}</span></div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Όνομα</label>{isEditing ? (<input type="text" value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm mt-1 outline-none focus:ring-2 focus:ring-blue-500" />) : <p className="font-bold text-slate-800">{profile.firstName}</p>}</div>
                                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Επώνυμο</label>{isEditing ? (<input type="text" value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm mt-1 outline-none focus:ring-2 focus:ring-blue-500" />) : <p className="font-bold text-slate-800">{profile.lastName}</p>}</div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Τηλέφωνο</label>
                                {isEditing ? (<input type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm mt-1 outline-none focus:ring-2 focus:ring-blue-500" />) : (<div className="flex items-center gap-2 mt-1 text-slate-700 font-medium"><Phone size={16} className="text-slate-400" /> {profile.phone}</div>)}
                            </div>
                            {profile.type === 'user' && (
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Λήξη Συνδρομής</label>
                                    {isEditing ? (<input type="date" value={editForm.subDate} onChange={e => setEditForm({ ...editForm, subDate: e.target.value })} className="w-full p-2 bg-green-50 rounded-xl border border-green-200 font-bold text-sm mt-1 text-green-800 outline-none focus:ring-2 focus:ring-green-500" />) : (<div className={`flex items-center gap-2 mt-1 font-bold ${profile.subscriptionEndsAt && profile.subscriptionEndsAt.toDate() > new Date() ? 'text-green-600' : 'text-red-500'}`}><Calendar size={16} /> {profile.subscriptionEndsAt ? new Date(profile.subscriptionEndsAt.toDate()).toLocaleDateString('el-GR') : "Ανενεργή"}</div>)}
                                </div>
                            )}
                            <div className="pt-4 border-t border-slate-100">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ημερομηνία Εγγραφής</label>
                                <p className="text-sm font-medium text-slate-600 mt-1">{profile.createdAt ? new Date(profile.createdAt.toDate ? profile.createdAt.toDate() : profile.createdAt).toLocaleDateString('el-GR') : "-"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ПРАВА КОЛОНКА */}
                <div className="lg:col-span-2 space-y-6">

                    <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
                        <button onClick={() => setActiveTab('overview')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-white shadow-md text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Επισκόπηση</button>
                        <button onClick={() => setActiveTab('history')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white shadow-md text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Ιστορικό Μηνυμάτων</button>
                        {profile.type === 'user' && <button onClick={() => setActiveTab('finance')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'finance' ? 'bg-white shadow-md text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Οικονομικά</button>}
                    </div>

                    {/* OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[300px]">
                            <div className={`p-4 rounded-full mb-4 ${profile.isArchived ? 'bg-slate-100 text-slate-400' : 'bg-green-50 text-green-600'}`}>{profile.isArchived ? <AlertOctagon size={32} /> : <CheckCircle size={32} />}</div>
                            <h3 className="text-xl font-black text-slate-800">Κατάσταση: {profile.isArchived ? "Αρχειοθετημένος" : "Ενεργός"}</h3>
                            <p className="text-slate-500 max-w-sm mt-2 text-sm">Συνοπτική εικόνα της δραστηριότητας του χρήστη.</p>
                        </div>
                    )}

                    {/* HISTORY (MESSAGES) */}
                    {activeTab === 'history' && (
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm min-h-[300px]">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase text-sm tracking-wide"><MessageSquare size={18} /> Ιστορικό Επικοινωνίας</h3>
                            <div className="space-y-4">
                                {messages.map(m => (
                                    <div key={m.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-bold uppercase bg-white border border-slate-200 px-2 py-1 rounded text-slate-500 tracking-wide">{m.topic}</span>
                                            <span className="text-[10px] font-bold text-slate-400">{new Date(m.date.toDate()).toLocaleString('el-GR')}</span>
                                        </div>
                                        <p className="text-sm text-slate-700 font-medium leading-relaxed mb-3">"{m.text}"</p>

                                        {/* УПРАВЛІННЯ ПОВІДОМЛЕННЯМ */}
                                        <div className="flex justify-end items-center gap-2 border-t border-slate-200 pt-3">
                                            <select
                                                value={m.status}
                                                onChange={(e) => handleMessageStatusChange(m.id, e.target.value)}
                                                className={`text-[10px] font-bold py-1.5 px-2 rounded-lg border outline-none cursor-pointer ${getStatusStyle(m.status)}`}
                                            >
                                                <option value="new">🔵 Νέο</option>
                                                <option value="seen">👁️ Είδαν</option>
                                                <option value="in_progress">🟡 Σε εξέλιξη</option>
                                                <option value="answered">✅ Απαντήθηκε</option>
                                                <option value="archived">⚪ Αρχείο</option>
                                            </select>
                                            <button onClick={() => handleDeleteMessage(m.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {messages.length === 0 && <p className="text-center text-slate-400 italic py-10 font-medium">Δεν βρέθηκαν μηνύματα</p>}
                            </div>
                        </div>
                    )}

                    {/* FINANCE */}
                    {activeTab === 'finance' && profile.type === 'user' && (
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm min-h-[300px]">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase text-sm tracking-wide"><CreditCard size={18} /> Ιστορικό Πληρωμών</h3>
                            <table className="w-full text-left text-sm">
                                <thead className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 bg-slate-50/50">
                                    <tr><th className="p-4 rounded-tl-xl">Ημερομηνία</th><th className="p-4">Περιγραφή</th><th className="p-4 text-right rounded-tr-xl">Ποσό</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {transactions.map(t => (
                                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 text-slate-500 font-medium">{new Date(t.date.toDate()).toLocaleDateString('el-GR')}</td>
                                            <td className="p-4 font-bold text-slate-700">{t.description}</td>
                                            <td className="p-4 text-right font-black text-green-600">+€{t.amount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {transactions.length === 0 && <p className="text-center text-slate-400 italic py-10 font-medium">Δεν υπάρχουν συναλλαγές</p>}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}