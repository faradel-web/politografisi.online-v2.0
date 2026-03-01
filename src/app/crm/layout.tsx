import type { Metadata } from "next";
import { ShieldAlert, LayoutDashboard, Wallet, Users, Archive, Settings } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CRM | Politografisi Admin",
  description: "Restricted Access",
  robots: "noindex, nofollow", // Важливо! Щоб Google не індексував адмінку
};

export default function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      {/* Верхня панель CRM (Тільки для адміна) */}
      <header className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/crm" className="flex items-center gap-2 font-black tracking-wider text-lg hover:opacity-80 transition-opacity">
            <ShieldAlert className="text-red-500" size={24} />
            <span className="text-slate-200">POLITOGRAFISI</span>
            <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded uppercase">CRM</span>
          </Link>

          <nav className="flex items-center gap-6 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar text-sm font-bold">
            <Link href="/crm" className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors whitespace-nowrap">
              <LayoutDashboard size={16} /> Dashboard
            </Link>
            <Link href="/crm/transactions" className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors whitespace-nowrap">
              <Wallet size={16} /> Οικονομικά
            </Link>
            <Link href="/crm/leads" className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors whitespace-nowrap">
              <Users size={16} /> Χρήστες & Leads
            </Link>
            <Link href="/crm/archive" className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors whitespace-nowrap">
              <Archive size={16} /> Αρχειοθήκη
            </Link>
            <Link href="/admin" className="flex items-center gap-1.5 text-red-400 hover:text-red-300 transition-colors whitespace-nowrap border-l border-slate-700 pl-6 ml-2">
              <Settings size={16} /> Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Основний контент */}
      <main className="max-w-7xl mx-auto p-6">
        {children}
      </main>
    </div>
  );
}