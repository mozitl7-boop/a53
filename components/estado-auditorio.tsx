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
      <Card className="p-5 bg-gradient-to-br from-orange-600 via-orange-500 to-red-600 border border-orange-400/30 rounded-3xl shadow-2xl transition-all hover:shadow-[0_30px_60px_-35px_rgba(234,88,12,0.6)]">
        <div>
          <div className="flex items-start justify-between mb-4 pb-2 border-b border-white/20">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-xl border border-white/30 text-white">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Auditorio A</h3>
                <div className="flex items-center gap-1.5 text-xs mt-1 text-white/90">
                  <Users className="w-4 h-4 text-white" />
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
              <div className="bg-white/10 text-white rounded-xl p-3 mt-3 border border-white/20 shadow-md">
                <p className="font-semibold text-white">{estadoA.reserva.titulo}</p>
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

      <Card className="p-5 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 text-white rounded-3xl shadow-2xl hover:shadow-[0_30px_60px_-35px_rgba(147,51,234,0.6)] transition-all overflow-hidden relative border border-purple-400/30">
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4 pb-2 border-b border-white/20">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-xl border border-white/30">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Auditorio B</h3>
                <div className="flex items-center gap-1.5 text-xs mt-1 text-white/90">
                  <Users className="w-4 h-4 text-white" />
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
              <div className="bg-white/10 text-white rounded-xl p-3 mt-3 border border-white/20 shadow-md">
                <p className="font-semibold text-white">{estadoB.reserva.titulo}</p>
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
