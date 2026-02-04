"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, query, getDocs, deleteDoc, doc, limit, getCountFromServer, orderBy 
} from "firebase/firestore";
import { 
  Trash2, Edit, Search, 
  History, Landmark, Globe, Palette, 
  BookOpen, Headphones, Mic, Loader2, RefreshCw, Plus,
  Layers, GraduationCap, MapPin, ListChecks, Type, CheckCircle2, Split
} from "lucide-react";
import Link from "next/link";

const CATEGORIES_CONFIG = [
  { id: 'history', label: 'Ιστορία', icon: History, collection: 'questions_history', editPath: '/admin/practice/create/history', color: 'text-amber-600', bg: 'bg-amber-50', group: 'knowledge' },
  { id: 'politics', label: 'Πολιτική', icon: Landmark, collection: 'questions_politics', editPath: '/admin/practice/create/politics', color: 'text-blue-600', bg: 'bg-blue-50', group: 'knowledge' },
  { id: 'geography', label: 'Γεωγραφία', icon: Globe, collection: 'questions_geography', editPath: '/admin/practice/create/geography', color: 'text-emerald-600', bg: 'bg-emerald-50', group: 'knowledge' },
  { id: 'culture', label: 'Πολιτισμός', icon: Palette, collection: 'questions_culture', editPath: '/admin/practice/create/culture', color: 'text-pink-600', bg: 'bg-pink-50', group: 'knowledge' },
  { id: 'reading', label: 'Ανάγνωση', icon: BookOpen, collection: 'lessons_reading', editPath: '/admin/practice/create/reading', color: 'text-indigo-600', bg: 'bg-indigo-50', group: 'language' },
  { id: 'listening', label: 'Κατανόηση', icon: Headphones, collection: 'lessons_listening', editPath: '/admin/practice/create/listening', color: 'text-purple-600', bg: 'bg-purple-50', group: 'language' },
  { id: 'speaking', label: 'Παραγωγή', icon: Mic, collection: 'lessons_speaking', editPath: '/admin/practice/create/speaking', color: 'text-orange-600', bg: 'bg-orange-50', group: 'language' },
];

// Helper: Human Readable Types
const getTypeInfo = (type: string) => {
    const t = (type || '').toUpperCase();
    if (t.includes('MAP')) return { label: 'Карта', color: 'bg-blue-100 text-blue-700', icon: MapPin };
    if (t.includes('SINGLE') || t.includes('MULTIPLE') || t.includes('CHOICE')) return { label: 'Тест', color: 'bg-slate-100 text-slate-600', icon: ListChecks };
    if (t.includes('MATCH')) return { label: 'Пари', color: 'bg-orange-100 text-orange-700', icon: Split };
    if (t.includes('FILL') || t.includes('INLINE')) return { label: 'Пропуски', color: 'bg-purple-100 text-purple-700', icon: Type };
    if (t.includes('TRUE')) return { label: 'True/False', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 };
    if (t.includes('OPEN')) return { label: 'Відкрите', color: 'bg-pink-100 text-pink-700', icon: Type };
    return { label: 'Інше', color: 'bg-gray-100 text-gray-500', icon: Layers };
};

export default function ManageContentPage() {
  const [activeTab, setActiveTab] = useState("history");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const currentConfig = CATEGORIES_CONFIG.find(c => c.id === activeTab) || CATEGORIES_CONFIG[0];

  const fetchStats = async () => {
    const newStats: Record<string, number> = {};
    try {
      await Promise.all(CATEGORIES_CONFIG.map(async (cat) => {
        const coll = collection(db, cat.collection);
        const snapshot = await getCountFromServer(coll);
        newStats[cat.id] = snapshot.data().count;
      }));
      setStats(newStats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const ref = collection(db, currentConfig.collection);
      // Сортуємо по order, ліміт 300
      const q = query(ref, orderBy("order", "asc"), limit(300));
      const snapshot = await getDocs(q);
      
      const data = snapshot.docs.map(docSnap => {
        const docData = docSnap.data();
        
        // "Розумний" пошук заголовка
        let displayTitle = docData.title 
                        || docData.question 
                        || docData.question_text 
                        || docData.prompt 
                        || docData.text 
                        || "Без заголовка";
        
        // Скорочуємо занадто довгі тексти
        if (displayTitle.length > 80) displayTitle = displayTitle.substring(0, 80) + "...";

        return {
          ...docData,
          id: docSnap.id,
          title: displayTitle,
          originalOrder: docData.order || 0
        };
      });

      setItems(data);
      fetchStats();
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleDelete = async (id: string) => {
    if (!confirm(`Ви впевнені? Це видалить запис з розділу ${currentConfig.label}`)) return;
    setDeletingId(id);
    try {
        await deleteDoc(doc(db, currentConfig.collection, id));
        setItems(prev => prev.filter(item => item.id !== id));
        fetchStats();
    } catch (error) {
        alert("Помилка видалення: " + error);
    } finally {
        setDeletingId(null);
    }
  };

  const filteredItems = items.filter(item => {
    const text = (item.title || "").toLowerCase();
    return text.includes(searchTerm.toLowerCase()) || String(item.originalOrder).includes(searchTerm);
  });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 font-sans bg-white min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black font-serif text-slate-900 tracking-tight">База Знань</h1>
            <p className="text-slate-500 font-medium mt-1">Керування контентом: <span className="text-blue-600 font-bold">{currentConfig.label}</span></p>
          </div>
          <div className="flex w-full lg:w-auto gap-3">
            <Link href={currentConfig.editPath} className="flex-1 lg:flex-none px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-blue-600 transition-all shadow-xl flex items-center justify-center gap-2">
                <Plus className="h-5 w-5"/> Додати в {currentConfig.label}
            </Link>
            <button onClick={fetchData} className="p-4 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-slate-900 shadow-sm">
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`}/>
            </button>
          </div>
      </div>

      {/* NAVIGATION GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="xl:col-span-7 space-y-3">
              <div className="flex items-center gap-2 px-1 text-slate-400 mb-2">
                  <Layers className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Теми та питання</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {CATEGORIES_CONFIG.filter(c => c.group === 'knowledge').map(cat => (
                      <TabTile 
                        key={cat.id} 
                        cat={cat} 
                        isActive={activeTab === cat.id} 
                        onClick={() => setActiveTab(cat.id)} 
                        count={stats[cat.id]} 
                      />
                  ))}
              </div>
          </div>

          <div className="xl:col-span-5 space-y-3">
              <div className="flex items-center gap-2 px-1 text-slate-400 mb-2">
                  <GraduationCap className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Мовний іспит</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {CATEGORIES_CONFIG.filter(c => c.group === 'language').map(cat => (
                      <TabTile 
                        key={cat.id} 
                        cat={cat} 
                        isActive={activeTab === cat.id} 
                        onClick={() => setActiveTab(cat.id)} 
                        count={stats[cat.id]}
                      />
                  ))}
              </div>
          </div>
      </div>

      {/* SEARCH AREA */}
      <div className="space-y-6">
          <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 group-focus-within:text-blue-500 transition-colors"/>
              <input 
                type="text" 
                placeholder={`Шукати у розділі ${currentConfig.label} (текст або номер)...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-5 rounded-3xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-300 outline-none font-bold text-slate-800 bg-white shadow-sm transition-all"
              />
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
             {loading ? (
                 <div className="h-[400px] flex items-center justify-center">
                     <Loader2 className="animate-spin text-blue-600 h-10 w-10"/>
                 </div>
             ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <tr>
                                <th className="p-6 w-20 text-center">№</th>
                                <th className="p-5">Зміст / Питання</th>
                                <th className="p-5 w-40">Тип</th>
                                <th className="p-6 w-32 text-right">Дії</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {filteredItems.map((item, index) => {
                                const typeInfo = getTypeInfo(item.type);
                                return (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-6 text-center font-mono text-slate-400 font-bold text-lg">
                                            {item.originalOrder || index + 1}
                                        </td>
                                        <td className="p-5">
                                            <div className="text-base font-serif font-bold text-slate-800 leading-snug line-clamp-2">
                                              {item.title}
                                            </div>
                                            <div className="text-[10px] text-slate-300 font-mono mt-1 flex gap-2">
                                              <span>ID: {item.id.slice(0, 6)}...</span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${typeInfo.color}`}>
                                                <typeInfo.icon size={12}/> {typeInfo.label}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all">
                                                <Link 
                                                  href={`${currentConfig.editPath}?id=${item.id}`} 
                                                  className="p-3 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                                                >
                                                  <Edit className="h-5 w-5"/>
                                                </Link>
                                                <button 
                                                  onClick={() => handleDelete(item.id)} 
                                                  className="p-3 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                                                >
                                                  <Trash2 className="h-5 w-5"/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredItems.length === 0 && (
                        <div className="p-10 text-center text-slate-400 font-medium">Нічого не знайдено.</div>
                    )}
                </div>
             )}
          </div>
      </div>
    </div>
  );
}

function TabTile({ cat, isActive, onClick, count }: { cat: any, isActive: boolean, onClick: () => void, count?: number }) {
    const Icon = cat.icon;
    return (
        <button
            onClick={onClick}
            className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${
                isActive 
                ? 'bg-white border-slate-900 shadow-lg scale-105 z-10' 
                : 'bg-white/50 border-transparent text-slate-400 hover:bg-white hover:border-slate-200'
            }`}
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isActive ? cat.bg : 'bg-slate-100'}`}>
                    <Icon className={`h-5 w-5 ${isActive ? cat.color : 'text-slate-300'}`} />
                </div>
                <span className={`text-[11px] font-black uppercase tracking-tighter truncate ${isActive ? 'text-slate-900' : ''}`}>
                    {cat.label}
                </span>
            </div>
            
            <div className={`text-[10px] font-black px-2 py-0.5 rounded-lg ml-2 ${
                isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'
            }`}>
                {count !== undefined ? count : '...'}
            </div>
        </button>
    );
}