"use client";

import { CalendarDays, PlusCircle, Filter, Compass, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

type BottomNavigationProps = {
  role: "organizador" | "asistente";
  active?: string;
  onAction: (action: string) => void;
};

const navigationMap = {
  organizador: [
    { id: "crear", label: "Crear", icon: PlusCircle },
    { id: "calendario", label: "Agenda", icon: CalendarDays },
    { id: "filtros", label: "Filtros", icon: Filter },
  ],
  asistente: [
    { id: "eventos", label: "Eventos", icon: Compass },
    { id: "mis-registros", label: "Mi registro", icon: ClipboardList },
    { id: "filtros", label: "Filtros", icon: Filter },
  ],
} as const;

export function BottomNavigation({ role, active, onAction }: BottomNavigationProps) {
  const items = navigationMap[role];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-700/80 bg-slate-950/95 px-3 py-2 backdrop-blur-xl shadow-[0_-20px_50px_-35px_rgba(0,0,0,0.65)] md:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onAction(item.id)}
              className={cn(
                "group flex flex-1 flex-col items-center justify-center rounded-3xl px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70",
                isActive
                  ? "bg-cyan-500/15 text-cyan-100"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="mt-1 leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
