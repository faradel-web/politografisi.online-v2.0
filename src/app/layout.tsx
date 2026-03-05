import type { Metadata, Viewport } from "next";
import { Geologica, Vollkorn } from "next/font/google";
import "./globals.css";

// --- Providers & Shared ---
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/providers/ThemeProvider";
import CookieConsent from "@/components/shared/CookieConsent";
import Analytics from "@/components/shared/Analytics";

// --- Шрифти ---
const geologica = Geologica({
  subsets: ["latin", "greek"],
  variable: "--font-geologica",
  display: "swap",
  adjustFontFallback: false,
});

const vollkorn = Vollkorn({
  subsets: ["latin", "greek"],
  variable: "--font-vollkorn",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

// --- Viewport (виділено окремо для Next.js 15+) ---
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover', // Для iPhone з notch
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

// --- SEO та Open Graph ---
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://politografisi.online'),

  title: {
    default: "Politografisi.online | Προετοιμασία για Εξετάσεις Πολιτογράφησης",
    template: "%s | Politografisi.online",
  },
  description: "Η Νο1 πλατφόρμα προετοιμασίας για το Πιστοποιητικό Επάρκειας Γνώσεων για Πολιτογράφηση (ΠΕΓΠ). Τεστ, Βίντεο, Ήχος και AI Προσομοιώσεις.",

  // PWA Manifest
  manifest: '/manifest.json',

  // Apple Touch Icon
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Politografisi',
  },

  openGraph: {
    title: "Politografisi.online | Έξυπνη Προετοιμασία",
    description: "Η πληρέστερη πλατφόρμα προετοιμασίας. Τεστ, Βίντεο, Ήχος και AI Προσομοιώσεις.",
    url: 'https://politografisi.online',
    siteName: 'Politografisi.online',
    locale: 'el_GR',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: "Politografisi.online | Προετοιμασία ΠΕΓΠ",
    description: "Η Νο1 πλατφόρμα προετοιμασίας για το Πιστοποιητικό Επάρκειας Γνώσεων για Πολιτογράφηση.",
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="el" suppressHydrationWarning>
      <head>
        {/* PWA: Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* Safe Area для iPhone */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${geologica.variable} ${vollkorn.variable} font-sans antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
          <CookieConsent />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}