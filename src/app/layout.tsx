import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DentalPrep — CNQAOS",
  description: "Révisez le CNQAOS avec des flashcards et quiz générés par IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className={`${geist.className} min-h-full bg-gray-50 flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
