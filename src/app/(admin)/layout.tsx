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
  Database, // ✅ Додано іконку
  BookOpen
} from "lucide-react";

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

      const role = (user as any)?.role;

      if (role !== USER_ROLES.ADMIN && role !== USER_ROLES.EDITOR) {
        router.push("/dashboard");
      }
    }
  }, [user, loading, router]);


  // --- 7. Лоадер ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  // --- 8. Захист від рендерингу ---
  if (!user) return null;

  const role = (user as any)?.role;
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
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* HEADER TOP NAVIGATION */}
      <header className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">

          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg flex-shrink-0">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-black tracking-wider text-white whitespace-nowrap">ADMIN PANEL</h1>
          </div>

          <nav className="flex items-center gap-4 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 no-scrollbar text-sm font-bold">
            {menuItems.map((item) => {
              const isActive = item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all font-medium duration-200 whitespace-nowrap ${isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}

            {/* ВЕРТИКАЛЬНА ЛІНІЯ РОЗДІЛЬНИК */}
            <div className="h-6 w-px bg-slate-700 mx-1 hidden sm:block"></div>

            {/* ✅ КНОПКА CRM (ТІЛЬКИ ДЛЯ АДМІНА) */}
            {role === USER_ROLES.ADMIN && (
              <Link
                href="/crm"
                className="flex items-center gap-1.5 px-3 py-2 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded-xl transition-all whitespace-nowrap"
              >
                <Database className="h-4 w-4" />
                CRM
              </Link>
            )}

            <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-2 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded-xl transition-all whitespace-nowrap">
              <FileText className="h-4 w-4" />
              Site
            </Link>

            <Link href="/" className="flex items-center gap-1.5 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-xl transition-all whitespace-nowrap">
              <LogOut className="h-4 w-4" />
              Έξοδος
            </Link>
          </nav>

        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-h-screen transition-all duration-300 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}