"use client";

import Header from "@/components/Header";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // ДОДАНО: overflow-x-hidden для запобігання горизонтальному прокручуванню на мобільних
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-x-hidden">
      
      {/* Хедер (без кнопок меню) */}
      <Header />

      {/* Основний контент */}
      <main className="flex-1 w-full p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl w-full">
              {children}
          </div>
      </main>
    </div>
  );
}