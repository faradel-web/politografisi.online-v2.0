"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { USER_ROLES } from "@/lib/constants";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Upload,
  Library,
  FileText,
  Loader2,
  Database,
  BookOpen
} from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // --- 6. ГОЛОВНИЙ ОХОРОНЕЦЬ (Оновлена логіка) ---
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/");
        return;
      }

      const role = user.role;

      if (role !== USER_ROLES.ADMIN && role !== USER_ROLES.EDITOR) {
        router.push("/dashboard");
      }
    }
  }, [user, loading, router]);


  // --- 7. Лоадер ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  // --- 8. Захист від рендерингу ---
  if (!user) return null;

  const role = user.role;
  if (role !== USER_ROLES.ADMIN && role !== USER_ROLES.EDITOR) return null;

  const menuItems = [
    {
      title: "Αρχική",
      href: "/admin",
      icon: LayoutDashboard
    },
    {
      title: "Βάση Γνώσεων",
      href: "/admin/manage",
      icon: Library
    },
    {
      title: "Θεωρία",
      href: "/admin/theory",
      icon: BookOpen
    },
    {
      title: "Χρήστες",
      href: "/admin/users",
      icon: Users
    },
    {
      title: "Εισαγωγή (JSON)",
      href: "/admin/import",
      icon: Upload
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* ADMIN HEADER — двохрядкова структура на мобільних */}
      <header className="bg-slate-900 dark:bg-slate-950 text-white shadow-md sticky top-0 z-50 border-b border-slate-700 dark:border-slate-800 pt-safe">

        {/* Рядок 1: Лого + утиліти (ніколи не переповнюється) */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-blue-600 p-1.5 rounded-lg shrink-0">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-base font-black tracking-wider text-white whitespace-nowrap">ADMIN PANEL</h1>
          </div>

          {/* Утиліти праворуч: CRM, Site, Exit, ThemeToggle */}
          <div className="flex items-center gap-0.5 shrink-0">
            {role === USER_ROLES.ADMIN && (
              <Link
                href="/crm"
                className="flex items-center gap-1 px-2 py-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-all text-xs font-bold whitespace-nowrap"
              >
                <Database className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">CRM</span>
              </Link>
            )}

            <Link
              href="/dashboard"
              className="flex items-center gap-1 px-2 py-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded-lg transition-all text-xs font-bold whitespace-nowrap"
            >
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Site</span>
            </Link>

            <Link
              href="/"
              className="flex items-center gap-1 px-2 py-1.5 text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-lg transition-all text-xs font-bold whitespace-nowrap"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Έξοδος</span>
            </Link>

            <div className="ml-1 shrink-0">
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Рядок 2: Навігація — горизонтальний скрол, ізольований від рядка 1 */}
        <nav className="flex items-center gap-1 overflow-x-auto px-3 pb-2 no-scrollbar border-t border-slate-800">
          {menuItems.map((item) => {
            const isActive = item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all text-sm font-medium duration-200 whitespace-nowrap shrink-0 ${isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.title}
              </Link>
            );
          })}
        </nav>

      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-h-screen transition-all duration-300 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}