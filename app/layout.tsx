import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import UserEmailMenu from "../components/user-email-menu";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "A53 - Sistema de Reservas",
  description: "Plataforma de gestión y reserva de auditorios A53",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased`}>
        <div className="min-h-screen flex flex-col">
          <header className="w-full border-b border-white/10 bg-background/90 px-4 py-4 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-xs uppercase tracking-[0.45em] text-orange-400">
                  A53
                </p>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight text-white">
                  Sistema de Reservas
                </div>
              </div>
              <div className="flex items-center gap-2">
                <UserEmailMenu />
              </div>
            </div>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
