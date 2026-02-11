import type { Metadata } from "next";
// 1. Імпорт нових шрифтів (Geologica та Vollkorn)
import { Geologica, Vollkorn } from "next/font/google";
// 2. ВАЖЛИВО: Імпорт глобальних стилів
import "./globals.css"; 
import { AuthProvider } from "@/lib/auth-context";

// Налаштовуємо Geologica (основний шрифт)
const geologica = Geologica({ 
  subsets: ["latin", "greek"], 
  variable: "--font-geologica",
  display: "swap",
  adjustFontFallback: false, 
});

// Налаштовуємо Vollkorn (акцентний шрифт)
const vollkorn = Vollkorn({ 
  subsets: ["latin", "greek"],
  variable: "--font-vollkorn",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

// --- SEO ТΑ OPEN GRAPH НАЛАШТУВАННЯ ---
export const metadata: Metadata = {
  // Важливо: Базовий URL для правильного формування посилань на картинки
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://politografisi.online'),

  title: {
    default: "Politografisi.online | Προετοιμασία για Εξετάσεις Πολιτογράφησης",
    template: "%s | Politografisi.online", // Автоматично додає суфікс до заголовків інших сторінок
  },
  description: "Η Νο1 πλατφόρμα προετοιμασίας για το Πιστοποιητικό Επάρκειας Γνώσεων για Πολιτογράφηση (ΠΕΓΠ). Τεστ, Βίντεο, Ήχος και AI Προσομοιώσεις.",
  
  // Налаштування для Facebook, LinkedIn, Viber, Telegram
  openGraph: {
    title: "Politografisi.online | Έξυπνη Προετοιμασία",
    description: "Η πληρέστερη πλατφόρμα προετοιμασίας. Τεστ, Βίντεο, Ήχος και AI Προσομοιώσεις.",
    url: 'https://politografisi.online',
    siteName: 'Politografisi.online',
    locale: 'el_GR',
    type: 'website',
    // Next.js автоматично підтягне файл opengraph-image.tsx тут
  },

  // Налаштування для Twitter (X)
  twitter: {
    card: 'summary_large_image',
    title: "Politografisi.online | Προετοιμασία ΠΕΓΠ",
    description: "Η Νο1 πλατφόρμα προετοιμασίας για το Πιστοποιητικό Επάρκειας Γνώσεων για Πολιτογράφηση.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="el">
      {/* Додаємо змінні шрифтів та базові стилі */}
      <body className={`${geologica.variable} ${vollkorn.variable} font-sans antialiased bg-slate-50 text-slate-900`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}