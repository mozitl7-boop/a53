"use client";

import type { Reserva } from "@/app/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CalendarIcon,
  Clock,
  MapPin,
  UserPlus,
  CheckCircle2,
  Armchair,
} from "lucide-react";

interface EventoCardProps {
  reserva: Reserva;
  asientosOcupados: number;
  capacidadMaxima: number;
  yaRegistrado: boolean;
  estaLleno: boolean;
  isRegistroAbierto: boolean;
  onAbrirRegistro: () => void;
  onRegistroHijo?: React.ReactNode;
  formatearFecha: (fecha: string) => string;
}

export function EventoCard({
  reserva,
  asientosOcupados,
  capacidadMaxima,
  yaRegistrado,
  estaLleno,
  isRegistroAbierto,
  onAbrirRegistro,
  onRegistroHijo,
  formatearFecha,
}: EventoCardProps) {
  const porcentajeOcupacion = (asientosOcupados / Math.max(1, capacidadMaxima)) * 100;

  return (
    <Card className="p-5 rounded-2xl border border-white/10 bg-slate-900/70 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white truncate">{reserva.titulo}</h3>
          <p className="text-xs text-slate-400 truncate">
            Organizado por <span className="text-orange-300">{reserva.organizador}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge
            className={`rounded-full font-semibold text-xs px-3 py-1 ${
              reserva.auditorio === "A"
                ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
            }`}
          >
            Aud. {reserva.auditorio}
          </Badge>
          {estaLleno && (
            <Badge className="bg-red-500/20 text-red-300 border border-red-500/30 rounded-full text-xs px-3 py-1 font-semibold">
              Lleno
            </Badge>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="space-y-2 mb-4 text-sm">
        <div className="flex items-center gap-3 text-slate-300">
          <CalendarIcon className="w-4 h-4 text-orange-400 flex-shrink-0" />
          <span>{formatearFecha(reserva.fecha)}</span>
        </div>
        <div className="flex items-center gap-3 text-slate-300">
          <Clock className="w-4 h-4 text-orange-400 flex-shrink-0" />
          <span>
            {reserva.horaInicio} - {reserva.horaFin}
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-300">
          <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0" />
          <span>Auditorio {reserva.auditorio}</span>
        </div>
      </div>

      {/* Descripción */}
      {reserva.descripcion && (
        <p className="text-sm text-slate-400 mb-4 line-clamp-2">{reserva.descripcion}</p>
      )}

      {/* Ocupación */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Armchair className="w-3.5 h-3.5 text-orange-400" />
            Asientos disponibles
          </div>
          <span
            className={`text-xs font-bold ${
              porcentajeOcupacion > 80 ? "text-orange-400" : "text-emerald-400"
            }`}
          >
            {capacidadMaxima - asientosOcupados}/{capacidadMaxima}
          </span>
        </div>
        <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden border border-white/5">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              porcentajeOcupacion > 80
                ? "bg-gradient-to-r from-orange-500 to-orange-600"
                : "bg-gradient-to-r from-emerald-500 to-emerald-600"
            }`}
            style={{ width: `${Math.min(porcentajeOcupacion, 100)}%` }}
          />
        </div>
      </div>

      {/* Status or Registro */}
      {yaRegistrado ? (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-emerald-300">Registrado</span>
        </div>
      ) : isRegistroAbierto ? (
        onRegistroHijo
      ) : (
        <Button
          onClick={onAbrirRegistro}
          disabled={estaLleno}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Registrarme
        </Button>
      )}
    </Card>
  );
}
