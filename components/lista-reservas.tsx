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
  Filter,
  Download,
  CheckCircle2,
  Circle,
} from "lucide-react";
import type { Reserva, AsistenteRegistrado } from "@/app/page";
import { BuscadorEventos, type FiltrosBusqueda } from "@/components/buscador-eventos";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type PropiedadesListaReservas = {
  reservas: Reserva[];
  alEliminar: (id: string, organizerId?: string) => Promise<boolean>;
  alEliminarAsistente: (
    reservaId: string,
    asistenteId: string,
  ) => Promise<boolean>;
  alActualizarAsistencia: (
    reservaId: string,
    registroId: string,
    asistio: boolean,
  ) => Promise<boolean>;
  usuarioActualId?: string;
  modoUsuario?: "organizador" | "asistente" | null;
  asistentesRegistrados?: AsistenteRegistrado[];
  abrirFiltrosSolicitud?: number;
};

export function ListaReservas({
  reservas,
  alEliminar,
  alEliminarAsistente,
  alActualizarAsistencia,
  usuarioActualId,
  asistentesRegistrados,
  modoUsuario,
  abrirFiltrosSolicitud = 0,
}: PropiedadesListaReservas) {
  const { toast } = useToast();
  const [mostrarArchivados, setMostrarArchivados] = useState(false);
  const [onlyWithAvailability, setOnlyWithAvailability] = useState(false);
  const [toDeleteAttendee, setToDeleteAttendee] = useState<{
    reservaId: string;
    asistente: any;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reservaParaEliminar, setReservaParaEliminar] = useState<Reserva | null>(null);
  const [filtrosCompartidos, setFiltrosCompartidos] = useState<FiltrosBusqueda | null>(null);
  const [actualizandoAsistencia, setActualizandoAsistencia] = useState<Record<string, boolean>>({});

  const descargarReporte = (reserva: Reserva, asistentes: AsistenteRegistrado[]) => {
    const formatearFechaRegistro = (fechaRegistro: string) => {
      const fecha = new Date(fechaRegistro);
      if (Number.isNaN(fecha.getTime())) return fechaRegistro;

      const fechaGmtMenos6 = new Date(fecha.getTime() - 6 * 60 * 60 * 1000);
      const dosDigitos = (valor: number) => String(valor).padStart(2, "0");
      return `${dosDigitos(fechaGmtMenos6.getUTCDate())}/${dosDigitos(
        fechaGmtMenos6.getUTCMonth() + 1
      )}/${fechaGmtMenos6.getUTCFullYear()} ${dosDigitos(
        fechaGmtMenos6.getUTCHours()
      )}:${dosDigitos(fechaGmtMenos6.getUTCMinutes())}`;
    };
    const escapar = (valor: string | number) => {
      const texto = String(valor);
      const seguro = /^[=+\-@]/.test(texto) ? `'${texto}` : texto;
      return `"${seguro.replace(/"/g, '""')}"`;
    };
    const filas = [
      ["Conferencia", "Asistente", "Correo", "Asiento", "Fecha de registro", "Asistió"],
      ...asistentes.map((asistente) => [
        reserva.titulo,
        asistente.nombre,
        asistente.email,
        asistente.numeroAsiento,
        formatearFechaRegistro(asistente.fechaRegistro),
        asistente.asistio ? "Sí" : "No",
      ]),
    ];
    const contenido = filas.map((fila) => fila.map(escapar).join(",")).join("\r\n");
    const archivo = new Blob([`\uFEFF${contenido}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `reporte-${reserva.titulo.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${reserva.fecha}.csv`;
    enlace.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

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
        if (filtrosCompartidos) {
          const query = filtrosCompartidos.textoBusqueda.trim().toLowerCase();
          if (
            query &&
            !reserva.titulo.toLowerCase().includes(query) &&
            !reserva.descripcion.toLowerCase().includes(query) &&
            !reserva.organizador.toLowerCase().includes(query)
          ) return false;
          if (filtrosCompartidos.auditorio !== "todos" && reserva.auditorio !== filtrosCompartidos.auditorio) return false;
          if (filtrosCompartidos.carrera !== "todos" && reserva.carrera !== filtrosCompartidos.carrera) return false;
          if (filtrosCompartidos.fechaInicio && reserva.fecha < filtrosCompartidos.fechaInicio) return false;
          if (filtrosCompartidos.fechaFin && reserva.fecha > filtrosCompartidos.fechaFin) return false;
        }
        const rDate = new Date(reserva.fecha);
        if (onlyWithAvailability) {
          const asistentesCount = (asistentesRegistrados || []).filter(a => String(a.reservaId) === String(reserva.id)).length;
          const capacidad = reserva.asistentes || 168;
          if (asistentesCount >= capacidad) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }, [reservas, mostrarArchivados, onlyWithAvailability, asistentesRegistrados, filtrosCompartidos]);

  return (
    <section className="mx-auto w-full max-w-6xl max-h-[calc(100vh-120px)] overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/95 shadow-2xl flex flex-col">
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

      <div id="organizador-filtros" className="scroll-mt-6 border-b border-slate-800 bg-slate-900/90 p-3 md:p-4">
        <BuscadorEventos
          alBuscar={setFiltrosCompartidos}
          alLimpiar={() => setFiltrosCompartidos(null)}
          abrirFiltrosSolicitud={abrirFiltrosSolicitud}
        />
      </div>

      {/* Opciones propias de administración */}
      <div className="border-b border-slate-800 bg-slate-900/90 p-4">
        <div className="flex flex-wrap gap-4 px-1">
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
            <Filter className="w-12 h-12 text-muted mb-3" />
            <p className="text-slate-400 font-medium">No se encontraron resultados</p>
            <Button variant="link" onClick={() => setFiltrosCompartidos(null)} className="text-cyan-300 text-xs">
              Limpiar filtros
            </Button>
          </div>
        ) : (
          filteredReservas.map((reserva) => {
            const esOrganizador = modoUsuario === "organizador" || reserva.organizadorId === usuarioActualId;
            const asistentes = (asistentesRegistrados || []).filter(a => String(a.reservaId) === String(reserva.id));
            const capacidadMaxima = reserva.asistentes || 168;
            const restantes = Math.max(0, capacidadMaxima - asistentes.length);
            const totalAsistieron = asistentes.filter((asistente) => asistente.asistio).length;

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
                          <Calendar className="w-4 h-4 text-muted" />
                          <span className="text-xs">{formatearFecha(reserva.fecha)}</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-700 p-3 text-slate-300">
                          <Clock className="w-4 h-4 text-muted" />
                          <span className="text-xs">{reserva.horaInicio} - {reserva.horaFin}</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-700 p-3 text-slate-300">
                          <User className="w-4 h-4 text-muted" />
                          <span className="text-xs truncate">{reserva.organizador}</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-700 p-3 text-slate-300">
                          <Users className="w-4 h-4 text-muted" />
                          <span className="text-xs">{asistentes.length} / {capacidadMaxima}</span>
                        </div>
                      </div>
                    </div>

                    {esOrganizador && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setReservaParaEliminar(reserva)}
                        aria-label={`Eliminar ${reserva.titulo}`}
                        className="text-muted hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    )}
                  </div>

                  {/* Detalle de Asistentes expandible */}
                  {esOrganizador && (
                    <div className="mt-4 pt-4 border-t border-slate-800/50">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-slate-300">
                          Asistencia confirmada: <span className="font-semibold text-emerald-300">{totalAsistieron}</span> de {asistentes.length}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => descargarReporte(reserva, asistentes)}
                          className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Descargar reporte CSV
                        </Button>
                      </div>
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
                                <p className="text-[10px] text-muted truncate">{a.email}</p>
                                <p className={`text-[10px] ${a.asistio ? "text-emerald-300" : "text-slate-500"}`}>
                                  {a.asistio ? "Asistió" : "Pendiente de check-in"}
                                </p>
                              </div>
                                <div className="ml-2 flex shrink-0 items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={Boolean(actualizandoAsistencia[a.id])}
                                    aria-label={a.asistio ? `Quitar asistencia de ${a.nombre}` : `Marcar asistencia de ${a.nombre}`}
                                    title={a.asistio ? "Quitar asistencia" : "Marcar asistencia"}
                                    onClick={async () => {
                                      setActualizandoAsistencia((previous) => ({ ...previous, [a.id]: true }));
                                      const actualizado = await alActualizarAsistencia(reserva.id, a.id, !a.asistio);
                                      if (!actualizado) {
                                        toast({
                                          title: "No se pudo actualizar",
                                          description: "Inténtalo de nuevo. La asistencia no se modificó.",
                                          variant: "destructive",
                                        });
                                      }
                                      setActualizandoAsistencia((previous) => ({ ...previous, [a.id]: false }));
                                    }}
                                    className="h-8 px-2 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200"
                                  >
                                    {a.asistio ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => alEliminarAsistente(reserva.id, a.id)}
                                    aria-label={`Eliminar registro de ${a.nombre}`}
                                    className="h-7 w-7 p-0 hover:text-red-400"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
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
      <AlertDialog
        open={Boolean(reservaParaEliminar)}
        onOpenChange={(open) => {
          if (!open) setReservaParaEliminar(null);
        }}
      >
        <AlertDialogContent className="border-red-400/20 bg-slate-950 text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta reserva?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Se eliminará &quot;{reservaParaEliminar?.titulo}&quot; y esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReservaParaEliminar(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={async () => {
                if (!reservaParaEliminar) return;
                const reserva = reservaParaEliminar;
                setReservaParaEliminar(null);
                await alEliminar(reserva.id, reserva.organizadorId);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
