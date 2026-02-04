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
    title: 'Ιστορία (Історія)', 
    desc: 'Банк питань: Тести, Дати, Події', 
    icon: ScrollText, 
    color: 'bg-amber-50 text-amber-600 border-amber-100',
    link: '/admin/practice/create/history'
  },
  { 
    id: 'politics', 
    title: 'Πολιτικοί Θεσμοί (Політика)', 
    desc: 'Банк питань: Закони, Устрій', 
    icon: Landmark, 
    color: 'bg-blue-50 text-blue-600 border-blue-100',
    link: '/admin/practice/create/politics'
  },
  { 
    id: 'culture', 
    title: 'Πολιτισμός (Культура)', 
    desc: 'Банк питань: Мистецтво, Традиції', 
    icon: Palette, 
    color: 'bg-pink-50 text-pink-600 border-pink-100',
    link: '/admin/practice/create/culture'
  },
  { 
    id: 'geography', 
    title: 'Γεωγραφία (Географія)', 
    desc: 'Банк питань + Робота з мапами', 
    icon: Globe, 
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    link: '/admin/practice/create/geography'
  },

  // ГРУПА 2: КОМПЛЕКСНІ УРОКИ
  { 
    id: 'reading', 
    title: 'Κατανόηση Γραπτού (Читання)', 
    desc: 'Текст + Тести + Есе', 
    icon: BookOpen, 
    color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    link: '/admin/practice/create/reading'
  },
  { 
    id: 'listening', 
    title: 'Κατανόηση Προφορικού (Αудіювання)', 
    desc: 'Αудіо + Тести', 
    icon: Headphones, 
    color: 'bg-purple-50 text-purple-600 border-purple-100',
    link: '/admin/practice/create/listening'
  },
  { 
    id: 'speaking', 
    title: 'Παραγωγή Προφορικού (Говоріння)', 
    desc: 'Теми для розмови + Картинки', 
    icon: Mic, 
    color: 'bg-orange-50 text-orange-600 border-orange-100',
    link: '/admin/practice/create/speaking'
  },
];

export default function PracticeHubPage() {
  return (
    <div className="min-h-screen bg-white p-6 sm:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Хедер */}
        <div className="flex items-center gap-5 mb-12">
            <Link href="/admin" className="p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all group">
                <ArrowLeft className="h-6 w-6 text-slate-400 group-hover:text-slate-900"/>
            </Link>
            <div>
                <h1 className="text-3xl font-black text-slate-900 font-serif tracking-tight">Конструктор Практики</h1>
                <p className="text-slate-500 font-medium">Оберіть розділ для створення нового завдання</p>
            </div>
        </div>

        {/* Секція Банк Питань */}
        <div className="mb-12">
            <div className="flex items-center gap-4 mb-8">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Банк Питань (Одиничні Тести)</h3>
                <div className="h-[1px] flex-1 bg-slate-100"></div>
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
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Комплексні Уроки (Текст / Медіа)</h3>
                <div className="h-[1px] flex-1 bg-slate-100"></div>
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
            className="group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
        >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border mb-6 ${section.color}`}>
                <section.icon className="h-7 w-7"/>
            </div>
            
            <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors font-serif mb-2">
                    {section.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    {section.desc}
                </p>
            </div>

            <div className="mt-8 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-slate-300 group-hover:text-blue-600 transition-colors">
                    Створити
                </span>
                <div className="p-2 rounded-full bg-slate-50 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <ArrowRight className="h-4 w-4"/>
                </div>
            </div>
        </Link>
    );
}