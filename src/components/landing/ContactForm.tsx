"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Send, Loader2, CheckCircle, AlertCircle, Phone, Mail, User, HelpCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Список країн
const COUNTRY_CODES = [
  { code: "+30", country: "GR", label: "Ελλάδα (+30)" },
  { code: "+20", country: "EG", label: "Αίγυπτος (+20)" },
  { code: "+355", country: "AL", label: "Αλβανία (+355)" },
  { code: "+374", country: "AM", label: "Αρμενία (+374)" },
  { code: "+359", country: "BG", label: "Βουλγαρία (+359)" },
  { code: "+49", country: "DE", label: "Γερμανία (+49)" },
  { code: "+995", country: "GE", label: "Γεωργία (+995)" },
  { code: "+44", country: "GB", label: "Ην. Βασίλειο (+44)" },
  { code: "+1", country: "US", label: "ΗΠΑ (+1)" },
  { code: "+98", country: "IR", label: "Ιράν (+98)" },
  { code: "+972", country: "IL", label: "Ισραήλ (+972)" },
  { code: "+7", country: "KZ", label: "Καζακστάν (+7)" },
  { code: "+86", country: "CN", label: "Κίνα (+86)" },
  { code: "+357", country: "CY", label: "Κύπρος (+357)" },
  { code: "+375", country: "BY", label: "Λευκορωσία (+375)" },
  { code: "+961", country: "LB", label: "Λίβανος (+961)" },
  { code: "+880", country: "BD", label: "Μπαγκλαντές (+880)" },
  { code: "+380", country: "UA", label: "Ουκρανία (+380)" },
  { code: "+92", country: "PK", label: "Πακιστάν (+92)" },
  { code: "+48", country: "PL", label: "Πολωνία (+48)" },
  { code: "+40", country: "RO", label: "Ρουμανία (+40)" },
  { code: "+7", country: "RU", label: "Ρωσία (+7)" },
  { code: "+381", country: "RS", label: "Σερβία (+381)" },
  { code: "+63", country: "PH", label: "Φιλιππίνες (+63)" },
];

export default function ContactForm() {
  return (
    <Suspense fallback={<div className="bg-white dark:bg-slate-800 p-8 md:p-12 md:w-3/5 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>}>
      <ContactFormContent />
    </Suspense>
  );
}

function ContactFormContent() {
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    countryCode: "+30",
    phone: "",
    topic: "pack_3_months",
    message: "",
    agreeToTerms: false,
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const topicParam = searchParams.get('topic');
    if (topicParam && (topicParam === 'pack_3_months' || topicParam === 'pack_1_month' || topicParam === 'general')) {
      setFormData(prev => ({ ...prev, topic: topicParam }));
    }
  }, [searchParams]);

  const isMessageRequired = formData.topic === "general";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agreeToTerms) {
      setErrorMessage("Πρέπει να αποδεχτείτε τους Όρους Χρήσης για να συνεχίσετε.");
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage("");

    try {
      const fullPhone = `${formData.countryCode}${formData.phone.trim()}`;

      const leadData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        fullName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email.toLowerCase().trim(),
        phone: fullPhone,
        topic: formData.topic,
        message: formData.message.trim(),
        agreedToTerms: true,
        status: "new",
        source: "landing_page_form",
        createdAt: serverTimestamp(),
        deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      };

      await addDoc(collection(db, "leads"), leadData);

      // 📧 Fire-and-forget admin email notification
      fetch('/api/notify-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-secret': process.env.NEXT_PUBLIC_NOTIFICATION_SECRET || '',
        },
        body: JSON.stringify({
          fullName: leadData.fullName,
          email: leadData.email,
          phone: leadData.phone,
          topic: leadData.topic,
          message: leadData.message,
          source: leadData.source,
        }),
      }).catch(() => { }); // Silent — don't block UX

      setStatus('success');
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        countryCode: "+30",
        phone: "",
        topic: "pack_3_months",
        message: "",
        agreeToTerms: false
      });

    } catch (error) {
      console.error("Error saving lead:", error);
      setStatus('error');
      setErrorMessage("Παρουσιάστηκε σφάλμα σύνδεσης. Παρακαλώ ελέγξτε τη σύνδεσή σας ή προσπαθήστε ξανά αργότερα.");
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-white dark:bg-slate-800 p-10 md:p-16 md:w-3/5 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500 h-full min-h-[500px]">
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <CheckCircle className="h-12 w-12" />
        </div>
        <h4 className="text-3xl font-black text-blue-950 dark:text-white mb-4">Το μήνυμα ελήφθη!</h4>
        <p className="text-blue-800/70 dark:text-slate-400 text-lg max-w-md mx-auto leading-relaxed">
          Ευχαριστούμε για το ενδιαφέρον σας. Η ομάδα μας θα επικοινωνήσει μαζί σας σύντομα.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-10 px-8 py-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
        >
          Νέο μήνυμα
        </button>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500";
  const labelClass = "text-xs font-bold text-blue-900 dark:text-slate-300 uppercase flex items-center gap-1";

  return (
    <div className="bg-white dark:bg-slate-800 p-8 md:p-12 md:w-3/5" id="contact-form-container">
      <h3 className="text-2xl font-black text-blue-950 dark:text-white mb-6 md:hidden">Επικοινωνία</h3>

      <form onSubmit={handleSubmit} className="space-y-5">

        <div className="grid md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className={labelClass}>
              <User size={14} className="text-blue-400" /> Όνομα
            </label>
            <input
              type="text"
              name="firstName"
              required
              value={formData.firstName}
              onChange={handleChange}
              className={inputClass}
              placeholder="π.χ. Γιώργος"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-blue-900 dark:text-slate-300 uppercase">Επώνυμο</label>
            <input
              type="text"
              name="lastName"
              required
              value={formData.lastName}
              onChange={handleChange}
              className={inputClass}
              placeholder="π.χ. Παπαδόπουλος"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>
            <Mail size={14} className="text-blue-400" /> E-mail
          </label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className={inputClass}
            placeholder="email@example.com"
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>
            <Phone size={14} className="text-blue-400" /> Τηλέφωνο
          </label>
          <div className="flex gap-2">
            <div className="w-1/3 min-w-[110px]">
              <select
                name="countryCode"
                value={formData.countryCode}
                onChange={handleChange}
                className="w-full px-2 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm text-blue-900 dark:text-slate-100 cursor-pointer"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={`${c.code}-${c.country}`} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className={inputClass}
              placeholder="691 234 5678"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>
            <HelpCircle size={14} className="text-blue-400" /> Θέμα Ενδιαφέροντος
          </label>
          <select
            name="topic"
            value={formData.topic}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-blue-900 dark:text-slate-100 cursor-pointer appearance-none"
          >
            <option value="pack_3_months">🔹 Ενδιαφέρομαι για το πακέτο 3 Μηνών (Δημοφιλές)</option>
            <option value="pack_1_month">🔸 Ενδιαφέρομαι για το πακέτο 1 Μήνα</option>
            <option value="general">✉️ Γενική Ερώτηση / Άλλο</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-blue-900 dark:text-slate-300 uppercase flex justify-between">
            <span>Μήνυμα</span>
            {!isMessageRequired && <span className="text-slate-400 font-normal lowercase italic text-[10px]">(προαιρετικό)</span>}
          </label>
          <textarea
            name="message"
            required={isMessageRequired}
            rows={3}
            value={formData.message}
            onChange={handleChange}
            className={inputClass}
            placeholder={isMessageRequired ? "Γράψτε εδώ την ερώτησή σας..." : "Αν έχετε κάποια επιπλέον ερώτηση, γράψτε την εδώ..."}
          ></textarea>
        </div>

        {/* CHECKBOX */}
        <div className="flex items-start gap-3 mt-2">
          <div className="flex items-center h-5">
            <input
              id="terms"
              name="agreeToTerms"
              type="checkbox"
              required
              checked={formData.agreeToTerms}
              onChange={handleChange}
              className="w-5 h-5 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 focus:ring-3 focus:ring-blue-300 cursor-pointer"
            />
          </div>
          <label htmlFor="terms" className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
            Έχω διαβάσει και συμφωνώ με τους <Link href="/terms" className="text-blue-600 underline hover:text-blue-800 font-bold" target="_blank">Όρους Χρήσης</Link> και την <Link href="/privacy" className="text-blue-600 underline hover:text-blue-800 font-bold" target="_blank">Πολιτική Απορρήτου</Link>.
          </label>
        </div>

        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-sm font-bold border border-red-100 dark:border-red-800 animate-in slide-in-from-top-2">
            <AlertCircle size={20} className="shrink-0" />
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full py-4 bg-gradient-to-r from-blue-700 to-blue-600 text-white font-bold rounded-xl hover:from-blue-800 hover:to-blue-700 transition-all shadow-lg shadow-blue-200/50 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Αποστολή...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" /> Αποστολή
            </>
          )}
        </button>
      </form>
    </div>
  );
}