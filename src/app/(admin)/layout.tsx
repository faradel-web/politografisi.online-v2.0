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
  Database // ✅ Додано іконку
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

  // ✅ ФУНКЦІЯ ПЕРЕХОДУ В CRM (Оновлена для Localhost)
  const handleCrmAccess = () => {
    const isLocal = window.location.hostname === "localhost";
    const protocol = window.location.protocol;
    const host = window.location.host; 
    
    let newUrl;
    
    if (isLocal) {
        // На localhost додаємо параметр доступу, бо кукі не шаряться між піддоменами
        newUrl = `${protocol}//crm.localhost:3000?crm_access=true`; 
    } else {
        // На проді формуємо піддомен
        const cleanHost = host.replace("www.", "");
        // Також додаємо параметр для надійності
        newUrl = `${protocol}//crm.${cleanHost}?crm_access=true`;
    }

    // Перехід
    window.location.href = newUrl;
  };

  // --- 7. Лоадер ---
  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600"/>
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
        <div className="p-4 border-t border-slate-800 space-y-1">
          
          {/* ✅ КНОПКА CRM (ТІЛЬКИ ДЛЯ АДМІНА) */}
          {role === USER_ROLES.ADMIN && (
            <button 
              onClick={handleCrmAccess}
              className="w-full flex items-center gap-3 px-4 py-3 text-indigo-400 hover:bg-slate-800 rounded-xl transition-all hover:translate-x-1 mb-1 text-left font-bold"
            >
               <Database className="h-5 w-5" />
               CRM (Leads)
            </button>
          )}

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