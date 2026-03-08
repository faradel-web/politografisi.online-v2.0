import AuthGuard from "@/components/shared/AuthGuard";
import Header from "@/components/layout/Header";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Server Component layout — auth перевіряється в AuthGuard (client)
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 dark:text-slate-50 flex flex-col overflow-x-hidden transition-colors duration-200">

        {/* Хедер */}
        <Header />

        {/* Основний контент */}
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}