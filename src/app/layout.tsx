import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "projet-maman",
  description: "Catalogue de location de matériel pour vos événements",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full bg-white text-slate-900 antialiased">
      <body className="min-h-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
