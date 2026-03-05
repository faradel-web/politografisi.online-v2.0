"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ScrollText,
  Landmark,
  Globe,
  Palette,
  BookOpen,
  Headphones,
  Mic,
  ArrowRight
} from "lucide-react";

const SECTIONS = [
  // ГРУПА 1: БАНК ПИТАНЬ (7 розділів будуть мати свої колекції)
  {
    id: 'history',
    title: 'Ιστορία (Ιστορία)',
    desc: 'Τράπεζα ερωτήσεων: Τεστ, Ημερομηνίες, Γεγονότα',
    icon: ScrollText,
    color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800',
    link: '/admin/practice/create/history'
  },
  {
    id: 'politics',
    title: 'Πολιτικοί Θεσμοί (Πολιτικοί Θεσμοί)',
    desc: 'Τράπεζα ερωτήσεων: Νόμοι, Σύστημα',
    icon: Landmark,
    color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800',
    link: '/admin/practice/create/politics'
  },
  {
    id: 'culture',
    title: 'Πολιτισμός (Πολιτισμός)',
    desc: 'Τράπεζα ερωτήσεων: Τέχνες, Παραδόσεις',
    icon: Palette,
    color: 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-800',
    link: '/admin/practice/create/culture'
  },
  {
    id: 'geography',
    title: 'Γεωγραφία (Γεωγραφία)',
    desc: 'Τράπεζα ερωτήσεων + Λειτουργία χάρτη',
    icon: Globe,
    color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
    link: '/admin/practice/create/geography'
  },

  // ГРУПА 2: КОМПЛЕКСНІ УРОКИ
  {
    id: 'reading',
    title: 'Κατανόηση Γραπτού (Κατανόηση Γραπτού)',
    desc: 'Κείμενο + Τεστ + Έκθεση',
    icon: BookOpen,
    color: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800',
    link: '/admin/practice/create/reading'
  },
  {
    id: 'listening',
    title: 'Κατανόηση Προφορικού',
    desc: 'Ήχος + Τεστ',
    icon: Headphones,
    color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800',
    link: '/admin/practice/create/listening'
  },
  {
    id: 'speaking',
    title: 'Παραγωγή Προφορικού (Παραγωγή Προφορικού)',
    desc: 'Θέματα για συζήτηση + Εικόνες',
    icon: Mic,
    color: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800',
    link: '/admin/practice/create/speaking'
  },
];

export default function PracticeHubPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-6 sm:p-10 font-sans transition-colors">
      <div className="max-w-7xl mx-auto">

        {/* Хедер */}
        <div className="flex items-center gap-5 mb-12">
          <Link href="/admin" className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all group">
            <ArrowLeft className="h-6 w-6 text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white font-serif tracking-tight">Δημιουργός Πρακτικής</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Επιλέξετε ενότητα για τη δημιουργία νέας εργασίας</p>
          </div>
        </div>

        {/* Секція Банк Питань */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-8">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Τράπεζα Θεμάτων (Μεμονωμένα Τεστ)</h3>
            <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SECTIONS.slice(0, 4).map((section) => (
              <SectionCard key={section.id} section={section} />
            ))}
          </div>
        </div>

        {/* Секція Уроки */}
        <div>
          <div className="flex items-center gap-4 mb-8">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Ολοκληρωμένα Μαθήματα (Κείμενο / Πολυμέσα)</h3>
            <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SECTIONS.slice(4).map((section) => (
              <SectionCard key={section.id} section={section} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ section }: { section: any }) {
  return (
    <Link
      href={section.link}
      className="group bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 dark:hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border mb-6 ${section.color}`}>
        <section.icon className="h-7 w-7" />
      </div>

      <div className="flex-1">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors font-serif mb-2">
          {section.title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
          {section.desc}
        </p>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-widest text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          Δημιουργία
        </span>
        <div className="p-2 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:bg-blue-600 group-hover:text-white transition-all">
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}