"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { USER_ROLES } from "@/lib/constants";
import { 
  LayoutDashboard, 
  Users, 
  LogOut,
  Upload,      
  Library,     
  FileText,
  Loader2 
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // --- 6. ГОЛОВНИЙ ОХОРОНЕЦЬ (Оновлена логіка) ---
  useEffect(() => {
    // Чекаємо завантаження Auth
    if (!loading) {
        // 1. Якщо користувач НЕ залогінений -> на Головну сторінку (Вхід)
        if (!user) {
            router.push("/");
            return;
        }

        const role = (user as any)?.role;
        
        // 2. Якщо залогінений, але НЕ Адмін і НЕ Редактор -> на Дашборд
        if (role !== USER_ROLES.ADMIN && role !== USER_ROLES.EDITOR) {
            router.push("/dashboard");
        }
    }
  }, [user, loading, router]);

  // --- 7. Лоадер ---
  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600"/>
          </div>
      );
  }

  // --- 8. Захист від рендерингу (Double Check) ---
  // Якщо ми ще тут, але користувача немає або права не ті - нічого не показуємо
  // (це запобігає "миготінню" адмін-панелі перед редіректом)
  
  if (!user) return null; // Не залогінений -> пустий екран (чекаємо редірект на /)

  const role = (user as any)?.role;
  if (role !== USER_ROLES.ADMIN && role !== USER_ROLES.EDITOR) return null; // Немає прав -> пустий екран (чекаємо редірект на /dashboard)

  // --- ОРИГІНАЛЬНЕ МЕНЮ БЕЗ ЗМІН ---
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
      title: "Εισαγωγή (JSON)", 
      href: "/admin/import",
      icon: Upload
    },
    {
      title: "Χρήστες", 
      href: "/admin/users",
      icon: Users
    }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white fixed h-full z-10 flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-center gap-2">
          <div className="bg-blue-600 p-1 rounded-lg">
            <LayoutDashboard className="h-5 w-5 text-white"/>
          </div>
          <h1 className="text-lg font-black tracking-wider text-white">ADMIN PANEL</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = item.href === "/admin" 
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium duration-200 ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20 translate-x-1" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-emerald-400 hover:bg-slate-800 rounded-xl transition-all hover:translate-x-1 mb-1">
             <FileText className="h-5 w-5" />
             Προβολή Site
          </Link>
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-800 rounded-xl transition-all hover:translate-x-1">
             <LogOut className="h-5 w-5" />
             Αποσύνδεση
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-64 min-h-screen transition-all duration-300">
        {children}
      </main>
    </div>
  );
}