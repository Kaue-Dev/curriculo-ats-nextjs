import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Análise de Currículo ATS | Scanner Inteligente",
  description: "Análise seu currículo de forma gratuita usando Inteligencia Artificial (IA + ATS)",
};

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={cn("scroll-smooth", "font-sans", geist.variable)}>
      <body
        className={`${geist.variable} antialiased bg-zinc-950 text-zinc-50`}
      >
        {children}
      </body>
    </html>
  );
}
