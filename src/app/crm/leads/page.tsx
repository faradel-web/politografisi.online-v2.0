"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { 
  Loader2, Mail, Phone, Calendar, MessageSquare, 
  Trash2, User, Search, RefreshCcw
} from "lucide-react";

// Тип даних заявки
interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string; // Для зручності, якщо є
  email: string;
  phone: string;
  topic: string;
  message: string;
  status: 'new' | 'contacted' | 'converted_to_student' | 'archived';
  createdAt: any;
  source?: string;
}

export default function CrmLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Отримання даних в реальному часі
  useEffect(() => {
    // Сортуємо: найновіші зверху
    const q = query(collection(db, "leads"), orderBy("createdAt", "desc"));
    
    // onSnapshot - це слухач, який оновлює дані миттєво, без перезавантаження сторінки
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];
      
      setLeads(leadsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Функція зміни статусу
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const leadRef = doc(db, "leads", id);
      await updateDoc(leadRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Σφάλμα κατά την ενημέρωση (Помилка оновлення)");
    }
  };

  // 3. Функція видалення
  const handleDelete = async (id: string) => {
    if (confirm("Είστε σίγουρος ότι θέλετε να διαγράψετε αυτό το αίτημα; (Видалити цей запит?)")) {
        try {
            await deleteDoc(doc(db, "leads", id));
        } catch (error) {
            console.error("Error deleting:", error);
        }
    }
  };

  // Форматування дати
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-";
    // Обробка Timestamp від Firebase
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('el-GR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  // Переклад теми (відображення для адміна)
  const getTopicLabel = (topic: string) => {
    switch (topic) {
        case 'pack_3_months': return '📦 Πακέτο 3 Μήνες';
        case 'pack_1_month': return '📦 Πακέτο 1 Μήνας';
        case 'general': return '✉️ Γενική Ερώτηση';
        default: return topic;
    }
  };

  // Колір статусу
  const getStatusColor = (status: string) => {
    switch (status) {
        case 'new': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'contacted': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        case 'converted_to_student': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'archived': return 'bg-slate-100 text-slate-500 border-slate-200';
        default: return 'bg-gray-100';
    }
  };

  // Фільтрація лідів (пошук)
  const filteredLeads = leads.filter(lead => 
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone.includes(searchTerm)
  );

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600"/></div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Вхідні Заявки (Leads)</h1>
            <p className="text-sm text-slate-500">Список усіх, хто заповнив форму на сайті</p>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 text-slate-400 h-4 w-4"/>
                <input 
                    type="text" 
                    placeholder="Αναζήτηση (Email, Tel)..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                />
             </div>
             <div className="bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 whitespace-nowrap">
                Total: {leads.length}
             </div>
          </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold tracking-wider">
                <th className="p-4 w-40">Ημερομηνία</th>
                <th className="p-4">Πελάτης</th>
                <th className="p-4">Επικοινωνία</th>
                <th className="p-4">Θέμα / Μήνυμα</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors group">
                  
                  {/* Date */}
                  <td className="p-4 whitespace-nowrap text-slate-500 font-medium">
                      <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400"/>
                          {formatDate(lead.createdAt)}
                      </div>
                  </td>

                  {/* Name */}
                  <td className="p-4">
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200">
                              <User size={14}/>
                          </div>
                          <div>
                              <p className="font-bold text-slate-800">{lead.firstName} {lead.lastName}</p>
                              {lead.status === 'new' && <span className="text-[10px] text-blue-600 font-bold animate-pulse">NEW</span>}
                          </div>
                      </div>
                  </td>

                  {/* Contact */}
                  <td className="p-4 space-y-1">
                      <div className="flex items-center gap-2 text-slate-600">
                          <Mail size={14} className="text-slate-400"/> 
                          <a href={`mailto:${lead.email}`} className="hover:text-blue-600 font-medium">{lead.email}</a>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                          <Phone size={14} className="text-slate-400"/> 
                          <a href={`tel:${lead.phone}`} className="hover:text-blue-600 font-medium">{lead.phone}</a>
                      </div>
                  </td>

                  {/* Message */}
                  <td className="p-4 max-w-xs">
                      <div className="mb-1">
                          <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600 border border-slate-200 uppercase tracking-wide">
                              {getTopicLabel(lead.topic)}
                          </span>
                      </div>
                      {lead.message && (
                          <div className="relative group/msg cursor-help">
                              <p className="text-slate-500 truncate max-w-[180px] italic">"{lead.message}"</p>
                              {/* Tooltip */}
                              <div className="absolute left-0 bottom-full mb-2 hidden group-hover/msg:block w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl z-20 leading-relaxed">
                                  {lead.message}
                              </div>
                          </div>
                      )}
                  </td>

                  {/* Status Select */}
                  <td className="p-4">
                      <select 
                          value={lead.status}
                          onChange={(e) => updateStatus(lead.id, e.target.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-300 transition-all ${getStatusColor(lead.status)}`}
                      >
                          <option value="new">🆕 Νέο (New)</option>
                          <option value="contacted">📞 Επικοινωνία (Contacted)</option>
                          <option value="converted_to_student">🎓 Μαθητής (Student)</option>
                          <option value="archived">🗄️ Αρχείο (Archived)</option>
                      </select>
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-right">
                      <button 
                          onClick={() => handleDelete(lead.id)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Delete Lead"
                      >
                          <Trash2 size={16}/>
                      </button>
                  </td>

                </tr>
              ))}

              {filteredLeads.length === 0 && (
                  <tr>
                      <td colSpan={6} className="p-12 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                              <RefreshCcw size={32} className="opacity-20"/>
                              <p>Δεν βρέθηκαν αποτελέσματα.</p>
                          </div>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}