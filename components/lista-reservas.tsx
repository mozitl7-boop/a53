"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Trash2,
  Building2,
  Calendar,
  Clock,
  User,
  Users,
  FileText,
} from "lucide-react";
import type { Reserva } from "@/app/page";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
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
  asistentesRegistrados?: import("@/app/page").AsistenteRegistrado[];
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
  const [archivosSubidos, setArchivosSubidos] = useState<
    Record<string, string[]>
  >({});
  const [mostrarArchivados, setMostrarArchivados] = useState(false);
  const [includeFullInSearch, setIncludeFullInSearch] = useState(false);
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

  const reservasOrdenadas = useMemo(
    () =>
      [...reservas].sort((a, b) => {
        const comparacionFecha =
          new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
        if (comparacionFecha !== 0) return comparacionFecha;
        return a.horaInicio.localeCompare(b.horaInicio);
      }),
    [reservas],
  );

  const formatearFecha = (textoFecha?: string | null) => {
    if (!textoFecha || typeof textoFecha !== "string") {
      return "Fecha inválida";
    }

    // Parseo seguro para evitar crash cuando falta valor o formato no esperado
    const partes = textoFecha.split("-").map((p) => p.trim());
    if (partes.length !== 3) {
      return textoFecha;
    }

    const [year, month, day] = partes.map(Number);
    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
      return textoFecha;
    }

    const fecha = new Date(year, month - 1, day);
    if (Number.isNaN(fecha.getTime())) {
      return textoFecha;
    }

    return fecha.toLocaleDateString("es-ES", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const manejarSubidaArchivo = (
    reservaId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return false;

    if (archivo.type !== "application/pdf") {
      toast({
        title: "Error",
        description: "Solo se permiten archivos PDF",
        variant: "destructive",
      });
      return false;
    }

    if (archivo.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo no puede superar 10 MB",
        variant: "destructive",
      });
      return false;
    }

    setArchivosSubidos((prev) => ({
      ...prev,
      [reservaId]: [...(prev[reservaId] || []), archivo.name],
    }));

    toast({
      title: "Archivo adjuntado",
      description: `${archivo.name} se ha adjuntado exitosamente`,
    });
  };

  if (reservas.length === 0) {
    return (
      <Card className="p-12 text-center rounded-2xl shadow-xl bg-white/80 backdrop-blur-sm">
        <div className="max-w-sm mx-auto">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Calendar className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Sin Reservas</h3>
          <p className="text-gray-600">Crea una nueva reserva para comenzar</p>
        </div>
      </Card>
    );
  }

  return (
    <section className="max-h-[calc(100vh-160px)] overflow-hidden rounded-2xl border border-[var(--border)] bg-card shadow-lg">
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 p-4 border-b border-[var(--border)] bg-background">
          <Calendar className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-semibold">Dashboard de Reservas</h2>
          <span className="ml-auto text-sm font-semibold bg-primary text-primary-foreground px-3 py-1 rounded-full shadow-sm">
            {reservas.length} eventos
          </span>
        </div>

        <div className="px-4 py-3 border-b border-primary/30 bg-background">
          <div className="flex flex-wrap gap-3 items-center">
            <label className="text-sm text-foreground mr-2 flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-2 border-primary/60 accent-primary cursor-pointer"
                checked={mostrarArchivados}
                onChange={(e) => setMostrarArchivados(e.target.checked)}
              />
              Mostrar archivados
            </label>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar título u organizador"
              className="text-sm px-3 py-2 rounded-lg border border-primary/40 bg-[#111b31] text-foreground shadow-sm focus:border-accent focus:ring-1 focus:ring-accent/30"
            />
            <select
              value={auditorioFilter}
              onChange={(e) => setAuditorioFilter(e.target.value as any)}
              className="text-sm px-2 py-2 rounded-lg border border-primary/40 bg-[#111b31] text-foreground"
            >
              <option value="all">Todos los auditorios</option>
              <option value="A">Auditorio A</option>
              <option value="B">Auditorio B</option>
            </select>
            <input
              type="date"
              value={dateFrom || ""}
              onChange={(e) => setDateFrom(e.target.value || null)}
              className="text-sm px-2 py-2 rounded-lg border border-primary/40 bg-[#111b31] text-foreground"
            />
            <input
              type="date"
              value={dateTo || ""}
              onChange={(e) => setDateTo(e.target.value || null)}
              className="text-sm px-2 py-2 rounded-lg border border-primary/40 bg-[#111b31] text-foreground"
            />
            <label className="text-sm text-foreground flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-2 border-secondary/60 accent-secondary cursor-pointer"
                checked={onlyWithAvailability}
                onChange={(e) => setOnlyWithAvailability(e.target.checked)}
              />
              Solo disponibles
            </label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <div className="rounded-xl border border-primary/40 bg-[#0f1d34] p-3 shadow-md">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Eventos totales
              </p>
              <p className="text-2xl font-bold text-foreground">
                {reservas.length}
              </p>
            </div>
            <div className="rounded-xl border border-primary/40 bg-[#0f1d34] p-3 shadow-md">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Archivados
              </p>
              <p className="text-2xl font-bold text-foreground">
                {reservas.filter((r) => r.archivado).length}
              </p>
            </div>
            <div className="rounded-xl border border-primary/40 bg-[#0f1d34] p-3 shadow-md">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Con cupo disponible
              </p>
              <p className="text-2xl font-bold text-foreground">
                {
                  reservas.filter((reserva) => {
                    const asistentes = (asistentesRegistrados || []).filter(
                      (a) => String(a.reservaId) === String(reserva.id),
                    );
                    const capacidad = reserva.asistentes
                      ? Math.min(
                          reserva.asistentes,
                          reserva.auditorio === "A" ? 168 : 168,
                        )
                      : reserva.auditorio === "A"
                        ? 168
                        : 168;
                    return asistentes.length < capacidad;
                  }).length
                }
              </p>
            </div>
            <div className="rounded-xl border border-primary/40 bg-[#0f1d34] p-3 shadow-md">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Filtro activo
              </p>
              <p className="text-lg font-semibold text-foreground">
                {auditorioFilter === "all"
                  ? "Todos"
                  : `Auditorio ${auditorioFilter}`}
              </p>
            </div>
          </div>

          {reservasOrdenadas.length === 0 ? (
            <div className="rounded-xl border border-primary/40 bg-card/80 p-6 text-center text-muted-foreground">
              No hay reservas que coincidan con los filtros seleccionados.
            </div>
          ) : null}

          {reservasOrdenadas
            .filter((reserva) => {
              const isPast =
                new Date(reserva.fecha) <
                new Date(new Date().setHours(0, 0, 0, 0));
              const isArchived = Boolean(reserva.archivado);
              if (!mostrarArchivados && isArchived) return false;

              // Auditorio filter
              if (
                auditorioFilter !== "all" &&
                reserva.auditorio !== auditorioFilter
              )
                return false;

              // Search filter (title or organizer)
              if (search) {
                const q = search.toLowerCase();
                if (
                  !reserva.titulo.toLowerCase().includes(q) &&
                  !reserva.organizador.toLowerCase().includes(q)
                )
                  return false;
              }

              // Date range filter
              if (dateFrom) {
                const from = new Date(dateFrom);
                const rDate = new Date(reserva.fecha);
                if (rDate < from) return false;
              }
              if (dateTo) {
                const to = new Date(dateTo);
                const rDate = new Date(reserva.fecha);
                if (rDate > to) return false;
              }

              // Availability filter
              if (onlyWithAvailability) {
                const asistentes = (asistentesRegistrados || []).filter(
                  (a) => String(a.reservaId) === String(reserva.id),
                );
                const capacidadAuditorio =
                  reserva.auditorio === "A" ? 168 : 168;
                const capacidadMaxima =
                  reserva.asistentes && reserva.asistentes > 0
                    ? Math.min(reserva.asistentes, capacidadAuditorio)
                    : capacidadAuditorio;
                const restantes = Math.max(
                  0,
                  capacidadMaxima - asistentes.length,
                );
                if (restantes <= 0) return false;
              }

              // If user explicitly requests to include full rooms in search, allow
              // full events to appear when a search query is present (but they
              // will still show as full and not allow registration).
              const asistentesForThis = (asistentesRegistrados || []).filter(
                (a) => String(a.reservaId) === String(reserva.id),
              );
              const capacidadAuditorio2 = reserva.auditorio === "A" ? 168 : 168;
              const capacidadMaxima2 =
                reserva.asistentes && reserva.asistentes > 0
                  ? Math.min(reserva.asistentes, capacidadAuditorio2)
                  : capacidadAuditorio2;
              const isFull = asistentesForThis.length >= capacidadMaxima2;
              if (search && includeFullInSearch) {
                // allow full events to be included in search results
              } else {
                if (isFull && onlyWithAvailability) return false;
              }

              return reserva;
            })
            .map((reserva) => {
              const isArchived = Boolean(reserva.archivado);
              if (!mostrarArchivados && isArchived) return false;

              // Auditorio filter
              if (
                auditorioFilter !== "all" &&
                reserva.auditorio !== auditorioFilter
              )
                return false;

              // Search filter (title or organizer)
              if (search) {
                const q = search.toLowerCase();
                if (
                  !reserva.titulo.toLowerCase().includes(q) &&
                  !reserva.organizador.toLowerCase().includes(q)
                )
                  return false;
              }

              // Date range filter
              if (dateFrom) {
                const from = new Date(dateFrom);
                const rDate = new Date(reserva.fecha);
                if (rDate < from) return false;
              }
              if (dateTo) {
                const to = new Date(dateTo);
                const rDate = new Date(reserva.fecha);
                if (rDate > to) return false;
              }

              // Availability filter
              if (onlyWithAvailability) {
                const asistentes = (asistentesRegistrados || []).filter(
                  (a) => String(a.reservaId) === String(reserva.id),
                );
                const capacidadAuditorio =
                  reserva.auditorio === "A" ? 168 : 168;
                const capacidadMaxima =
                  reserva.asistentes && reserva.asistentes > 0
                    ? Math.min(reserva.asistentes, capacidadAuditorio)
                    : capacidadAuditorio;
                const restantes = Math.max(
                  0,
                  capacidadMaxima - asistentes.length,
                );
                if (restantes <= 0) return false;
              }

              // If user explicitly requests to include full rooms in search, allow
              // full events to appear when a search query is present (but they
              // will still show as full and not allow registration).
              const asistentesForThis = (asistentesRegistrados || []).filter(
                (a) => String(a.reservaId) === String(reserva.id),
              );
              const capacidadAuditorio2 = reserva.auditorio === "A" ? 168 : 168;
              const capacidadMaxima2 =
                reserva.asistentes && reserva.asistentes > 0
                  ? Math.min(reserva.asistentes, capacidadAuditorio2)
                  : capacidadAuditorio2;
              const isFull = asistentesForThis.length >= capacidadMaxima2;
              if (search && includeFullInSearch) {
                // allow full events to be included in search results
              } else {
                if (isFull && onlyWithAvailability) return false;
              }

              return reserva;
            })
            .map((reserva, index) => {
              const esOrganizador =
                (typeof modoUsuario !== "undefined" &&
                  modoUsuario === "organizador") ||
                reserva.organizadorId === usuarioActualId;
              const archivos = archivosSubidos[reserva.id] || [];
              const asistentes = (asistentesRegistrados || []).filter(
                (a) => String(a.reservaId) === String(reserva.id),
              );
              const capacidadAuditorio = reserva.auditorio === "A" ? 168 : 168;
              const capacidadMaxima =
                reserva.asistentes && reserva.asistentes > 0
                  ? Math.min(reserva.asistentes, capacidadAuditorio)
                  : capacidadAuditorio;
              const restantes = Math.max(
                0,
                capacidadMaxima - asistentes.length,
              );

              return (
                <Card
                  key={reserva.id || `reserva-${index}`}
                  className={`p-4 rounded-xl transition-all hover:shadow-lg ${
                    reserva.auditorio === "A"
                      ? "border-l-4 border-l-blue-500 bg-blue-50/50"
                      : "border-l-4 border-l-purple-500 bg-purple-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className={`p-1.5 rounded-lg shadow-md ${
                            reserva.auditorio === "A"
                              ? "bg-gradient-to-br from-blue-500 to-blue-600"
                              : "bg-gradient-to-br from-purple-500 to-purple-600"
                          }`}
                        >
                          <Building2 className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold truncate">
                          {reserva.titulo}
                        </h3>
                        <div className="ml-auto flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium text-white shadow-md ${
                              reserva.auditorio === "A"
                                ? "bg-gradient-to-r from-blue-500 to-blue-600"
                                : "bg-gradient-to-r from-purple-500 to-purple-600"
                            }`}
                          >
                            Auditorio {reserva.auditorio}
                          </span>
                          {restantes === 0 && (
                            <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-semibold">
                              Auditorio lleno
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 shrink-0" />
                          <span className="truncate">
                            {formatearFecha(reserva.fecha)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span className="truncate">
                            {reserva.horaInicio} - {reserva.horaFin}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 shrink-0" />
                          <span className="truncate">
                            {reserva.organizador}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 shrink-0" />
                          <span className="truncate">
                            {asistentes.length} asistentes
                          </span>
                        </div>
                      </div>

                      {reserva.descripcion && (
                        <p className="mt-3 text-sm text-gray-600 bg-white/60 p-2 rounded-lg">
                          {reserva.descripcion}
                        </p>
                      )}

                      {archivos.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Archivos adjuntos ({archivos.length})
                          </p>
                          <div className="space-y-1">
                            {archivos.map((nombre, idx) => (
                              <div
                                key={idx}
                                className="text-xs text-gray-600 flex items-center gap-2"
                              >
                                <FileText className="w-3 h-3" />
                                {nombre}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {esOrganizador && (
                        <div className="mt-3">
                          <details className="rounded-lg bg-white/60 p-3">
                            <summary className="cursor-pointer font-medium text-sm text-gray-700 mb-2 flex items-center justify-between">
                              <span>Ver asistentes ({asistentes.length})</span>
                              <span className="text-xs text-gray-500">
                                Restantes: {restantes}
                              </span>
                            </summary>
                            <div className="mt-2 space-y-2">
                              {asistentes.length === 0 ? (
                                <div className="text-sm text-gray-600">
                                  No hay asistentes registrados
                                </div>
                              ) : (
                                asistentes.map((a) => (
                                  <div
                                    key={a.id}
                                    className="flex items-center justify-between text-sm text-gray-700 bg-white/50 p-2 rounded-lg hover:bg-white/80 transition-colors"
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium">
                                        {a.nombre}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {a.email}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="text-right text-xs text-gray-600">
                                        Asiento {a.numeroAsiento}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          console.info(
                                            "ListaReservas: click eliminar asistente (direct)",
                                            {
                                              reservaId: reserva.id,
                                              asistenteId: a.id,
                                            },
                                          );
                                          alEliminarAsistente(reserva.id, a.id);
                                        }}
                                        className="h-auto p-1 hover:bg-red-100 hover:text-red-600"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </details>
                        </div>
                      )}
                      {/* Archival controlled by server; no local archive actions shown */}
                    </div>

                    <div className="flex items-center gap-2">
                      {esOrganizador && (
                        <>
                          {/* Removed: 'Ver auditorio' dialog and the related dialog-trigger trash icon
                            These controls were non-functional; kept the dev-only direct delete button below. */}

                          {/* Confirm delete attendee dialog (controlled) */}
                          <Dialog
                            open={!!toDeleteAttendee}
                            onOpenChange={(open) => {
                              if (!open) setToDeleteAttendee(null);
                            }}
                          >
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Eliminar asistente</DialogTitle>
                                <DialogDescription>
                                  ¿Confirmas eliminar a
                                  {toDeleteAttendee
                                    ? ` ${toDeleteAttendee.asistente.nombre}`
                                    : ""}
                                  ?
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="ghost" disabled={isDeleting}>
                                    Cancelar
                                  </Button>
                                </DialogClose>
                                <Button
                                  className="bg-red-600 text-white"
                                  disabled={isDeleting}
                                  onClick={async () => {
                                    if (!toDeleteAttendee) return false;
                                    setIsDeleting(true);
                                    try {
                                      console.info(
                                        "ListaReservas: confirm delete asistente from dialog",
                                        {
                                          reservaId: toDeleteAttendee.reservaId,
                                          asistenteId:
                                            toDeleteAttendee.asistente.id,
                                        },
                                      );
                                      const success = await alEliminarAsistente(
                                        toDeleteAttendee.reservaId,
                                        toDeleteAttendee.asistente.id,
                                      );
                                      if (success) {
                                        setToDeleteAttendee(null);
                                        toast({
                                          title: "Eliminado",
                                          description:
                                            "Asistente eliminado correctamente",
                                        });
                                      } else {
                                        toast({
                                          title: "Error",
                                          description:
                                            "No se pudo eliminar al asistente",
                                          variant: "destructive",
                                        });
                                      }
                                    } finally {
                                      setIsDeleting(false);
                                    }
                                  }}
                                >
                                  {isDeleting ? "Eliminando..." : "Eliminar"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          {/* Production delete button for organizers: shows for actual organizers */}
                          <Button
                            variant="destructive"
                            size="sm"
                            title="Eliminar evento"
                            className="h-auto"
                            onClick={async () => {
                              // confirm delete action with user
                              if (
                                !window.confirm(
                                  `¿Confirmas eliminar el evento "${reserva.titulo}"? Esta acción no se puede deshacer.`,
                                )
                              )
                                return false;
                              setIsDeleting(true);
                              try {
                                const ok = await alEliminar(
                                  reserva.id,
                                  reserva.organizadorId as any,
                                );
                                if (ok) {
                                  toast({
                                    title: "Evento eliminado",
                                    description:
                                      "El evento fue eliminado correctamente",
                                  });
                                } else {
                                  toast({
                                    title: "Error",
                                    description:
                                      "No se pudo eliminar el evento",
                                    variant: "destructive",
                                  });
                                }
                              } finally {
                                setIsDeleting(false);
                              }
                            }}
                          >
                            Borrar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>
      </div>
    </section>
  );
}
