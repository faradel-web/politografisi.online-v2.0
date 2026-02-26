import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import ContactForm from "@/components/landing/ContactForm"; // ✅ Імпорт нової форми
import {
  BookOpen, GraduationCap, Headphones, Users, ArrowRight, ShieldCheck,
  Laptop, Check, Mail, MessageSquare, MonitorPlay, Bot, Mic, PenTool,
  Repeat, ChevronDown
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Προετοιμασία για Εξετάσεις Πολιτογράφησης 2026 | Politografisi.online",
  description: "Η Νο1 πλατφόρμα προετοιμασίας για το Πιστοποιητικό Επάρκειας Γνώσεων για Πολιτογράφηση (ΠΕΓΠ) 2026. Επίσημη τράπεζα θεμάτων, Τεστ, Βίντεο, Ήχος και AI Προσομοιώσεις.",
  keywords: ["εξετάσεις πολιτογράφησης", "ΠΕΓΠ", "τράπεζα θεμάτων 2026", "υπουργείο εσωτερικών", "εξετάσεις ιθαγένειας", "τεστ ελληνομάθειας", "ερωτήσεις πολιτογράφησης", "άδεια διαμονής", "ελληνική ιθαγένεια", "politografisi online"],
  openGraph: {
    title: "Προετοιμασία για Εξετάσεις Πολιτογράφησης 2026 | Politografisi.online",
    description: "Η νούμερο 1 πλατφόρμα προετοιμασίας για τις εξετάσεις του ΠΕΓΠ. Λύστε τα θέματα της Τράπεζας του Υπουργείου Εσωτερικών.",
    url: "https://politografisi.online",
    siteName: "Politografisi.online",
    locale: "el_GR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Προετοιμασία Πολιτογράφησης 2026",
    description: "Η Νο1 πλατφόρμα για τις εξετάσεις ιθαγένειας (ΠΕΓΠ). 100% επιτυχία.",
  },
  alternates: {
    canonical: 'https://politografisi.online',
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans text-blue-950 selection:bg-blue-100 selection:text-blue-900">

      <Navbar />

      <main>
        {/* === JSON-LD STRUCTURED DATA === */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "name": "Politografisi.online",
                  "url": "https://politografisi.online",
                  "logo": "https://politografisi.online/favicon.ico",
                  "description": "Η Νο1 πλατφόρμα προετοιμασίας για εξετάσεις πολιτογράφησης (ΠΕΓΠ 2026).",
                },
                {
                  "@type": "Product",
                  "name": "Πακέτα Προετοιμασίας ΠΕΓΠ 2026",
                  "description": "Ολοκληρωμένα πακέτα με θεωρία του Υπουργείου Εσωτερικών, τεστ και AI εξάσκηση για τις εξετάσεις ιθαγένειας.",
                  "provider": {
                    "@type": "Organization",
                    "name": "Politografisi.online"
                  },
                  "offers": [
                    {
                      "@type": "Offer",
                      "price": "100.00",
                      "priceCurrency": "EUR",
                      "name": "1 Μήνας Premium",
                      "url": "https://politografisi.online/#pricing"
                    },
                    {
                      "@type": "Offer",
                      "price": "200.00",
                      "priceCurrency": "EUR",
                      "name": "3 Μήνες Premium",
                      "url": "https://politografisi.online/#pricing"
                    }
                  ]
                },
                {
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "Τι ακριβώς προσφέρει η πλατφόρμα;",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Η πλατφόρμα προσφέρει ολοκληρωμένη προετοιμασία για τις εξετάσεις ΠΕΓΠ 2026. Περιλαμβάνει όλη τη θεωρία, τεστ πολλαπλής επιλογής, ακουστικά μαθήματα και εργαλεία τεχνητής νοημοσύνης (AI) που διορθώνουν τις εκθέσεις και την προφορική σας εξέταση."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Είναι το υλικό ενημερωμένο;",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Ναι, η τράπεζα θεμάτων μας ανανεώνεται συνεχώς και βασίζεται 100% στην επίσημη ύλη και τα θέματα του Υπουργείου Εσωτερικών."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Μπορώ να χρησιμοποιήσω την πλατφόρμα από το κινητό;",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Φυσικά! Η πλατφόρμα είναι πλήρως σχεδιασμένη (responsive) για να λειτουργεί άψογα σε κινητά τηλέφωνα, tablets και υπολογιστές, χωρίς να χρειάζεται εφαρμογή."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Πώς λειτουργεί η συνδρομή;",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Η πληρωμή είναι εφάπαξ (μία φορά) για το χρονικό διάστημα που θα επιλέξετε (1 ή 3 μήνες). Δεν υπάρχουν κρυφές χρεώσεις και η συνδρομή ΔΕΝ ανανεώνεται αυτόματα."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Υπάρχει διορθωτής για την Έκθεση και την Ομιλία;",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Ναι! Η πλατφόρμα μας ενσωματώνει προηγμένη Τεχνητή Νοημοσύνη (AI) που βαθμολογεί και διορθώνει αυτόματα τα κείμενά σας (έκθεση) αλλά και τα ηχητικά σας μηνύματα (ομιλία), δίνοντας εξατομικευμένες συμβουλές βελτίωσης."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Μπορώ να δοκιμάσω πριν πληρώσω;",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Βεβαίως. Με τη Δωρεάν Εγγραφή σας παρέχουμε πρόσβαση γνωριμίας στην πλατφόρμα, η οποία περιλαμβάνει 1 δοκιμαστικό τεστ ανά κατηγορία, χωρίς να απαιτείται πιστωτική κάρτα."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Το υλικό απευθύνεται σε αρχάριους ή προχωρημένους;",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Το υλικό απευθύνεται σε άτομα που κατέχουν έστω ένα βασικό (Б1+) επίπεδο της Ελληνικής Γλώσσας και θέλουν στοχευμένη προετοιμασία πάνω στα θέματα της Τράπεζας Εξετάσεων."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Πότε ενεργοποιείται ο λογαριασμός μου μετά την πληρωμή;",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Μόλις επιλέξετε το πακέτο που επιθυμείτε και ολοκληρωθεί η επικοινωνία με τους διαχειριστές μας, η Premium πρόσβαση ενεργοποιείται σχεδόν άμεσα, και μπορείτε να ξεκινήσετε τη μελέτη."
                      }
                    }
                  ]
                }
              ]
            })
          }}
        />

        {/* === 1. HERO SECTION === */}
        <section className="relative pt-24 pb-32 overflow-hidden bg-gradient-to-b from-blue-50/50 to-white">
          <div className="relative max-w-5xl mx-auto px-4 text-center">

            <div className="inline-block mb-8 animate-in fade-in zoom-in duration-700">
              <div className="h-20 w-20 bg-blue-700 text-white text-4xl font-bold flex items-center justify-center rounded-2xl mx-auto shadow-xl shadow-blue-200 transform rotate-3" aria-hidden="true">
                P
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-blue-950 mb-6 leading-tight tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              Έξυπνη προετοιμασία, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
                σίγουρη επιτυχία
              </span> στην εξέταση για απόκτηση του ΠΕΓΠ 2026
            </h1>

            <p className="text-xl text-blue-800/70 max-w-2xl mx-auto mb-10 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              Η online πλατφόρμα μας σας δίνει πρόσβαση στο πιο ολοκληρωμένο υλικό για την απόκτηση του Πιστοποιητικού Επάρκειας Γνώσεων για Πολιτογράφηση (ΠΕΓΠ).
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <Link href="/login" className="w-full sm:w-auto px-10 py-4 bg-white border-2 border-blue-100 text-blue-700 rounded-xl font-bold text-lg hover:border-blue-600 hover:shadow-lg transition-all flex items-center justify-center gap-2 group">
                Είσοδος <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/register" className="w-full sm:w-auto px-10 py-4 bg-blue-700 text-white border-2 border-transparent rounded-xl font-bold text-lg hover:bg-blue-800 hover:shadow-xl hover:-translate-y-1 transition-all">
                Ξεκινήστε δωρεάν την έξυπνη προετοιμασία
              </Link>
            </div>

            <div className="mt-16 pt-8 border-t border-blue-50 flex flex-wrap justify-center gap-8 md:gap-16 text-blue-900/40 font-bold text-sm uppercase tracking-wider animate-in fade-in duration-1000 delay-500">
              <div className="flex items-center gap-2"><Users className="h-5 w-5" /> 100% Αυτοπεποίθηση</div>
              <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Υλικό Υπουργείου</div>
              <div className="flex items-center gap-2"><Laptop className="h-5 w-5" /> Online 24/7</div>
            </div>
          </div>
        </section>

        {/* === 2. ΠΛΕΟΝΕΚΤΗΜΑΤΑ (PLATFORM) === */}
        <section id="platform" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-blue-600 font-bold tracking-wide uppercase text-sm mb-3">Τι περιλαμβάνεται στην πλατφόρμα</h2>
              <h3 className="text-3xl md:text-4xl font-black text-blue-950">Το Κλειδί της Επιτυχίας για το 2026</h3>
              <p className="mt-4 text-blue-800/60 max-w-2xl mx-auto">Η online πλατφόρμα μας σας δίνει πρόσβαση στο πιο ολοκληρωμένο υλικό για το Πιστοποιητικό Επάρκειας Γνώσεων για Πολιτογράφηση (ΠΕΓΠ).</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">

              {/* 1. Πλήρες Υλικό */}
              <div className="group bg-blue-50/50 rounded-3xl p-8 border border-blue-100 hover:bg-white hover:shadow-xl hover:shadow-blue-100/50 hover:border-blue-200 transition-all duration-300">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-white rounded-2xl flex-shrink-0 flex items-center justify-center text-blue-700 shadow-sm mb-6 group-hover:scale-110 transition-transform">
                    <MonitorPlay className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-blue-900 mb-2">Πλήρες Υλικό 360°</h4>
                    <p className="text-blue-800/70 leading-relaxed text-sm">
                      Όλη η θεωρία (Ιστορία, Γεωγραφία, Πολιτική, Πολιτισμός) και τα αρχεία για την εξάσκηση στην ακουστική κατανόηση, χωρίς ατελείωτο ψάξιμο.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Επίσημη Τράπεζα Θεμάτων */}
              <div className="group bg-indigo-50/50 rounded-3xl p-8 border border-indigo-100 hover:bg-white hover:shadow-xl hover:shadow-indigo-100/50 hover:border-indigo-200 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">OFFICIAL</div>
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-white rounded-2xl flex-shrink-0 flex items-center justify-center text-indigo-600 shadow-sm mb-6 group-hover:scale-110 transition-transform">
                    <Bot className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-blue-900 mb-2">Επίσημη Τράπεζα Θεμάτων</h4>
                    <p className="text-blue-800/70 leading-relaxed text-sm">
                      Πλήρης πρόσβαση στην ανανεωμένη τράπεζα (300 θέματα). Επίκαιρες Ερωτήσεις & Απαντήσεις και υλικό του Υπουργείου Εσωτερικών με την υποστήριξη AI.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. AI Ομιλία */}
              <div className="group bg-blue-50/50 rounded-3xl p-8 border border-blue-100 hover:bg-white hover:shadow-xl hover:shadow-blue-100/50 hover:border-blue-200 transition-all duration-300">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-white rounded-2xl flex-shrink-0 flex items-center justify-center text-blue-700 shadow-sm mb-6 group-hover:scale-110 transition-transform">
                    <Mic className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-blue-900 mb-2">Παραγωγή Προφορικού Λόγου</h4>
                    <p className="text-blue-800/70 leading-relaxed text-sm">
                      Στοχευμένη προετοιμασία για την Προφορική Εξέταση (25 θέματα). Το AI αξιολογεί την απάντησή σας για μέγιστη βελτίωση.
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. AI Έκθεση */}
              <div className="group bg-blue-50/50 rounded-3xl p-8 border border-blue-100 hover:bg-white hover:shadow-xl hover:shadow-blue-100/50 hover:border-blue-200 transition-all duration-300">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-white rounded-2xl flex-shrink-0 flex items-center justify-center text-blue-700 shadow-sm mb-6 group-hover:scale-110 transition-transform">
                    <PenTool className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-blue-900 mb-2">Παραγωγή Γραπτού Λόγου</h4>
                    <p className="text-blue-800/70 leading-relaxed text-sm">
                      Πλήρης ανάλυση και παραδείγματα για την έκθεση (100 θέματα). Γράψτε και λάβετε άμεση διόρθωση από το σύστημα.
                    </p>
                  </div>
                </div>
              </div>

              {/* 5. Ακουστικό Μέρος */}
              <div className="group bg-blue-50/50 rounded-3xl p-8 border border-blue-100 hover:bg-white hover:shadow-xl hover:shadow-blue-100/50 hover:border-blue-200 transition-all duration-300">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-white rounded-2xl flex-shrink-0 flex items-center justify-center text-blue-700 shadow-sm mb-6 group-hover:scale-110 transition-transform">
                    <Headphones className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-blue-900 mb-2">Ακουστικό Μέρος</h4>
                    <p className="text-blue-800/70 leading-relaxed text-sm">
                      Κατανόηση Προφορικού Λόγου (50 θέματα). Όλα τα θέματα με κείμενα και τεστ, καθώς και Audio Podcasts.
                    </p>
                  </div>
                </div>
              </div>

              {/* 6. ΑΠΕΡΙΟΡΙΣТΗ ΠΡΑΚТΙΚΗ */}
              <div className="group bg-blue-50/50 rounded-3xl p-8 border border-blue-100 hover:bg-white hover:shadow-xl hover:shadow-blue-100/50 hover:border-blue-200 transition-all duration-300">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-white rounded-2xl flex-shrink-0 flex items-center justify-center text-blue-700 shadow-sm mb-6 group-hover:scale-110 transition-transform">
                    <Repeat className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-blue-900 mb-2">Πρακτική για 100% Αυτοπεποίθηση</h4>
                    <p className="text-blue-800/70 leading-relaxed text-sm">
                      Στην πλατφόρμα μας μπορείτε να κάνετε <strong>ρεαλιστικές προσομοιώσεις εξετάσεων απεριόριστες φορές</strong>. Εξασκηθείτε σε συνθήκες πραγματικού χρόνου μέχρι να νιώθετε απόλυτα σίγουροι για την επιτυχία.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* === 3. ΔΙΑΔΙΚΑΣΙΑ (PROCESS - 5 ΒΗΜΑТА) === */}
        <section id="process" className="py-24 bg-blue-950 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px]"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-blue-400 font-bold tracking-wide uppercase text-sm mb-2">Διαδικασία</h2>
                <h3 className="text-3xl md:text-4xl font-black mb-8">Ο σίγουρος δρόμος προς την επιτυχία</h3>

                <div className="space-y-6">
                  {/* Βήμα 1 */}
                  <div className="flex gap-5 group">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-900 border border-blue-800 flex items-center justify-center font-bold text-lg text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-lg">1</div>
                    <div><h4 className="font-bold text-lg mb-1 text-white">Εγγραφή</h4><p className="text-blue-300/80 text-sm leading-relaxed">Δημιουργήστε τον λογαριασμό σας και αποκτήστε πρόσβαση.</p></div>
                  </div>
                  {/* Βήμα 2 */}
                  <div className="flex gap-5 group">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-900 border border-blue-800 flex items-center justify-center font-bold text-lg text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-lg">2</div>
                    <div><h4 className="font-bold text-lg mb-1 text-white">Στοχευμένη Μελέτη</h4><p className="text-blue-300/80 text-sm leading-relaxed">Μελετήστε Ιστορία, Γεωγραφία, Πολιτική και Γλώσσα με Βίντεο & Audio.</p></div>
                  </div>
                  {/* Βήμα 3 */}
                  <div className="flex gap-5 group">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-900 border border-blue-800 flex items-center justify-center font-bold text-lg text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-lg">3</div>
                    <div><h4 className="font-bold text-lg mb-1 text-white">Εξάσκηση στα Επίσημα Θέματα</h4><p className="text-blue-300/80 text-sm leading-relaxed">Λύστε τα τεστ του Υπουργείου ανά κατηγορία.</p></div>
                  </div>
                  {/* Βήμα 4 */}
                  <div className="flex gap-5 group">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-900 border border-blue-800 flex items-center justify-center font-bold text-lg text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-lg">4</div>
                    <div><h4 className="font-bold text-lg mb-1 text-white">Απεριόριστες Προσομοιώσεις</h4><p className="text-blue-300/80 text-sm leading-relaxed">Δώστε εικονικές εξετάσεις όσες φορές χρειαστεί για να μηδενίσετε το άγχος.</p></div>
                  </div>
                  {/* Βήμα 5 */}
                  <div className="flex gap-5 group">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-600 border border-green-500 flex items-center justify-center font-bold text-lg text-white shadow-lg animate-pulse">5</div>
                    <div><h4 className="font-bold text-lg mb-1 text-green-400">Επιτυχία</h4><p className="text-blue-300/80 text-sm leading-relaxed">Δώστε εξετάσεις με 100% αυτοπεποίθηση.</p></div>
                  </div>
                </div>
              </div>

              {/* UPDATED: REAL SCREENSHOT PLACEHOLDER */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-3xl transform rotate-3 blur-sm opacity-30 group-hover:rotate-6 transition-transform duration-500"></div>
                <div className="bg-slate-900 rounded-3xl p-2 border border-slate-700 shadow-2xl relative overflow-hidden aspect-[4/3] flex items-center justify-center bg-slate-950">
                  {/* Placeholder for Screenshot */}
                  <div className="text-center p-8">
                    <Laptop className="h-16 w-16 text-blue-500 mx-auto mb-4 opacity-50" />
                    <p className="text-slate-400 font-medium text-sm">
                      Εδώ θα μπει screenshot του Dashboard<br />
                      <span className="text-xs opacity-50">(Τοποθετήστε εικόνα: /public/dashboard-mockup.png)</span>
                    </p>
                  </div>
                  {/* Uncomment below when you have the image */}
                  {/* <img src="/dashboard-mockup.png" alt="Platform Screenshot" className="rounded-2xl w-full h-full object-cover"/> */}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* === 4. ΣΥΝΔΡΟΜΕΣ (PRICING - UPDATED PSYCHOLOGY) === */}
        <section id="pricing" className="py-24 bg-white border-b border-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-blue-600 font-bold tracking-wide uppercase text-sm mb-3">Συνδρομές</h2>
              <h3 className="text-3xl md:text-4xl font-black text-blue-950">Επιλέξτε το πακέτο που σας ταιριάζει</h3>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">

              {/* 1. FREE - Залишається посилання на /register */}
              <div className="bg-white rounded-3xl p-8 border-2 border-slate-100 hover:border-blue-200 transition-colors relative h-fit">
                <h4 className="text-xl font-bold text-blue-900 mb-4">Δοκιμαστικό</h4>
                <div className="mb-6"><span className="text-4xl font-black text-blue-950">ΔΩΡΕΑΝ</span></div>
                <p className="text-sm text-blue-800/60 mb-8 pb-8 border-b border-slate-100">
                  Δοκιμάστε τις λειτουργίες της πλατφόρμας χωρίς καμία δέσμευση.
                </p>
                <ul className="space-y-4 mb-8 text-sm">
                  <li className="flex items-center gap-3 text-blue-900"><Check className="h-5 w-5 text-blue-300" /> Πρόσβαση γνωριμίας</li>
                  <li className="flex items-center gap-3 text-blue-900"><Check className="h-5 w-5 text-blue-300" /> 1 Τεστ ανά κατηγορία</li>
                  <li className="flex items-center gap-3 text-blue-900"><Check className="h-5 w-5 text-blue-300" /> Χωρίς πιστωτική κάρτα</li>
                </ul>
                <Link href="/register" className="block w-full py-3 border-2 border-blue-100 text-blue-600 text-center rounded-xl font-bold hover:bg-blue-50 transition-colors">Δωρεάν Εγγραφή</Link>
              </div>

              {/* 2. 3 MONTHS - ✅ UPDATE: Scroll to form with params */}
              <div className="bg-blue-950 text-white rounded-3xl p-8 border-2 border-blue-900 shadow-2xl relative transform md:-translate-y-6 z-10">
                <div className="absolute top-0 inset-x-0 -mt-4 flex justify-center"><span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg uppercase tracking-wider">Δημοφιλεστερο</span></div>
                <h4 className="text-xl font-bold mb-4">3 Μήνες</h4>
                <div className="mb-6 flex items-baseline gap-1"><span className="text-5xl font-black">€200</span><span className="text-blue-300">/ εφάπαξ</span></div>
                <p className="text-sm text-blue-200 mb-8 pb-8 border-b border-blue-800">
                  Η πλήρης εμπειρία. Ολοκληρωμένη προετοιμασία χωρίς άγχος χρόνου.
                </p>
                <ul className="space-y-4 mb-8 text-sm font-medium">
                  <li className="flex items-center gap-3"><Check className="h-5 w-5 text-cyan-400" /> <strong>Πλήρης Πρόσβαση 360°</strong></li>
                  <li className="flex items-center gap-3"><Check className="h-5 w-5 text-cyan-400" /> Όλη η Τράπεζα Θεμάτων</li>
                  <li className="flex items-center gap-3"><Check className="h-5 w-5 text-cyan-400" /> AI Καθηγητής (Έκθεση/Ομιλία)</li>
                  <li className="flex items-center gap-3"><Check className="h-5 w-5 text-cyan-400" /> Απεριόριστα Τεστ</li>
                </ul>
                {/* Link to Contact Form with Topic */}
                <Link href="/?topic=pack_3_months#contact" className="block w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-center rounded-xl font-bold hover:brightness-110 transition-all shadow-lg text-lg">Επιλογή Πακέτου</Link>
              </div>

              {/* 3. 1 MONTH - ✅ UPDATE: Scroll to form with params */}
              <div className="bg-white rounded-3xl p-8 border-2 border-slate-100 hover:border-blue-200 transition-colors relative h-fit">
                <h4 className="text-xl font-bold text-blue-900 mb-4">1 Μήνας</h4>
                <div className="mb-6 flex items-baseline gap-1"><span className="text-4xl font-black text-blue-950">€100</span><span className="text-slate-500">/ εφάπαξ</span></div>
                <p className="text-sm text-blue-800/60 mb-8 pb-8 border-b border-slate-100">
                  Ιδανικό для γρήγορη επανάληψη λίγο πριν τις εξετάσεις.
                </p>
                <ul className="space-y-4 mb-8 text-sm">
                  <li className="flex items-center gap-3 text-blue-900"><Check className="h-5 w-5 text-blue-600" /> Πλήρης Πρόσβαση</li>
                  <li className="flex items-center gap-3 text-blue-900"><Check className="h-5 w-5 text-blue-600" /> AI Καθηγητής</li>
                  <li className="flex items-center gap-3 text-blue-900"><Check className="h-5 w-5 text-blue-600" /> Απεριόριστα Τεστ</li>
                </ul>
                {/* Link to Contact Form with Topic */}
                <Link href="/?topic=pack_1_month#contact" className="block w-full py-3 bg-blue-50 text-blue-700 text-center rounded-xl font-bold hover:bg-blue-100 transition-colors">Επιλογή Πακέτου</Link>
              </div>

            </div>
          </div>
        </section>

        {/* === NEW: FAQ SECTION (ΣΥΧΝΕΣ ΕΡΩТΗΣΕΙΣ) === */}
        <section id="faq" className="py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-blue-600 font-bold tracking-wide uppercase text-sm mb-3">FAQ</h2>
              <h3 className="text-3xl md:text-4xl font-black text-blue-950">Συχνές Ερωτήσεις</h3>
            </div>

            <div className="space-y-4">
              {/* Q1 */}
              <details className="group bg-slate-50 rounded-2xl border border-slate-200 open:border-blue-200 transition-all">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <span className="font-bold text-blue-900 text-lg">Τι ακριβώς προσφέρει η πλατφόρμα;</span>
                  <ChevronDown className="h-5 w-5 text-blue-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-blue-800/70 leading-relaxed">
                  Η πλατφόρμα προσφέρει ολοκληρωμένη προετοιμασία για τις εξετάσεις ΠΕΓΠ. Περιλαμβάνει όλη τη θεωρία, τεστ πολλαπλής επιλογής, ακουστικά μαθήματα και εργαλεία τεχνητής νοημοσύνης (AI) που διορθώνουν τις εκθέσεις και την προφορική σας εξέταση.
                </div>
              </details>

              {/* Q2 */}
              <details className="group bg-slate-50 rounded-2xl border border-slate-200 open:border-blue-200 transition-all">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <span className="font-bold text-blue-900 text-lg">Είναι το υλικό ενημερωμένο;</span>
                  <ChevronDown className="h-5 w-5 text-blue-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-blue-800/70 leading-relaxed">
                  Ναι, η τράπεζα θεμάτων μας ανανεώνεται συνεχώς και βασίζεται 100% στην επίσημη ύλη και τα θέματα του Υπουργείου Εσωτερικών.
                </div>
              </details>

              {/* Q3 */}
              <details className="group bg-slate-50 rounded-2xl border border-slate-200 open:border-blue-200 transition-all">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <span className="font-bold text-blue-900 text-lg">Μπορώ να χρησιμοποιήσω την πλατφόρμα από το κινητό;</span>
                  <ChevronDown className="h-5 w-5 text-blue-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-blue-800/70 leading-relaxed">
                  Φυσικά! Η πλατφόρμα είναι σχεδιασμένη (responsive design) για να λειτουργεί άψογα σε κινητά τηλέφωνα, tablets και ηλεκτρονικούς υπολογιστές.
                </div>
              </details>

              {/* Q4 */}
              <details className="group bg-slate-50 rounded-2xl border border-slate-200 open:border-blue-200 transition-all">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <span className="font-bold text-blue-900 text-lg">Πώς λειτουργεί η συνδρομή;</span>
                  <ChevronDown className="h-5 w-5 text-blue-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-blue-800/70 leading-relaxed">
                  Η πληρωμή είναι εφάπαξ (μία φορά) για το χρονικό διάστημα που θα επιλέξετε (1 ή 3 μήνες). Δεν υπάρχουν κρυφές χρεώσεις και η συνδρομή ΔΕΝ ανανεώνεται αυτόματα.
                </div>
              </details>

              {/* Q5 */}
              <details className="group bg-slate-50 rounded-2xl border border-slate-200 open:border-blue-200 transition-all">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <span className="font-bold text-blue-900 text-lg">Υπάρχει διορθωτής για την Έκθεση και την Ομιλία;</span>
                  <ChevronDown className="h-5 w-5 text-blue-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-blue-800/70 leading-relaxed">
                  Ναι! Η πλατφόρμα μας ενσωματώνει προηγμένη Τεχνητή Νοημοσύνη (AI) που βαθμολογεί και διορθώνει αυτόματα τα κείμενά σας (έκθεση) αλλά και τα ηχητικά σας μηνύματα (ομιλία), δίνοντας εξατομικευμένες συμβουλές βελτίωσης.
                </div>
              </details>

              {/* Q6 */}
              <details className="group bg-slate-50 rounded-2xl border border-slate-200 open:border-blue-200 transition-all">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <span className="font-bold text-blue-900 text-lg">Μπορώ να δοκιμάσω πριν πληρώσω;</span>
                  <ChevronDown className="h-5 w-5 text-blue-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-blue-800/70 leading-relaxed">
                  Βεβαίως. Με τη <strong>Δωρεάν Εγγραφή</strong> σας παρέχουμε πρόσβαση γνωριμίας στην πλατφόρμα, η οποία περιλαμβάνει 1 δοκιμαστικό τεστ ανά κατηγορία, χωρίς να απαιτείται πιστωτική κάρτα.
                </div>
              </details>

              {/* Q7 */}
              <details className="group bg-slate-50 rounded-2xl border border-slate-200 open:border-blue-200 transition-all">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <span className="font-bold text-blue-900 text-lg">Το υλικό απευθύνεται σε αρχάριους ή προχωρημένους;</span>
                  <ChevronDown className="h-5 w-5 text-blue-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-blue-800/70 leading-relaxed">
                  Το υλικό είναι δομημένο βάσει των Εξετάσεων (ΠΕΓΠ) και απευθύνεται σε άτομα που κατέχουν έστω ένα βασικό επίπεδο της Ελληνικής Γλώσσας, και θέλουν στοχευμένη προετοιμασία πάνω στα θέματα της Τράπεζας.
                </div>
              </details>

              {/* Q8 */}
              <details className="group bg-slate-50 rounded-2xl border border-slate-200 open:border-blue-200 transition-all">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <span className="font-bold text-blue-900 text-lg">Πότε ενεργοποιείται ο λογαριασμός μου μετά την πληρωμή;</span>
                  <ChevronDown className="h-5 w-5 text-blue-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-blue-800/70 leading-relaxed">
                  Μόλις επιλέξετε το πακέτο που επιθυμείτε και ολοκληρωθεί η επικοινωνία με τους διαχειριστές μας, η Premium πρόσβαση ενεργοποιείται σχεδόν άμεσα, και μπορείτε να ξεκινήσετε τη μελέτη.
                </div>
              </details>
            </div>
          </div>
        </section>

        {/* === 5. ΕΠΙΚΟΙΝΩΝΙΑ (CONTACT) === */}
        <section id="contact" className="py-24 bg-blue-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-blue-100 flex flex-col md:flex-row">

              {/* Аριστερή Στήλη */}
              <div className="bg-blue-900 text-white p-10 md:p-16 md:w-2/5 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-blue-800/50 mix-blend-multiply"></div>
                <div className="relative z-10">
                  <h3 className="text-3xl font-black mb-6">Επικοινωνία</h3>
                  <p className="text-blue-100 leading-relaxed">
                    Αφήστε το αίτημά σας και οι διαχειριστές μας θα επικοινωνήσουν μαζί σας το συντομότερο δυνατό μέσω email για να σας δώσουν αναλυτικές οδηγίες σχετικά με την απόκτηση premium πρόσβασης στον ιστότοπο.
                  </p>
                </div>
              </div>

              {/* Δεξιά Στήλη: New Contact Form Component */}
              <ContactForm />

            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}