import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "DentalPrep — CNQAOS",
  description: "Révisez le CNQAOS avec des flashcards et quiz générés par IA",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DentalPrep",
  },
}

export const viewport: Viewport = {
  themeColor: "#0A66E0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className="h-full">
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
      <body style={{ fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif', background: '#F4F6F8', minHeight: '100%' }}>
        {children}
      </body>
    </html>
  )
}
