"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";

/**
 * AuthGuard — клієнтський компонент захисту маршрутів.
 * Перевіряє стан авторизації та перенаправляє неавторизованих на /login.
 * Виділений в окремий компонент, щоб dashboard layout залишався Server Component.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    // 🔐 Auth Guard — перенаправляємо неавторизованих на login
    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    // Показуємо лоадер поки перевіряємо авторизацію
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        );
    }

    // Захист від рендерингу до перенаправлення
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        );
    }

    return <>{children}</>;
}
