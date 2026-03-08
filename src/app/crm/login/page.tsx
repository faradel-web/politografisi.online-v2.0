"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * /crm/login більше не використовується.
 * CRM доступний тільки через адмінку (/admin → CRM кнопка).
 * Цей файл просто перенаправляє на /admin.
 */
export default function CrmLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
    </div>
  );
}