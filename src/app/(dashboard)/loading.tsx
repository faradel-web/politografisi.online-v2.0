/**
 * Dashboard Loading Skeleton — показується під час завантаження сторінок dashboard.
 * Використовує skeleton-based UI для плавного UX.
 */
export default function DashboardLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Page header skeleton */}
            <div className="space-y-3">
                <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800/50 rounded-lg" />
            </div>

            {/* Cards grid skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 space-y-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl" />
                            <div className="h-5 w-32 bg-slate-100 dark:bg-slate-700 rounded-lg" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded" />
                            <div className="h-3 w-3/4 bg-slate-100 dark:bg-slate-700 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
