import type { Metadata, Viewport } from "next";
import { Geologica, Vollkorn } from "next/font/google";
import "./globals.css";
import "./native-app.css";

// --- Providers & Shared ---
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/providers/ThemeProvider";
import CookieConsent from "@/components/shared/CookieConsent";
import Analytics from "@/components/shared/Analytics";
import ServiceWorkerRegistration from "@/components/shared/ServiceWorkerRegistration";

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

  // Apple Web App
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Politografisi',
    startupImage: [
      // iPhone 15 Pro Max, 16 Plus (1290×2796)
      {
        url: '/icons/apple-icon-1024x1024.png',
        media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)',
      },
      // iPhone 15 Pro, 16 (1179×2556)
      {
        url: '/icons/apple-icon-1024x1024.png',
        media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)',
      },
      // iPhone 14, 13, 12 (1170×2532)
      {
        url: '/icons/apple-icon-1024x1024.png',
        media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)',
      },
      // iPhone SE 3rd gen (750×1334)
      {
        url: '/icons/apple-icon-1024x1024.png',
        media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)',
      },
      // iPad Pro 12.9" (2048×2732)
      {
        url: '/icons/apple-icon-1024x1024.png',
        media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)',
      },
      // iPad Pro 11" (1668×2388)
      {
        url: '/icons/apple-icon-1024x1024.png',
        media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)',
      },
      // iPad 10th gen (1640×2360)
      {
        url: '/icons/apple-icon-1024x1024.png',
        media: '(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },

  // Icons (Apple touch icons)
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/icons/apple-icon-180x180.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/apple-icon-167x167.png', sizes: '167x167', type: 'image/png' },
      { url: '/icons/apple-icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/apple-icon-120x120.png', sizes: '120x120', type: 'image/png' },
      { url: '/icons/apple-icon-76x76.png', sizes: '76x76', type: 'image/png' },
      { url: '/icons/apple-icon-60x60.png', sizes: '60x60', type: 'image/png' },
    ],
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

  // hreflang + canonical
  alternates: {
    canonical: 'https://politografisi.online',
    languages: {
      'el': 'https://politografisi.online',
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
        {/* Google Search Console verification */}
        <meta name="google-site-verification" content="BIwe8j9C1oLcZS84YzGHW2Tktr9o7A047E_z5j_smNU" />

        {/* Favicon for search engines and browsers */}
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />

        {/* Apple Touch Icons (all sizes for iOS devices) */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/apple-icon-167x167.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/icons/apple-icon-76x76.png" />

        {/* Apple PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Politografisi" />

        {/* iOS Safe Area support */}
        <meta name="format-detection" content="telephone=no" />
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
          <ServiceWorkerRegistration />
        </ThemeProvider>
      </body>
    </html>
  );
}