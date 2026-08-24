"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import type { Reserva } from "@/app/page";

type PropiedadesVistaCalendario = {
  reservas: Reserva[];
  fechaSeleccionada: Date;
  alCambiarFecha: (fecha: Date) => void;
};

export function Calendario({
  reservas,
  fechaSeleccionada,
  alCambiarFecha,
}: PropiedadesVistaCalendario) {
  const horas = Array.from({ length: 10 }, (_, i) => i + 7); // 7 AM a 4 PM

  const formatearFechaLocal = (fecha: Date) => {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, "0");
    const day = String(fecha.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const obtenerFechaMinima = () => {
    const ahora = new Date();
    const horaActual = ahora.getHours();

    // Si son las 4 PM o después, la fecha mínima es mañana
    if (horaActual >= 16) {
      const manana = new Date(ahora);
      manana.setDate(manana.getDate() + 1);
      return formatearFechaLocal(manana);
    }

    // Si es antes de las 4 PM, puede ser hoy
    return formatearFechaLocal(ahora);
  };

  const cambiarFecha = (dias: number) => {
    const nuevaFecha = new Date(fechaSeleccionada);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);

    // Permitir cambiar a días pasados (hasta hace un año) para mayor flexibilidad.
    // Si necesita un rango específico, se puede ajustar aquí.
    const limitePasado = new Date();
    limitePasado.setFullYear(limitePasado.getFullYear() - 1);

    if (nuevaFecha >= limitePasado) {
      alCambiarFecha(nuevaFecha);
    }
  };

  const obtenerReservasParaRanura = (auditorio: "A" | "B", hora: number) => {
    return reservas.filter((reserva) => {
      if (reserva.auditorio !== auditorio) return false;

      const fechaReserva = reserva.fecha;
      const fechaSelec = formatearFechaLocal(fechaSeleccionada);
      if (fechaReserva !== fechaSelec) return false;

      const [horaInicio] = reserva.horaInicio.split(":").map(Number);
      return horaInicio === hora;
    });
  };

  const formatearFecha = (fecha: Date) => {
    return fecha.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const esHoy = fechaSeleccionada.toDateString() === new Date().toDateString();

  return (
    <Card className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 p-2 shadow-xl sm:p-4">
      <div className="mb-4 flex min-w-0 items-center justify-between gap-2 border-b border-slate-800 pb-3 sm:mb-5 sm:pb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => cambiarFecha(-1)}
          className="shrink-0 rounded-lg border-slate-700 bg-slate-900 text-slate-300 shadow-none transition-all hover:border-[#f43f5e] hover:bg-[#f43f5e]/10 hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex min-w-0 items-center justify-center gap-2 text-center sm:gap-3">
          <CalendarIcon className="shrink-0 text-[#f43f5e]" />
          <h2 className="min-w-0 text-base font-semibold capitalize leading-tight text-slate-200 sm:text-xl">
            {formatearFecha(fechaSeleccionada)}
            {esHoy && (
                <span className="ml-1 inline-block rounded-full border border-[#f43f5e]/30 bg-[#f43f5e]/20 px-2 py-1 text-xs text-[#f43f5e] sm:ml-2 sm:px-3 sm:text-sm">
                Hoy
              </span>
            )}
          </h2>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => cambiarFecha(1)}
          className="shrink-0 rounded-lg border-slate-700 bg-slate-900 text-slate-300 shadow-none transition-all hover:border-[#f43f5e] hover:bg-[#f43f5e]/10 hover:text-white"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <div className="w-full min-w-0 overflow-x-hidden px-0.5 sm:px-0">
        <div className="w-full min-w-0">
          <div className="mb-3 grid grid-cols-[52px_minmax(0,1fr)_minmax(0,1fr)] gap-1.5 sm:grid-cols-[100px_1fr_1fr] sm:gap-3">
            <div className="font-semibold text-sm text-slate-400">Hora</div>
            <div className="truncate rounded-lg bg-[#f97316] py-2 text-center text-xs font-semibold text-white shadow-sm sm:text-sm">
              <span className="sm:hidden">Aud. A</span><span className="hidden sm:inline">Auditorio A</span>
            </div>
            <div className="truncate rounded-lg bg-[#8b5cf6] py-2 text-center text-xs font-semibold text-white shadow-sm sm:text-sm">
              <span className="sm:hidden">Aud. B</span><span className="hidden sm:inline">Auditorio B</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {horas.map((hora) => {
              const reservasA = obtenerReservasParaRanura("A", hora);
              const reservasB = obtenerReservasParaRanura("B", hora);

              return (
                <div
                  key={hora}
                  className="grid grid-cols-[52px_minmax(0,1fr)_minmax(0,1fr)] gap-1.5 sm:grid-cols-[100px_1fr_1fr] sm:gap-3"
                >
                  <div className="flex items-center py-6 text-xs font-medium text-slate-500 sm:text-sm">
                    {hora.toString().padStart(2, "0")}:00
                  </div>

                  <div
                    className={`min-h-20 min-w-0 rounded-lg border p-1.5 transition-all sm:p-2 ${
                      reservasA.length > 0
                        ? "border-[#f97316]/50 bg-[#f97316]/10"
                        : "border-slate-800/80 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    {reservasA.length > 0 ? (
                      reservasA.map((reserva) => (
                        <div
                          key={reserva.id}
                          className="h-full min-w-0 rounded-lg bg-[#f97316] p-2 text-white shadow-md sm:p-3"
                        >
                          <p className="truncate text-xs font-semibold sm:text-sm">
                            {reserva.titulo}
                          </p>
                          <p className="mt-1 truncate text-[10px] text-white/90 sm:text-xs">
                            {reserva.organizador}
                          </p>
                          <p className="mt-1 truncate text-[10px] text-white/80 sm:text-xs">
                            {reserva.horaInicio} - {reserva.horaFin}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs font-medium text-slate-400">
                        Libre
                      </div>
                    )}
                  </div>

                  <div
                    className={`min-h-20 min-w-0 rounded-lg border p-1.5 transition-all sm:p-2 ${
                      reservasB.length > 0
                        ? "border-[#8b5cf6]/50 bg-[#8b5cf6]/10"
                        : "border-slate-800/80 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    {reservasB.length > 0 ? (
                      reservasB.map((reserva) => (
                        <div
                          key={reserva.id}
                          className="h-full min-w-0 rounded-lg bg-[#8b5cf6] p-2 text-white shadow-md sm:p-3"
                        >
                          <p className="truncate text-xs font-semibold sm:text-sm">
                            {reserva.titulo}
                          </p>
                          <p className="mt-1 truncate text-[10px] text-white/90 sm:text-xs">
                            {reserva.organizador}
                          </p>
                          <p className="mt-1 truncate text-[10px] text-white/80 sm:text-xs">
                            {reserva.horaInicio} - {reserva.horaFin}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs font-medium text-slate-400">
                        Libre
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
