import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "404 — Η σελίδα δεν βρέθηκε",
    description: "Η σελίδα που αναζητήσατε δεν υπάρχει ή έχει μετακινηθεί.",
};

export default function NotFoundPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center px-6 font-sans">
            <div className="max-w-md w-full text-center space-y-8">
                {/* 404 Number */}
                <div className="relative">
                    <span className="text-[160px] sm:text-[200px] font-black text-slate-100 dark:text-slate-900 leading-none select-none block">
                        404
                    </span>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.3-4.3" />
                                <path d="M8 11h6" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Text */}
                <div className="space-y-3">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                        Η σελίδα δεν βρέθηκε
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        Η σελίδα που αναζητήσατε δεν υπάρχει, έχει μετακινηθεί ή δεν είναι πλέον διαθέσιμη.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3 px-8 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-100 transition-all duration-200 shadow-lg hover:-translate-y-0.5 active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        Αρχική Σελίδα
                    </Link>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 px-8 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
                    >
                        Πίνακας Ελέγχου
                    </Link>
                </div>
            </div>
        </div>
    );
}
