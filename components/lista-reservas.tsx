"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Building2,
  Calendar,
  Clock,
  User,
  Users,
  Search,
  Filter,
} from "lucide-react";
import type { Reserva, AsistenteRegistrado } from "@/app/page";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

type PropiedadesListaReservas = {
  reservas: Reserva[];
  alEliminar: (id: string, organizerId?: string) => Promise<boolean>;
  alEliminarAsistente: (
    reservaId: string,
    asistenteId: string,
  ) => Promise<boolean>;
  usuarioActualId?: string;
  modoUsuario?: "organizador" | "asistente" | null;
  asistentesRegistrados?: AsistenteRegistrado[];
};

export function ListaReservas({
  reservas,
  alEliminar,
  alEliminarAsistente,
  usuarioActualId,
  asistentesRegistrados,
  modoUsuario,
}: PropiedadesListaReservas) {
  const { toast } = useToast();
  const [mostrarArchivados, setMostrarArchivados] = useState(false);
  const [search, setSearch] = useState("");
  const [auditorioFilter, setAuditorioFilter] = useState<"all" | "A" | "B">(
    "all",
  );
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [onlyWithAvailability, setOnlyWithAvailability] = useState(false);
  const [toDeleteAttendee, setToDeleteAttendee] = useState<{
    reservaId: string;
    asistente: any;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatearFecha = (textoFecha?: string | null) => {
    if (!textoFecha || typeof textoFecha !== "string") return "Fecha inválida";
    const partes = textoFecha.split("-").map((p) => p.trim());
    if (partes.length !== 3) return textoFecha;
    const [year, month, day] = partes.map(Number);
    const fecha = new Date(year, month - 1, day);
    return fecha.toLocaleDateString("es-ES", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredReservas = useMemo(() => {
    return reservas
      .filter((reserva) => {
        if (!mostrarArchivados && reserva.archivado) return false;
        if (auditorioFilter !== "all" && reserva.auditorio !== auditorioFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          if (!reserva.titulo.toLowerCase().includes(q) && !reserva.organizador.toLowerCase().includes(q)) return false;
        }
        const rDate = new Date(reserva.fecha);
        if (dateFrom && rDate < new Date(dateFrom)) return false;
        if (dateTo && rDate > new Date(dateTo)) return false;
        if (onlyWithAvailability) {
          const asistentesCount = (asistentesRegistrados || []).filter(a => String(a.reservaId) === String(reserva.id)).length;
          const capacidad = reserva.asistentes || 168;
          if (asistentesCount >= capacidad) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }, [reservas, mostrarArchivados, auditorioFilter, search, dateFrom, dateTo, onlyWithAvailability, asistentesRegistrados]);

  return (
    <section className="max-h-[calc(100vh-120px)] overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/95 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/95">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800/70 rounded-xl">
            <Calendar className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 leading-tight">Gestión de Eventos</h2>
            <p className="text-sm text-slate-400">Panel de control y monitoreo</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold bg-slate-800 text-slate-300 px-3 py-1.5 rounded-full border border-slate-700">
            {filteredReservas.length} encontrados
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar evento..."
              className="w-full text-sm pl-9 pr-3 py-2 rounded-2xl border border-slate-700 bg-slate-950 text-slate-100 focus:ring-2 focus:ring-cyan-500/30 outline-none transition-all"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={auditorioFilter}
              onChange={(e) => setAuditorioFilter(e.target.value as any)}
              className="w-full text-sm px-3 py-2 rounded-2xl border border-slate-700 bg-slate-950 text-slate-100 outline-none"
            >
              <option value="all">Todos los Auditorios</option>
              <option value="A">Auditorio A</option>
              <option value="B">Auditorio B</option>
            </select>
          </div>

          <div className="flex items-center gap-2 col-span-1 md:col-span-2">
            <input
              type="date"
              value={dateFrom || ""}
              onChange={(e) => setDateFrom(e.target.value || null)}
              className="text-xs px-2 py-2 rounded-2xl border border-slate-700 bg-slate-950 text-slate-100 w-full"
            />
            <span className="text-slate-400">al</span>
            <input
              type="date"
              value={dateTo || ""}
              onChange={(e) => setDateTo(e.target.value || null)}
              className="text-xs px-2 py-2 rounded-2xl border border-slate-700 bg-slate-950 text-slate-100 w-full"
            />
          </div>
        </div>
        
        <div className="flex gap-4 mt-3 px-1">
          <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer hover:text-slate-100 transition-colors">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-700 accent-cyan-500"
              checked={mostrarArchivados}
              onChange={(e) => setMostrarArchivados(e.target.checked)}
            />
            Incluir archivados
          </label>
          <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer hover:text-slate-100 transition-colors">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-700 accent-cyan-500"
              checked={onlyWithAvailability}
              onChange={(e) => setOnlyWithAvailability(e.target.checked)}
            />
            Solo con cupo
          </label>
        </div>
      </div>

      {/* Contenido con Scrollbar Personalizada */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 
        scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent hover:scrollbar-thumb-slate-600">
        {filteredReservas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/80">
            <Filter className="w-12 h-12 text-slate-500 mb-3" />
            <p className="text-slate-400 font-medium">No se encontraron resultados</p>
            <Button variant="link" onClick={() => {setSearch(""); setAuditorioFilter("all")}} className="text-cyan-300 text-xs">
              Limpiar filtros
            </Button>
          </div>
        ) : (
          filteredReservas.map((reserva) => {
            const esOrganizador = modoUsuario === "organizador" || reserva.organizadorId === usuarioActualId;
            const asistentes = (asistentesRegistrados || []).filter(a => String(a.reservaId) === String(reserva.id));
            const capacidadMaxima = reserva.asistentes || 168;
            const restantes = Math.max(0, capacidadMaxima - asistentes.length);

            return (
              <Card
                key={reserva.id}
                className={`group relative overflow-hidden p-0 border border-slate-800 bg-slate-950/90 hover:border-slate-600 transition-all duration-300 rounded-3xl`}
              >
                {/* Indicador lateral de auditorio */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${reserva.auditorio === 'A' ? 'bg-orange-500' : 'bg-purple-500'}`} />
                
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${
                          reserva.auditorio === 'A'
                            ? 'bg-orange-600/15 border-orange-500/30 text-orange-200'
                            : 'bg-purple-600/15 border-purple-500/30 text-purple-200'
                        }`}>
                          Auditorio {reserva.auditorio}
                        </span>
                        {restantes === 0 && (
                          <span className="text-[10px] uppercase font-bold bg-red-500/10 text-red-400 px-2 py-0.5 rounded">Agotado</span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-bold text-slate-100">
                        {reserva.titulo}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-3">
                        <div className="flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-700 p-3 text-slate-300">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span className="text-xs">{formatearFecha(reserva.fecha)}</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-700 p-3 text-slate-300">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span className="text-xs">{reserva.horaInicio} - {reserva.horaFin}</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-700 p-3 text-slate-300">
                          <User className="w-4 h-4 text-slate-500" />
                          <span className="text-xs truncate">{reserva.organizador}</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-700 p-3 text-slate-300">
                          <Users className="w-4 h-4 text-slate-500" />
                          <span className="text-xs">{asistentes.length} / {capacidadMaxima}</span>
                        </div>
                      </div>
                    </div>

                    {esOrganizador && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (window.confirm(`¿Eliminar "${reserva.titulo}"?`)) {
                            alEliminar(reserva.id, reserva.organizadorId);
                          }
                        }}
                        className="text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    )}
                  </div>

                  {/* Detalle de Asistentes expandible */}
                  {esOrganizador && (
                    <div className="mt-4 pt-4 border-t border-slate-800/50">
                      <details className="group/details">
                        <summary className="list-none cursor-pointer flex items-center justify-between text-xs text-slate-400 hover:text-slate-200">
                          <span className="flex items-center gap-2">
                            Lista de Asistentes 
                            <span className="bg-slate-800 px-2 py-0.5 rounded-md text-[10px]">{asistentes.length}</span>
                          </span>
                          <span className="text-primary font-medium group-open/details:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 animate-in fade-in slide-in-from-top-1">
                          {asistentes.map((a) => (
                            <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-200 truncate">{a.nombre}</p>
                                <p className="text-[10px] text-slate-500 truncate">{a.email}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => alEliminarAsistente(reserva.id, a.id)}
                                className="h-7 w-7 p-0 hover:text-red-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </section>
  );
}
