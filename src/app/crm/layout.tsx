"use client";

import { ShieldAlert, LayoutDashboard, Wallet, Users, Archive, Settings } from "lucide-react";
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

  // 🔐 Сторінка /crm/login не потребує авторизації — рендеримо одразу
  const isLoginPage = pathname === "/crm/login";

  useEffect(() => {
    if (isLoginPage) return; // login сторінка завжди доступна

    if (!loading) {
      if (!user) {
        // 🔥 ВИПРАВЛЕНО: перенаправляємо на /crm/login, а не на головну
        router.push("/crm/login");
        return;
      }
      const role = user.role;
      if (role !== USER_ROLES.ADMIN && role !== USER_ROLES.EDITOR) {
        // Якщо роль не адмін/редактор — відправляємо на дешбоард
        router.push("/dashboard");
      }
    }
  }, [user, loading, router, isLoginPage]);

  // Для сторінки login — відображаємо дітей без перевірки
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading || !user || (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.EDITOR)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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
      <header className="bg-slate-900 dark:bg-slate-950 text-white p-4 shadow-md sticky top-0 z-50 border-b border-slate-700 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/crm" className="flex items-center gap-2 font-black tracking-wider text-lg hover:opacity-80 transition-opacity">
            <ShieldAlert className="text-red-500" size={24} />
            <span className="text-slate-200">POLITOGRAFISI</span>
            <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded uppercase">CRM</span>
          </Link>

          <nav className="flex items-center gap-5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar text-sm font-bold">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 whitespace-nowrap transition-colors ${isActive
                    ? "text-white border-b-2 border-red-500 pb-0.5"
                    : "text-slate-300 hover:text-white"
                    }`}
                >
                  <Icon size={16} />
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-red-400 hover:text-red-300 transition-colors whitespace-nowrap border-l border-slate-700 pl-5 ml-1"
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