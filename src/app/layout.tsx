import type { Metadata, Viewport } from "next"
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

// Fonts du design system Clinique — chargées une fois et exposées comme
// variables CSS (--font-display / --font-body / --font-mono) consommées par
// FONT_BODY / FONT_DISPLAY / FONT_MONO dans src/lib/theme.ts.
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-display',
  display: 'swap',
})
const body = Geist({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-body',
  display: 'swap',
})
const mono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "DentalPrep — CNQAOS",
  description: "Révisez le CNQAOS avec des flashcards et quiz générés par IA",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: "/apple-touch-icon.png",
    other: [
      { rel: "android-chrome-192x192", url: "/android-chrome-192x192.png" },
      { rel: "android-chrome-512x512", url: "/android-chrome-512x512.png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DentalPrep",
  },
}

export const viewport: Viewport = {
  themeColor: "#0E5552",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`h-full ${display.variable} ${body.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          if (window.navigator.standalone) {
            document.addEventListener('click', function(e) {
              var el = e.target;
              while (el && el.tagName !== 'A') el = el.parentNode;
              if (el && el.tagName === 'A' && el.href && el.href.indexOf(location.host) !== -1 && el.target !== '_blank') {
                e.preventDefault();
                window.location.href = el.href;
              }
            });
          }
        `}} />
      </head>
      <body style={{
        fontFamily: 'var(--font-body), -apple-system, "SF Pro Text", system-ui, sans-serif',
        background: '#F4F5F2',
        color: '#0A1614',
        minHeight: '100%',
      }}>
        {children}
      </body>
    </html>
  )
}
