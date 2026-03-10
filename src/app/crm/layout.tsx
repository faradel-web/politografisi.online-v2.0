"use client";

import { ShieldAlert, LayoutDashboard, Wallet, Users, Archive, Settings, Loader2 } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { USER_ROLES } from "@/lib/constants";
import { useEffect } from "react";

export default function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  // 🔐 CRM доступний ТІЛЬКИ для ADMIN (не для EDITOR)
  // Якщо немає прав — повертаємо в адмінку (не на login)
  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== USER_ROLES.ADMIN) {
        router.replace("/admin");
      }
    }
  }, [user, loading, router]);

  // Показуємо лоадер поки перевіряємо авторизацію
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  // Захист від рендерингу до перенаправлення
  if (!user || user.role !== USER_ROLES.ADMIN) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  const navLinks = [
    { href: "/crm", label: "Dashboard", icon: LayoutDashboard },
    { href: "/crm/transactions", label: "Οικονομικά", icon: Wallet },
    { href: "/crm/leads", label: "Χρήστες & Leads", icon: Users },
    { href: "/crm/archive", label: "Αρχειοθήκη", icon: Archive },
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Верхня панель CRM */}
      <header className="bg-slate-900 dark:bg-slate-950 text-white shadow-md sticky top-0 z-50 border-b border-slate-700 dark:border-slate-800 pt-safe">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 p-3 md:p-4">
          <Link href="/crm" className="flex items-center gap-2 font-black tracking-wider text-lg hover:opacity-80 transition-opacity">
            <ShieldAlert className="text-red-500" size={24} />
            <span className="text-slate-200">POLITOGRAFISI</span>
            <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded uppercase">CRM</span>
          </Link>

          <nav className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar text-xs md:text-sm font-bold">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1 whitespace-nowrap transition-colors px-2.5 py-1.5 rounded-lg shrink-0 ${isActive
                    ? "text-white bg-slate-800 border border-red-500/50"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                >
                  <Icon size={16} />
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/admin"
              className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors whitespace-nowrap border-l border-slate-700 pl-3 ml-1 shrink-0"
            >
              <Settings size={16} /> Admin
            </Link>
          </nav>

          {/* Theme Toggle */}
          <div className="hidden md:block">
            <ThemeToggle />
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