import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Sim — Analyses football",
  description: "Plateforme d'analyses et probabilités de matchs de football.",
};

// Layout racine minimal — la sidebar vit dans (app)/layout, l'auth dans (auth)/layout.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-bg-app min-h-screen text-fg antialiased">{children}</body>
    </html>
  );
}
