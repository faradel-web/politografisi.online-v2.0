"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getCountFromServer } from "firebase/firestore";
import { 
  Users, FileText, BookOpen, 
  Landmark, Globe, Palette, History, 
  LayoutDashboard, ArrowRight, Loader2, Headphones, Mic,
  Edit3
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    history: 0,
    politics: 0,
    geography: 0,
    culture: 0,
    reading: 0,
    listening: 0,
    speaking: 0,
    theory: 0, 
    totalQuestions: 0,
    totalLessons: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const countColl = async (name: string) => {
          const snapshot = await getCountFromServer(collection(db, name));
          return snapshot.data().count;
        };

        const [
          users, hist, pol, geo, cul, 
          read, list, speak, theoryCount
        ] = await Promise.all([
          countColl("users"),
          countColl("questions_history"),
          countColl("questions_politics"),
          countColl("questions_geography"),
          countColl("questions_culture"),
          countColl("lessons_reading"),
          countColl("lessons_listening"),
          countColl("lessons_speaking"),
          countColl("theory_content") 
        ]);

        setStats({
          users,
          history: hist,
          politics: pol,
          geography: geo,
          culture: cul,
          reading: read,
          listening: list,
          speaking: speak,
          theory: theoryCount,
          totalQuestions: hist + pol + geo + cul,
          totalLessons: read + list + speak
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const cards = [
    { title: "Χρήστες", count: stats.users, icon: Users, color: "bg-blue-600", link: "/admin/users" },
    { title: "Ερωτήσεις", count: stats.totalQuestions, icon: FileText, color: "bg-emerald-600", link: "/admin/manage" },
    { title: "Θεωρία", count: stats.theory, icon: BookOpen, color: "bg-amber-500", link: "/admin/theory" },
  ];

  const categories = [
    { title: "Ιστορία", count: stats.history, icon: History, bg: "bg-amber-50 text-amber-600" },
    { title: "Πολιτική", count: stats.politics, icon: Landmark, bg: "bg-indigo-50 text-indigo-600" },
    { title: "Γεωγραφία", count: stats.geography, icon: Globe, bg: "bg-emerald-50 text-emerald-600" },
    { title: "Πολιτισμός", count: stats.culture, icon: Palette, bg: "bg-pink-50 text-pink-600" },
  ];

  const languageStats = [
    { title: "Κατανόηση Κειμένου (Reading)", count: stats.reading, icon: BookOpen, color: "text-indigo-500" },
    { title: "Ακρόαση (Listening)", count: stats.listening, icon: Headphones, color: "text-purple-500" },
    { title: "Παραγωγή Λόγου (Speaking)", count: stats.speaking, icon: Mic, color: "text-orange-500" },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin h-8 w-8 text-blue-500"/></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 font-sans">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg">
                <LayoutDashboard className="h-6 w-6"/>
            </div>
            <div>
                <h1 className="text-3xl font-black text-slate-900 font-serif tracking-tight">Πίνακας Ελέγχου</h1>
                <p className="text-slate-500 font-medium">Διαχείριση βάσης γνώσεων και θεωρίας</p>
            </div>
        </div>
        <div className="hidden md:block text-right">
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Κατάσταση Συστήματος</div>
            <div className="flex items-center gap-2 text-emerald-500 font-bold">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> Online
            </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => (
            <Link key={i} href={card.link} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="flex justify-between items-start mb-6">
                    <div className={`p-4 rounded-2xl text-white shadow-lg ${card.color}`}>
                        <card.icon className="h-7 w-7"/>
                    </div>
                    <div className="bg-slate-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all flex items-center gap-2">
                        Διαχείριση <ArrowRight className="h-3 w-3"/>
                    </div>
                </div>
                <div className="text-5xl font-black text-slate-900 mb-1 font-serif tracking-tight">{card.count}</div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">{card.title}</div>
            </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Банк питань */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                <FileText className="h-4 w-4"/> Τράπεζα Θεμάτων ανά Κατηγορία
            </h2>
            <div className="grid grid-cols-2 gap-4">
                {categories.map((cat, i) => (
                    <div key={i} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-50 flex items-center gap-5">
                        <div className={`p-4 rounded-2xl shadow-sm ${cat.bg}`}>
                            <cat.icon className="h-6 w-6"/>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900 font-serif">{cat.count}</div>
                            <div className="text-xs font-bold text-slate-400">{cat.title}</div>
                        </div>
                    </div>
                ))}
            </div>
          </div>

          {/* Мовний блок */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                <BookOpen className="h-4 w-4"/> Εκπαιδευτικό Υλικό
            </h2>
            <div className="space-y-4">
                {languageStats.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl group hover:bg-white transition-all">
                        <div className="flex items-center gap-4">
                            <item.icon className={`h-5 w-5 ${item.color}`}/>
                            <span className="font-bold text-slate-700">{item.title}</span>
                        </div>
                        <span className="text-xl font-black text-slate-900 font-serif">{item.count}</span>
                    </div>
                ))}
            </div>
          </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="bg-slate-900 text-white rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-blue-900/10 border border-white/5">
          <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold mb-2 font-serif">Διαχείριση Περιεχομένου</h3>
              <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                  Επεξεργαστείτε την τράπεζα ερωτήσεων, τα μαθήματα γλώσσας ή τις σημειώσεις θεωρίας.
              </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
              <Link href="/admin/theory" className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black transition-all shadow-xl shadow-emerald-600/20 active:scale-95 flex items-center gap-2">
                  <Edit3 size={18}/> Θεωρία
              </Link>
              <Link href="/admin/import" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 active:scale-95">
                  Εισαγωγή JSON
              </Link>
              <Link href="/admin/manage" className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black transition-all active:scale-95 border border-white/10">
                  Βάση Γνώσεων
              </Link>
          </div>
      </div>

    </div>
  );
}