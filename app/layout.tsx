import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import UserEmailMenu from "../components/user-email-menu";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "A53 - Sistema de Reservas",
  description: "Plataforma de gestión y reserva de auditorios A53",
  icons: {
    icon: "/logo53-favicon.svg",
    shortcut: "/logo53-favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased`}>
        <div className="min-h-dvh flex flex-col">
          <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-linear-to-r from-slate-950 to-slate-800 py-1 backdrop-blur-xl shadow-md shadow-rose-500/10">
            <div className="max-w-7xl mx-auto flex w-full flex-row items-center gap-2 px-4 py-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:px-0">
              <div className="flex w-full flex-row items-center justify-between gap-2 sm:gap-4">
                <div className="h-16 w-full max-w-[5.5rem] flex-shrink-0 rounded-lg overflow-hidden border border-white/20 bg-white shadow-sm">
                  <img
                    src="/logo-congreso-header.png"
                    alt="A53"
                    className="h-full w-full object-contain bg-white"
                    loading="eager"
                  />
                </div>
                <div className="flex flex-col gap-0 leading-none text-left">
                  <p className="text-xs uppercase tracking-[0.35em] text-[#ffc300] font-semibold">
                    A53
                  </p>
                  <div className="text-xs font-semibold tracking-tight text-white sm:text-sm md:text-base">
                    Sistema de Reservas
                  </div>
                </div>
              </div>
              <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
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
