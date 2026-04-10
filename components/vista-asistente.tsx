"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import type { Reserva, AsistenteRegistrado } from "@/app/page";
import { BuscadorEventos, type FiltrosBusqueda } from "@/components/buscador-eventos";
import {
  CalendarIcon,
  Clock,
  MapPin,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Armchair,
  Mail,
  User,
  Eye,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type PropiedadesVistaAsistente = {
  reservas: Reserva[];
  asistentesRegistrados: AsistenteRegistrado[];
  onRegisterAttendee: (
    reservaId: string,
    nombre: string,
    email: string
  ) => Promise<{ exito: boolean; mensaje: string; asiento?: number }>;
};

export function VistaAsistente({
  reservas,
  asistentesRegistrados,
  onRegisterAttendee,
}: PropiedadesVistaAsistente) {
  const { toast } = useToast();
  const [dialogsAbiertos, setDialogsAbiertos] = useState<
    Record<string, boolean>
  >({});
  const [detalleAsientoAbierto, setDetalleAsientoAbierto] = useState<
    string | null
  >(null);
  const [filtrosActivos, setFiltrosActivos] = useState<FiltrosBusqueda | null>(
    null
  );
  const [datosFormulario, setDatosFormulario] = useState({
    nombre: "",
    email: "",
  });
  const [conteosServidor, setConteosServidor] = useState<
    Record<string, { ocupados: number; capacidad: number }>
  >({});
  const [isSubmittingByEvent, setIsSubmittingByEvent] = useState<
    Record<string, boolean>
  >({});

  // Obtener datos del usuario logueado al montar el componente
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/auth/me`);
        const data = await res.json();
        if (mounted && res.ok && data.user) {
          setDatosFormulario({
            nombre: data.user.nombre || "",
            email: data.user.email || "",
          });
        }
      } catch (e) {
        // ignore errors - user data will remain empty
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Sincronización en tiempo real para eventos
  const { data: eventosActualizados, isConnected } = useRealtimeSync<Reserva[]>(
    "evento:creado",
    reservas,
    []
  );

  // Sincronización en tiempo real para registros de asistentes
  const { data: registrosActualizados } = useRealtimeSync<
    AsistenteRegistrado[]
  >("asistente:registrado", asistentesRegistrados, []);

  // Usar datos actualizados o datos iniciales
  const eventosActuales = eventosActualizados || reservas;
  const registrosActuales = registrosActualizados || asistentesRegistrados;

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha + "T00:00:00");
    return date.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const obtenerAsientosOcupados = (reservaId: string) => {
    return registrosActuales.filter((a) => a.reservaId === reservaId).length;
  };

  // Determine capacity for a given reserva: prefer server-provided capacity, then reserva.capacidad_total,
  // then reserva.asistentes (asistentes_esperados), and finally fall back to auditorio default (168).
  const obtenerCapacidadMaxima = (reserva: Reserva) => {
    const servidor = conteosServidor[reserva.id];
    if (servidor && typeof servidor.capacidad === "number" && servidor.capacidad > 0)
      return servidor.capacidad;
    if (reserva.capacidad_total && reserva.capacidad_total > 0) return reserva.capacidad_total;
    if (reserva.asistentes && reserva.asistentes > 0) return reserva.asistentes;
    return reserva.auditorio === "A" ? 168 : 168;
  };

  const estaLleno = (reserva: Reserva) => {
    const servidor = conteosServidor[reserva.id];
    const ocupadosServidor =
      servidor && typeof servidor.ocupados === "number"
        ? servidor.ocupados
        : reserva.asistentes_registrados || obtenerAsientosOcupados(reserva.id);
    const capacidadServidor =
      servidor &&
      typeof servidor.capacidad === "number" &&
      servidor.capacidad > 0
        ? servidor.capacidad
        : reserva.capacidad_total ||
          reserva.asistentes ||
          obtenerCapacidadMaxima(reserva.auditorio);

    return ocupadosServidor >= capacidadServidor;
  };

  // Helper: prefer servidor.capacidad if available, otherwise fallback to auditorio default
  const serverrCapacidad = (
    reserva: Reserva,
    servidor?: { ocupados: number; capacidad: number }
  ) => {
    if (
      servidor &&
      typeof servidor.capacidad === "number" &&
      servidor.capacidad > 0
    )
      return servidor.capacidad;
    if (reserva.capacidad_total && reserva.capacidad_total > 0)
      return reserva.capacidad_total;
    if (reserva.asistentes && reserva.asistentes > 0) return reserva.asistentes;
    return obtenerCapacidadMaxima(reserva.auditorio);
  };

  // Polling: periodically fetch conteo agregado desde el servidor para cada reserva mostrada
  // Subscribe to server `asientos:conteo` events instead of polling
  const { data: asientosRealtime } = useRealtimeSync<any>(
    "asientos:conteo",
    null,
    []
  );

  useEffect(() => {
    if (!asientosRealtime) return;
    try {
      const payload = asientosRealtime as any;
      const eventoId =
        payload.reservaId || payload.eventoId || payload.id_evento;
      if (!eventoId) return;
      const ocupados = Number(payload.ocupados || 0);
      const capacidad = Number(
        payload.capacidad || payload.capacidad_total || 0
      );
      setConteosServidor((prev) => ({
        ...prev,
        [eventoId]: { ocupados, capacidad },
      }));
    } catch (e) {
      // ignore
    }
  }, [asientosRealtime]);

  const eventosDisponibles = eventosActuales.filter((reserva) => {
    const fechaReserva = new Date(reserva.fecha + "T00:00:00");
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fechaReserva >= hoy;
  });

  const eventosFiltrados = filtrosActivos
    ? eventosDisponibles.filter((reserva) => {
        // Filtro por texto de búsqueda
        if (
          filtrosActivos.textoBusqueda &&
          !reserva.titulo
            .toLowerCase()
            .includes(filtrosActivos.textoBusqueda.toLowerCase()) &&
          !reserva.descripcion
            .toLowerCase()
            .includes(filtrosActivos.textoBusqueda.toLowerCase())
        ) {
          return false;
        }

        // Filtro por auditorio
        if (
          filtrosActivos.auditorio !== "todos" &&
          reserva.auditorio !== filtrosActivos.auditorio
        ) {
          return false;
        }

        // Filtro por carrera
        if (
          filtrosActivos.carrera !== "todos" &&
          reserva.carrera !== filtrosActivos.carrera
        ) {
          return false;
        }

        // Filtro por fecha inicio
        if (
          filtrosActivos.fechaInicio &&
          new Date(reserva.fecha) < new Date(filtrosActivos.fechaInicio)
        ) {
          return false;
        }

        // Filtro por fecha fin
        if (
          filtrosActivos.fechaFin &&
          new Date(reserva.fecha) > new Date(filtrosActivos.fechaFin)
        ) {
          return false;
        }

        // Availability / full filter: allow including full rooms when the
        // search filter explicitly requests it (`includeFull`), otherwise
        // hide full events from results.
        try {
          const servidor = conteosServidor[reserva.id];
          const ocupados =
            servidor && typeof servidor.ocupados === "number"
              ? servidor.ocupados
              : reserva.asistentes_registrados ||
                obtenerAsientosOcupados(reserva.id);
          const capacidad =
            servidor &&
            typeof servidor.capacidad === "number" &&
            servidor.capacidad > 0
              ? servidor.capacidad
              : reserva.capacidad_total ||
                reserva.asistentes ||
                obtenerCapacidadMaxima(reserva.auditorio);
          const isFull = ocupados >= capacidad;
          if (isFull && !filtrosActivos.includeFull) return false;
        } catch (e) {
          // ignore availability check errors
        }

        return true;
      })
    : eventosDisponibles;

  const misRegistros = registrosActuales.filter(
    (asistente) =>
      asistente.email === datosFormulario.email && datosFormulario.email !== ""
  );

  const eventosPorAuditorio = eventosActuales.reduce(
    (acc, reserva) => {
      if (reserva.auditorio === "A") acc.A += 1;
      if (reserva.auditorio === "B") acc.B += 1;
      return acc;
    },
    { A: 0, B: 0 }
  );

  const totalEventos = eventosActuales.length;

  const setDialogAbierto = (reservaId: string, abierto: boolean) => {
    setDialogsAbiertos((prev) => ({ ...prev, [reservaId]: abierto }));
  };

  const manejarRegistro = (reservaId: string) => async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevenir múltiples envíos simultáneos
    if (isSubmittingByEvent[reservaId]) {
      return;
    }

    setIsSubmittingByEvent((prev) => ({ ...prev, [reservaId]: true }));

    try {
      const resultado = await onRegisterAttendee(
        reservaId,
        datosFormulario.nombre,
        datosFormulario.email
      );
      if (resultado.exito) {
        toast({
          title: "Registro exitoso",
          description: `${resultado.mensaje}. Te esperamos en el evento.`,
        });
        setDialogAbierto(reservaId, false);
        setDatosFormulario({ nombre: "", email: "" });
      } else {
        toast({
          title: "Error al registrar",
          description: resultado.mensaje,
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmittingByEvent((prev) => ({ ...prev, [reservaId]: false }));
    }
  };

  return (
    <div className="space-y-4">
      {misRegistros.length > 0 && (
        <Card className="p-4 rounded-3xl shadow-[0_25px_50px_-30px_rgba(15,23,42,0.85)] bg-slate-950/95 border border-white/10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-white">Mis Registros</h2>
              <p className="text-sm text-slate-400">Eventos a los que estás registrado</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.location.reload()}
                className="text-sm"
              >
                Actualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFiltrosActivos(null)}
                className="text-sm"
              >
                Ver todos
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {misRegistros.map((asistente) => {
              const reserva = eventosActuales.find(
                (r) => r.id === asistente.reservaId
              );
              if (!reserva) return null;

              return (
                <div
                  key={asistente.id}
                  className="rounded-3xl border border-white/10 bg-slate-900/90 p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.9)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_60px_-30px_rgba(15,23,42,0.9)]"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <Badge className="rounded-2xl bg-cyan-500/20 text-cyan-300 px-3 py-1 text-sm font-semibold">
                      Asiento {asistente.numeroAsiento}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDetalleAsientoAbierto(asistente.id)}
                      className="h-9 px-4 text-sm font-semibold"
                    >
                      Ver
                    </Button>
                  </div>
                  <h3 className="text-lg font-bold text-white leading-tight mb-2">{reserva.titulo}</h3>
                  <div className="space-y-2 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-cyan-300" />
                      <span>{formatearFecha(reserva.fecha)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-300" />
                      <span>{reserva.horaInicio}</span>
                    </div>
                    <Badge className="rounded-full bg-emerald-500/15 text-emerald-300 px-3 py-1 text-sm">
                      Aud. {reserva.auditorio}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <BuscadorEventos 
        onFiltros={(filtros) => setFiltrosActivos(filtros)}
      />

      <Card className="p-4 rounded-xl shadow-md bg-card border border-border">
        <div className="flex items-center gap-3 mb-3 pb-2 border-b border-border">
          <div className="p-2 bg-muted rounded-md">
            <UserPlus className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Eventos Disponibles</h2>
            <p className="text-sm text-muted-foreground">
              Regístrate para asistir a un evento
            </p>
          </div>
        </div>

        {eventosFiltrados.length === 0 ? (
          <div className="text-center py-6">
            <CalendarIcon className="w-14 h-14 mx-auto mb-2 text-gray-400" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-1">
              No hay eventos disponibles
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Vuelve más tarde para ver nuevos eventos
            </p>
            <div className="flex justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Actualizar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFiltrosActivos(null)}
              >
                Ver todos
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {eventosFiltrados.map((reserva) => {
              const asientosOcupados = obtenerAsientosOcupados(reserva.id);
              const servidor = conteosServidor[reserva.id];
              const capacidadAuditorio = obtenerCapacidadMaxima(reserva);
              const capacidadMaxima = capacidadAuditorio;
              const displayedOcupados =
                servidor && typeof servidor.ocupados === "number"
                  ? servidor.ocupados
                  : asientosOcupados;
              const porcentajeOcupacion = (displayedOcupados / Math.max(1, capacidadMaxima)) * 100;
              const yaRegistrado = registrosActuales.some(
                (a) =>
                  a.reservaId === reserva.id &&
                  a.email === datosFormulario.email &&
                  datosFormulario.email !== ""
              );

              return (
                <Card
                  key={reserva.id}
                  className="p-4 rounded-lg border border-border shadow-sm hover:shadow-md transition-all bg-card"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-bold mb-0.5">
                        {reserva.titulo}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Por {reserva.organizador}
                      </p>
                    </div>
                    <Badge
                      className={`${
                        reserva.auditorio === "A"
                          ? "bg-orange-500"
                          : "bg-purple-600"
                      } text-white font-semibold px-2 py-1 text-xs rounded-lg`}>
                      Aud. {reserva.auditorio}
                    </Badge>
                    {estaLleno(reserva) && (
                      <Badge className="ml-2 bg-red-500 text-white font-semibold px-2 py-1 text-xs rounded-lg">
                        Auditorio lleno
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <CalendarIcon className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">
                        {formatearFecha(reserva.fecha)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Clock className="w-4 h-4 text-purple-500" />
                      <span className="font-medium">
                        {reserva.horaInicio} - {reserva.horaFin}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <MapPin className="w-4 h-4 text-green-500" />
                      <span className="font-medium">
                        Auditorio {reserva.auditorio}
                      </span>
                    </div>
                  </div>

                  {reserva.descripcion && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {reserva.descripcion}
                    </p>
                  )}

                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-2 font-medium text-gray-600">
                      <span className="flex items-center gap-1">
                        <Armchair className="w-3 h-3" />
                        Asientos ocupados
                      </span>
                      <span
                        className={
                          porcentajeOcupacion > 80
                            ? "text-orange-600"
                            : "text-green-600"
                        }
                      >
                        {asientosOcupados}/{capacidadMaxima}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          porcentajeOcupacion > 80
                            ? "bg-red-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${porcentajeOcupacion}%` }}
                      />
                    </div>
                  </div>

                  {yaRegistrado ? (
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-semibold text-green-700">
                        Ya estás registrado
                      </span>
                    </div>
                  ) : (
                    <>
                      {!dialogsAbiertos[reserva.id] ? (
                        <Button
                          onClick={() => {
                            const s = conteosServidor[reserva.id];
                            // Only treat server counts as authoritative when capacidad is a positive number
                            if (
                              s &&
                              typeof s.capacidad === "number" &&
                              s.capacidad > 0 &&
                              s.ocupados >= s.capacidad
                            ) {
                              toast({
                                title: "Evento completo",
                                description:
                                  "Lo sentimos, ya no quedan asientos disponibles.",
                                variant: "destructive",
                              });
                              return;
                            }
                            setDialogAbierto(reserva.id, true);
                          }}
                          className="w-full bg-primary text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Registrarme
                        </Button>
                      ) : (
                        <div className="mt-4 p-6 rounded-2xl shadow-xl bg-white/90 border border-gray-200">
                          <h3 className="text-xl font-bold mb-2 text-purple-700">
                            Registro al Evento
                          </h3>
                          <p className="mb-4 text-gray-600 text-sm">
                            Completa tus datos para registrarte a "
                            {reserva.titulo}"
                          </p>
                          <form
                            onSubmit={manejarRegistro(reserva.id)}
                            className="space-y-4"
                          >
                            <div>
                              <Label
                                htmlFor={`nombre-${reserva.id}`}
                                className="text-base font-semibold flex items-center gap-2"
                              >
                                <User className="w-4 h-4" />
                                Nombre Completo
                              </Label>
                              <Input
                                id={`nombre-${reserva.id}`}
                                value={datosFormulario.nombre}
                                onChange={(e) =>
                                  setDatosFormulario({
                                    ...datosFormulario,
                                    nombre: e.target.value,
                                  })
                                }
                                placeholder="Tu nombre"
                                className="mt-2 rounded-lg bg-gray-100"
                                readOnly
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Datos de tu perfil (no editables)
                              </p>
                            </div>
                            <div>
                              <Label
                                htmlFor={`email-${reserva.id}`}
                                className="text-base font-semibold flex items-center gap-2"
                              >
                                <Mail className="w-4 h-4" />
                                Correo Electrónico
                              </Label>
                              <Input
                                id={`email-${reserva.id}`}
                                type="email"
                                value={datosFormulario.email}
                                onChange={(e) =>
                                  setDatosFormulario({
                                    ...datosFormulario,
                                    email: e.target.value,
                                  })
                                }
                                placeholder="tu@email.com"
                                className="mt-2 rounded-lg bg-gray-100"
                                readOnly
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Datos de tu perfil (no editables)
                              </p>
                            </div>
                            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                              <p>
                                Se te asignará automáticamente el siguiente
                                asiento disponible en orden de llegada.
                              </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <Button
                                type="submit"
                                disabled={Boolean(
                                  (() => {
                                    const s = conteosServidor[reserva.id];
                                    return (
                                      s &&
                                      typeof s.capacidad === "number" &&
                                      s.capacidad > 0 &&
                                      s.ocupados >= s.capacidad
                                    );
                                  })() || isSubmittingByEvent[reserva.id]
                                )}
                                className="w-full bg-primary text-white font-semibold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all"
                              >
                                {isSubmittingByEvent[reserva.id]
                                  ? "Registrando..."
                                  : "Confirmar Registro"}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                disabled={isSubmittingByEvent[reserva.id]}
                                onClick={() =>
                                  setDialogAbierto(reserva.id, false)
                                }
                              >
                                Cancelar
                              </Button>
                            </div>
                          </form>
                        </div>
                      )}
                    </>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      {detalleAsientoAbierto && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                {(() => {
                  const asistente = misRegistros.find(
                    (a) => a.id === detalleAsientoAbierto
                  );
                  const reserva = asistente
                    ? eventosActuales.find((r) => r.id === asistente.reservaId)
                    : null;
                  if (!reserva) return null;

                  return (
                    <Card className="w-full max-w-2xl bg-card border-2 border-primary/60 rounded-xl shadow-2xl shadow-primary/30 max-h-[90vh] overflow-y-auto">
                      <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-primary/20 pb-4">
                          <h2 className="text-2xl font-bold text-foreground">
                            Detalles del Evento
                          </h2>
                          <button
                            onClick={() => setDetalleAsientoAbierto(null)}
                            className="p-2 hover:bg-primary/10 rounded-lg transition text-foreground"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div className="flex gap-4 items-start">
                            <div className="flex-1 space-y-3">
                              <div>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">
                                  Evento
                                </p>
                                <p className="text-xl font-bold text-foreground">
                                  {reserva.titulo}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">
                                  Organizador
                                </p>
                                <p className="text-base text-foreground">
                                  {reserva.organizador || "No especificado"}
                                </p>
                              </div>
                            </div>
                            <div className="flex-shrink-0 text-center">
                              <div className="bg-primary/10 border-2 border-primary/40 rounded-xl p-4 shadow-lg">
                                <Armchair className="w-6 h-6 mx-auto text-primary mb-2" />
                                <p className="text-xs text-muted-foreground font-medium mb-1">
                                  Asiento
                                </p>
                                <p className="text-3xl font-bold text-foreground">
                                  {asistente.numeroAsiento}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-[#0f1d34] p-3 rounded-lg border-2 border-primary/30">
                              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide mb-1">
                                Fecha
                              </p>
                              <p className="text-base font-semibold text-foreground">
                                {formatearFecha(reserva.fecha)}
                              </p>
                            </div>
                            <div className="bg-[#0f1d34] p-3 rounded-lg border-2 border-secondary/30">
                              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide mb-1">
                                Hora
                              </p>
                              <p className="text-base font-semibold text-foreground">
                                {reserva.horaInicio} - {reserva.horaFin}
                              </p>
                            </div>
                            <div className="bg-[#0f1d34] p-3 rounded-lg border-2 border-primary/30">
                              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide mb-1">
                                Auditorio
                              </p>
                              <p className="text-base font-semibold text-foreground">
                                Auditorio {reserva.auditorio}
                              </p>
                            </div>
                            <div className="bg-[#0f1d34] p-3 rounded-lg border-2 border-accent/40">
                              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide mb-1">
                                Estado
                              </p>
                              <p className="text-base font-semibold text-accent">
                                ✓ Confirmado
                              </p>
                            </div>
                          </div>

                          {reserva.descripcion && (
                            <div className="bg-[#0f1d34] p-4 rounded-lg border-2 border-primary/30">
                              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide mb-2">
                                Descripción
                              </p>
                              <p className="text-foreground">
                                {reserva.descripcion}
                              </p>
                            </div>
                          )}

                          <div className="bg-secondary/10 border-2 border-secondary/30 rounded-lg p-4 flex gap-3">
                            <AlertCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-foreground">
                              Por favor, llega 10 minutos antes de la hora de
                              inicio. Ten en cuenta tu número de asiento para
                              facilitar tu entrada al evento.
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-primary/20">
                          <Button
                            onClick={() => setDetalleAsientoAbierto(null)}
                            className="flex-1 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all"
                          >
                            Cerrar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })()}
              </div>
            )}
          </div>
  );
}

