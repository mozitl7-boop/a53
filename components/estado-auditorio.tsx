"use client";

import { Card } from "@/components/ui/card";
import { Building2, Users, Clock } from "lucide-react";
import type { Reserva, AsistenteRegistrado } from "@/app/page";

type PropiedadesEstadoAuditorio = {
  reservas: Reserva[];
  fechaSeleccionada: Date;
  asistentesRegistrados?: AsistenteRegistrado[];
  asientosConteo?: Record<
    string,
    { ocupados: number; capacidad: number; auditorio?: string }
  >;
};

export function EstadoAuditorio({
  reservas,
  fechaSeleccionada,
  asistentesRegistrados = [],
  asientosConteo = {},
}: PropiedadesEstadoAuditorio) {
  const ahora = new Date();
  const esHoy = fechaSeleccionada.toDateString() === ahora.toDateString();

  const formatearFechaLocal = (fecha: Date) => {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, "0");
    const day = String(fecha.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const obtenerEstadoActual = (auditorio: "A" | "B") => {
    if (!esHoy) return { estado: "desconocido", reserva: null };

    const tiempoActual = ahora.getHours() * 60 + ahora.getMinutes();
    const fechaHoyNormalizada = formatearFechaLocal(ahora);

    const reservasHoy = reservas.filter((r) => {
      if (r.auditorio !== auditorio) return false;
      return r.fecha === fechaHoyNormalizada;
    });

    for (const reserva of reservasHoy) {
      const [horaInicio, minInicio] = reserva.horaInicio.split(":").map(Number);
      const [horaFin, minFin] = reserva.horaFin.split(":").map(Number);
      const minutosInicio = horaInicio * 60 + minInicio;
      const minutosFin = horaFin * 60 + minFin;

      if (tiempoActual >= minutosInicio && tiempoActual < minutosFin) {
        return { estado: "ocupado", reserva };
      }
    }

    return { estado: "disponible", reserva: null };
  };

  const estadoA = obtenerEstadoActual("A");
  const estadoB = obtenerEstadoActual("B");

  const contarOcupados = (reservaId: string | null, capacidad: number) => {
    if (!reservaId) return 0;
    // Preferir conteo agregado enviado por el servidor si está disponible
    const agg = asientosConteo[reservaId];
    if (agg && typeof agg.ocupados === "number") return agg.ocupados;
    return asistentesRegistrados.filter((a) => a.reservaId === reservaId)
      .length;
  };

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case "ocupado":
        return "bg-red-500";
      case "disponible":
        return "bg-emerald-500";
      default:
        return "bg-gray-400";
    }
  };

  const obtenerTextoEstado = (estado: string) => {
    switch (estado) {
      case "ocupado":
        return "Ocupado";
      case "disponible":
        return "Disponible";
      default:
        return "N/A";
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-4 mb-8">
      <Card className="p-4 bg-gradient-to-br from-orange-950 via-orange-800 to-slate-950 border border-orange-500/20 rounded-3xl shadow-2xl transition-all hover:shadow-[0_30px_60px_-35px_rgba(153,63,0,0.75)]">
        <div>
          <div className="flex items-start justify-between mb-4 pb-2 border-b border-orange-500/20">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/25 text-orange-200">
                <Building2 className="w-5 h-5 text-orange-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Auditorio A</h3>
                <div className="flex items-center gap-1.5 text-xs mt-1 text-orange-200">
                  <Users className="w-4 h-4 text-orange-300" />
                  <span>
                    {estadoA.reserva ? (
                      (() => {
                        const reserva = estadoA.reserva as any;
                        const agg = asientosConteo[reserva.id] || null;
                        const capacidad = Number(
                          (agg && agg.capacidad) || reserva.capacidad_total || reserva.asistentes || 168
                        );
                        const ocupados = contarOcupados(reserva.id, capacidad);
                        return `${ocupados} / ${capacidad} personas`;
                      })()
                    ) : (
                      "0 / 168 personas"
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div
              className={`w-6 h-6 rounded-full ${obtenerColorEstado(
                estadoA.estado
              )} shadow-lg ${
                estadoA.estado === "ocupado" || estadoA.estado === "disponible"
                  ? "animate-pulse"
                  : ""
              }`}
            />
          </div>
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" />
              <p className="text-sm font-medium">Estado Actual:</p>
            </div>
            <p className="text-3xl font-bold mb-2">
              {obtenerTextoEstado(estadoA.estado)}
            </p>
            {estadoA.reserva && (
              <div className="bg-slate-900/70 text-white rounded-xl p-3 mt-3 border border-primary/30 shadow-md">
                <p className="font-semibold text-primary">{estadoA.reserva.titulo}</p>
                <p className="text-sm mt-1 text-white/90">
                  {estadoA.reserva.horaInicio} - {estadoA.reserva.horaFin}
                </p>
                <p className="text-xs mt-1 text-white/80">
                  {estadoA.reserva.organizador}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-secondary/80 via-[#a55aed] to-accent/50 text-white rounded-2xl shadow-2xl hover:shadow-[0_0_30px_rgba(157,78,221,0.35)] transition-all overflow-hidden relative border-2 border-secondary/40">
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4 pb-4 border-b border-white/20">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-muted rounded-lg border border-border">
                <Building2 className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Auditorio B</h3>
                <div className="flex items-center gap-1.5 text-xs mt-1 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>
                    {estadoB.reserva ? (
                      (() => {
                        const reserva = estadoB.reserva as any;
                        const agg = asientosConteo[reserva.id] || null;
                        const capacidad = Number(
                          (agg && agg.capacidad) || reserva.capacidad_total || reserva.asistentes || 168
                        );
                        const ocupados = contarOcupados(reserva.id, capacidad);
                        return `${ocupados} / ${capacidad} personas`;
                      })()
                    ) : (
                      "0 / 168 personas"
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div
              className={`w-6 h-6 rounded-full ${obtenerColorEstado(
                estadoB.estado
              )} shadow-lg ${
                estadoB.estado === "ocupado" || estadoB.estado === "disponible"
                  ? "animate-pulse"
                  : ""
              }`}
            />
          </div>
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" />
              <p className="text-sm font-medium">Estado Actual:</p>
            </div>
            <p className="text-3xl font-bold mb-2">
              {obtenerTextoEstado(estadoB.estado)}
            </p>
            {estadoB.reserva && (
              <div className="bg-slate-900/70 text-white rounded-xl p-3 mt-3 border border-secondary/30 shadow-md">
                <p className="font-semibold text-secondary">{estadoB.reserva.titulo}</p>
                <p className="text-sm mt-1 text-white/90">
                  {estadoB.reserva.horaInicio} - {estadoB.reserva.horaFin}
                </p>
                <p className="text-xs mt-1 text-white/80">
                  {estadoB.reserva.organizador}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
