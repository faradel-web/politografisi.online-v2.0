"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getCountFromServer } from "firebase/firestore";
import {
  ScrollText, Landmark, Globe, Palette,
  BookOpen, Headphones, Mic, Loader2,
  GraduationCap, Layers, Book, PenTool
} from "lucide-react";

// Конфігурація (Грецька)
const CATEGORIES = [
  // Knowledge (Гνώσεις)
  { id: 'history', group: 'knowledge', title: 'Ιστορία', sub: 'Ερωτήσεις Ιστορίας', icon: ScrollText, color: 'text-amber-600', bg: 'bg-amber-50', collection: 'questions_history' },
  { id: 'politics', group: 'knowledge', title: 'Πολιτικοί Θεσμοί', sub: 'Θεσμοί & Πολίτευμα', icon: Landmark, color: 'text-blue-600', bg: 'bg-blue-50', collection: 'questions_politics' },
  { id: 'geography', group: 'knowledge', title: 'Γεωγραφία', sub: 'Γεωγραφία της Ελλάδας', icon: Globe, color: 'text-emerald-600', bg: 'bg-emerald-50', collection: 'questions_geography' },
  { id: 'culture', group: 'knowledge', title: 'Πολιτισμός', sub: 'Τέχνες & Παράδοση', icon: Palette, color: 'text-pink-600', bg: 'bg-pink-50', collection: 'questions_culture' },

  // Language (Γλώσσα)
  { id: 'reading', group: 'language', title: 'Ανάγνωση', sub: 'Κατανόηση και Παραγωγή Γραπτού Λόγου', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50', collection: 'lessons_reading' },
  { id: 'listening', group: 'language', title: 'Ακρόαση', sub: 'Κατανόηση Προφορικού Λόγου', icon: Headphones, color: 'text-purple-600', bg: 'bg-purple-50', collection: 'lessons_listening' },
  { id: 'speaking', group: 'language', title: 'Παραγωγή Λόγου', sub: 'Παραγωγή Προφορικού Λόγου', icon: Mic, color: 'text-orange-600', bg: 'bg-orange-50', collection: 'lessons_speaking' },
];

export default function StudyHubPage() {
  const [practiceCounts, setPracticeCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const newCounts: Record<string, number> = {};
      try {
        await Promise.all(CATEGORIES.map(async (cat) => {
          const colRef = collection(db, cat.collection);
          const snapshot = await getCountFromServer(colRef);
          newCounts[cat.id] = snapshot.data().count;
        }));
        setPracticeCounts(newCounts);
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin h-10 w-10 text-slate-300" />
    </div>
  );

  const CategoryCard = ({ cat }: { cat: typeof CATEGORIES[0] }) => {
    const practiceCount = practiceCounts[cat.id] || 0;

    const theoryHref = `/theory/${cat.id}`;
    const practiceHref = `/practice/${cat.id}`; // unused but keeping variables safe

    return (
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className={`p-4 rounded-2xl ${cat.bg} ${cat.color}`}>
              <cat.icon className="h-7 w-7" />
            </div>
            {practiceCount > 0 && (
              <span className="bg-slate-50 px-2 py-1 rounded-lg text-[10px] font-black text-slate-400 border border-slate-100 flex items-center gap-1">
                <GraduationCap size={12} /> {practiceCount}
              </span>
            )}
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-1 leading-tight">{cat.title}</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">{cat.sub}</p>
        </div>

        {/* КНОПКИ: Тільки Θεωρία */}
        <div className="grid grid-cols-1 mt-auto">
          <Link
            href={theoryHref}
            className="flex items-center justify-center gap-2 py-3 px-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-sm transition-all shadow-sm shadow-indigo-200"
          >
            <Book size={16} />
            <span>Μελέτη</span>
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">Θεωρία</h1>
          <p className="text-slate-500 font-medium text-base md:text-lg">Επιλέξτε κατηγορία για μελέτη</p>
        </header>

        {/* БЛОК 1: Γνώσεις (Ιστορία/Πολιτισμός/) - ТЕПЕР ЗВЕРХУ */}
        <section>
          <div className="flex items-center gap-3 mb-6 px-2">
            <Layers className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-widest">Γνώσεις (Ιστορία/Πολιτικοί Θεσμοί/Γεωγραφία/Πολιτισμός)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CATEGORIES.filter(c => c.group === 'knowledge').map(cat => (<CategoryCard key={cat.id} cat={cat} />))}
          </div>
        </section>

        {/* БЛОК 2: Ελληνομάθεια (Γλώσσα) - ТЕПЕР ЗНИЗУ */}
        <section>
          <div className="flex items-center gap-3 mb-6 px-2">
            <GraduationCap className="h-6 w-6 text-purple-600" />
            <h2 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-widest">Ελληνομάθεια (Γλώσσα)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORIES.filter(c => c.group === 'language').map(cat => (<CategoryCard key={cat.id} cat={cat} />))}
          </div>
        </section>
      </div>
    </div>
  );
}