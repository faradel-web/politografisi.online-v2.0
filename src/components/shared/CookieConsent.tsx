"use client";

import { useState, useEffect } from "react";
import { Settings, X } from "lucide-react";
import Link from "next/link";

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem("cookie-consent");
        if (!consent) {
            // GDPR: показуємо банер, але НЕ встановлюємо згоду автоматично.
            // Cookies (Analytics, Meta Pixel) залишаються вимкненими до явної дії користувача.
            setIsVisible(true);
        }
    }, []);

    const handleSave = (status: "accepted" | "rejected") => {
        localStorage.setItem("cookie-consent", status);
        setIsVisible(false);
        setShowSettings(false);
        window.dispatchEvent(new Event('cookie-consent-changed'));
    };

    if (!isVisible && !showSettings) return null;

    return (
        <>
            {/* МІНІΜΑΛΙΣΤΙΚΟΣ БАНЕР */}
            {isVisible && !showSettings && (
                <div className="fixed bottom-4 left-4 z-[9000] animate-in fade-in slide-in-from-bottom-5">
                    <div className="bg-white/90 backdrop-blur-md border border-slate-200 shadow-lg rounded-2xl p-3 flex items-center gap-3 max-w-xs">
                        <span className="text-xs text-slate-600 font-medium">
                            Τα cookies είναι ενεργά για διαφημίσεις & αναλύσεις.
                        </span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setShowSettings(true)}
                                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
                                title="Ρυθμίσεις"
                            >
                                <Settings size={14} />
                            </button>
                            <button
                                onClick={() => setIsVisible(false)}
                                className="px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ΜΟΔΑΛ ΡΥΘΜΙΣΕΩΝ (SETTINGS) */}
            {showSettings && (
                <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl max-w-sm w-full relative">
                        <button
                            onClick={() => setShowSettings(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2"
                        >
                            <X size={16} />
                        </button>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Ρυθμίσεις Cookies</h3>
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                            Διαχειριστείτε τις προτιμήσεις σας για την περισυλλογή δεδομένων. Μάθετε περισσότερα στην <Link href="/privacy-policy" className="text-blue-600 font-bold hover:underline">Πολιτική Απορρήτου</Link>.
                        </p>

                        <div className="space-y-3 mb-8">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <div className="text-sm font-bold text-slate-800">Αναγκαία Cookies</div>
                                    <div className="text-xs text-slate-500 mt-0.5">Απαραίτητα για την πλατφόρμα</div>
                                </div>
                                <div className="text-[10px] font-black tracking-wider text-slate-400 uppercase bg-slate-200 px-2 py-1 rounded">Παντα ενεργα</div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                <div>
                                    <div className="text-sm font-bold text-blue-900">Αναλυτικά & Διαφήμιση</div>
                                    <div className="text-xs text-blue-700/60 mt-0.5">Google Analytics, Meta Pixel</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => handleSave("rejected")}
                                className="flex-1 py-3.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Απόρριψη
                            </button>
                            <button
                                onClick={() => handleSave("accepted")}
                                className="flex-1 py-3.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                            >
                                Αποδοχή όλων
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
