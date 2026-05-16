import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "DentalPrep — CNQAOS",
  description: "Révisez le CNQAOS avec des flashcards et quiz générés par IA",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className="h-full">
      <body style={{ fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif', background: '#F4F6F8', minHeight: '100%' }}>
        {children}
      </body>
    </html>
  )
}
