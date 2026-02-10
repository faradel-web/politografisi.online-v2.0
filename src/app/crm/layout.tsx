import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";

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
      <header className="bg-slate-900 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-black tracking-wider text-lg">
            <ShieldAlert className="text-red-500" size={24} />
            <span className="text-slate-200">POLITOGRAFISI</span>
            <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded uppercase">CRM</span>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Secure Connection • v1.0
          </div>
        </div>
      </header>

      {/* Основний контент */}
      <main className="max-w-7xl mx-auto p-6">
        {children}
      </main>
    </div>
  );
}