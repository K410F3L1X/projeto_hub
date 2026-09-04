import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import TitleBar from "@/components/TitleBar";

export const metadata: Metadata = {
  title: "Study Hub — Segundo Cérebro",
  description: "Dashboard de estudos e produtividade integrado com Obsidian",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <TitleBar />
        <div className="flex min-h-screen electron-titlebar-offset">
          <Sidebar />
          <main className="flex-1 ml-[260px]">
            <div className="max-w-[1200px] mx-auto px-8 py-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
