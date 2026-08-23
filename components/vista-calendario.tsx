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
    <Card className="w-full min-w-0 overflow-hidden rounded-2xl bg-white/80 p-2 shadow-xl backdrop-blur-sm sm:p-6">
      <div className="mb-4 flex min-w-0 items-center justify-between gap-2 border-b-2 border-gray-200 pb-3 sm:mb-6 sm:pb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => cambiarFecha(-1)}
          className="shrink-0 rounded-lg shadow-md hover:shadow-lg hover:bg-linear-to-b hover:from-blue-500 hover:to-blue-600 hover:text-white hover:border-blue-600 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex min-w-0 items-center justify-center gap-2 text-center sm:gap-3">
          <CalendarIcon className="shrink-0 bg-linear-to-r from-orange-600 to-orange-400" />
          <h2 className="min-w-0 text-base font-semibold capitalize leading-tight sm:text-xl">
            {formatearFecha(fechaSeleccionada)}
            {esHoy && (
              <span className="ml-1 inline-block rounded-full bg-linear-to-r from-blue-500 to-cyan-500 px-2 py-1 text-xs text-white shadow-md sm:ml-2 sm:px-3 sm:text-sm">
                Hoy
              </span>
            )}
          </h2>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => cambiarFecha(1)}
          className="shrink-0 rounded-lg shadow-md hover:shadow-lg hover:bg-linear-to-b hover:from-blue-500 hover:to-blue-600 hover:text-white hover:border-blue-600 transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <div className="w-full min-w-0 overflow-x-hidden px-0.5 sm:px-0">
        <div className="w-full min-w-0">
          <div className="mb-3 grid grid-cols-[52px_minmax(0,1fr)_minmax(0,1fr)] gap-1.5 sm:grid-cols-[100px_1fr_1fr] sm:gap-3">
            <div className="font-semibold text-sm text-gray-600">Hora</div>
            <div className="truncate rounded-lg bg-orange-500 py-2 text-center text-xs font-semibold text-white shadow-sm sm:text-sm">
              <span className="sm:hidden">Aud. A</span><span className="hidden sm:inline">Auditorio A</span>
            </div>
            <div className="truncate rounded-lg bg-purple-500 py-2 text-center text-xs font-semibold text-white shadow-sm sm:text-sm">
              <span className="sm:hidden">Aud. B</span><span className="hidden sm:inline">Auditorio B</span>
            </div>
          </div>

          <div className="space-y-2">
            {horas.map((hora) => {
              const reservasA = obtenerReservasParaRanura("A", hora);
              const reservasB = obtenerReservasParaRanura("B", hora);

              return (
                <div
                  key={hora}
                  className="grid grid-cols-[52px_minmax(0,1fr)_minmax(0,1fr)] gap-1.5 sm:grid-cols-[100px_1fr_1fr] sm:gap-3"
                >
                  <div className="flex items-center py-4 text-xs font-medium text-gray-600 sm:text-sm">
                    {hora.toString().padStart(2, "0")}:00
                  </div>

                  <div
                    className={`min-h-14 min-w-0 rounded-lg p-1.5 transition-all sm:p-2 ${
                      reservasA.length > 0
                        ? "bg-orange-50"
                        : "bg-white hover:bg-orange-50/50 shadow-sm"
                    }`}
                  >
                    {reservasA.length > 0 ? (
                      reservasA.map((reserva) => (
                        <div
                          key={reserva.id}
                          className="h-full min-w-0 rounded-lg bg-linear-to-b from-orange-600 to-orange-400 p-2 text-white shadow-md sm:p-3"
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
                      <div className="h-full flex items-center justify-center text-xs font-medium text-gray-400">
                        Libre
                      </div>
                    )}
                  </div>

                  <div
                    className={`min-h-14 min-w-0 rounded-lg p-1.5 transition-all sm:p-2 ${
                      reservasB.length > 0
                        ? "bg-purple-50"
                        : "bg-white hover:bg-purple-50/50 shadow-sm"
                    }`}
                  >
                    {reservasB.length > 0 ? (
                      reservasB.map((reserva) => (
                        <div
                          key={reserva.id}
                          className="h-full min-w-0 rounded-lg bg-linear-to-b from-purple-500 to-purple-600 p-2 text-white shadow-md sm:p-3"
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
                      <div className="h-full flex items-center justify-center text-xs font-medium text-gray-400">
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
