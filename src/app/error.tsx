"use client";

import { useEffect } from "react";

/**
 * Root Error Boundary — перехоплює всі unhandled помилки в додатку.
 * Відображає user-friendly повідомлення з кнопкою повторної спроби.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Логування помилки (можна підключити Sentry/LogRocket)
        console.error("[GlobalError]", error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-6">
            <div className="max-w-md w-full text-center space-y-6">
                {/* Icon */}
                <div className="w-16 h-16 mx-auto bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>

                {/* Text */}
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                        Κάτι πήγε στραβά
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        Παρουσιάστηκε ένα απρόσμενο σφάλμα. Παρακαλούμε δοκιμάστε ξανά.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:-translate-y-0.5 active:scale-95"
                    >
                        Δοκιμάστε ξανά
                    </button>
                    <a
                        href="/"
                        className="inline-flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 px-8 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
                    >
                        Αρχική Σελίδα
                    </a>
                </div>
            </div>
        </div>
    );
}
