"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  User,
  Eye,
  X,
  Building2,
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
  abrirFiltrosSolicitud?: number;
};

export function VistaAsistente({
  reservas,
  asistentesRegistrados,
  onRegisterAttendee,
  abrirFiltrosSolicitud = 0,
}: PropiedadesVistaAsistente) {
  const { toast } = useToast();
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
          obtenerCapacidadMaxima(reserva);

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
    return obtenerCapacidadMaxima(reserva);
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
                obtenerCapacidadMaxima(reserva);
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

  const obtenerEstadoEvento = (reserva: { fecha: string; horaInicio: string; horaFin: string }) => {
    const ahora = new Date();
    const inicio = new Date(`${reserva.fecha}T${reserva.horaInicio}:00`);
    const fin = new Date(`${reserva.fecha}T${reserva.horaFin}:00`);

    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
      return "Próximo";
    }

    if (ahora < inicio) return "Próximo";
    if (ahora >= inicio && ahora <= fin) return "En curso";
    return "Finalizado";
  };

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case "En curso":
        return "bg-emerald-500/15 text-emerald-200 border-emerald-500/30";
      case "Finalizado":
        return "bg-slate-700/60 text-slate-200 border-slate-700";
      default:
        return "bg-blue-500/15 text-blue-200 border-blue-500/30";
    }
  };

  const manejarRegistro = async (reservaId: string) => {
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
    <div className="flex flex-col gap-5">
      {misRegistros.length > 0 && (
        <Card id="asistente-mis-registros" className="order-2 mx-auto w-full max-w-6xl scroll-mt-6 rounded-2xl border border-slate-800 bg-slate-950/95 p-3 shadow-[0_25px_50px_-30px_rgba(15,23,42,0.85)] md:p-4">
          <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white md:text-2xl">Mis Registros</h2>
              <p className="mt-1 text-xs text-slate-200 max-w-xl">
                Eventos a los que estás registrado. Aquí verás tus asientos asignados y los detalles clave.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.location.reload()}
                className="text-xs"
              >
                Actualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFiltrosActivos(null)}
                className="text-xs"
              >
                Ver todos
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {misRegistros.map((asistente) => {
              const reserva = eventosActuales.find(
                (r) => r.id === asistente.reservaId
              );
              if (!reserva) return null;

              const estado = obtenerEstadoEvento(reserva);
              const estadoClasses = obtenerColorEstado(estado);
              const auditorioClasses = reserva.auditorio === "A"
                ? "bg-slate-900 border-red-500/30 text-red-300"
                : "bg-slate-900 border-purple-500/30 text-purple-300";

              return (
                <div
                  key={asistente.id}
                  className="flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.85)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-700"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="rounded-full bg-none bg-slate-800 border border-slate-700 text-slate-200 px-2 py-1 text-[10px] font-semibold tracking-wide">
                        Asiento {asistente.numeroAsiento}
                      </Badge>
                      <Badge className={`rounded-full bg-none ${auditorioClasses} border px-2 py-1 text-[10px] font-semibold tracking-wide`}>
                        Aud. {reserva.auditorio}
                      </Badge>
                      <Badge className={`rounded-full bg-none ${estadoClasses} border px-2 py-1 text-[10px] font-semibold tracking-wide`}>
                        {estado}
                      </Badge>
                    </div>
                  </div>
                  <h3 className="mb-3 line-clamp-2 text-lg font-bold capitalize leading-tight text-white">
                    {reserva.titulo}
                  </h3>
                  <div className="grid grid-cols-1 gap-3 text-sm text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-sm font-medium text-slate-300">{formatearFecha(reserva.fecha)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-sm font-medium text-slate-300">{reserva.horaInicio} - {reserva.horaFin}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <User className="h-4 w-4 text-rose-400" />
                      <span className="truncate text-xs text-slate-400 font-medium">Organizador: {reserva.organizador || "No asignado"}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDetalleAsientoAbierto(asistente.id)}
                    className="mt-4 w-full justify-center rounded-xl border border-slate-700 text-rose-400 hover:border-rose-400/50 hover:bg-rose-400/10 hover:text-rose-300"
                  >
                    Ver detalles
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div id="asistente-eventos" className="order-1 mx-auto w-full max-w-6xl">
      <BuscadorEventos
        alBuscar={(filtros) => setFiltrosActivos(filtros)}
        alLimpiar={() => setFiltrosActivos(null)}
        abrirFiltrosSolicitud={abrirFiltrosSolicitud}
      />
      </div>

      <Card id="asistente-eventos-disponibles" className="order-1 mx-auto w-full max-w-6xl scroll-mt-6 rounded-2xl border border-slate-800 bg-slate-950/95 p-3 shadow-[0_20px_45px_-25px_rgba(15,23,42,0.7)] md:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
              <div className="rounded-xl bg-slate-900 p-2">
              <UserPlus className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Eventos Disponibles</h2>
              <p className="text-xs text-slate-200">
                Regístrate para asistir y reserva tu lugar antes de que se agoten los asientos.
              </p>
            </div>
          </div>
        </div>

        {eventosFiltrados.length === 0 ? (
          <div className="text-center py-6">
            <CalendarIcon className="w-14 h-14 mx-auto mb-2 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-100 mb-1">
              No hay eventos disponibles
            </h3>
            <p className="text-sm text-slate-300 mb-3">
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {eventosFiltrados.map((reserva) => {
              const asientosOcupados = obtenerAsientosOcupados(reserva.id);
              const capacidadMaxima = obtenerCapacidadMaxima(reserva);
              const porcentajeOcupacion =
                (asientosOcupados / Math.max(1, capacidadMaxima)) * 100;
              const yaRegistrado = registrosActuales.some(
                (a) =>
                  a.reservaId === reserva.id &&
                  a.email === datosFormulario.email &&
                  datosFormulario.email !== ""
              );

              return (
                <Card
                  key={reserva.id}
                  className="p-5 rounded-2xl border border-slate-700 shadow-sm hover:shadow-lg transition-all bg-slate-950 flex flex-col h-full"
                >
                  <div className="flex flex-col gap-2 mb-3">
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-lg font-bold capitalize leading-tight text-white">
                        {reserva.titulo}
                      </h3>
                      <p className="mt-1 text-xs text-slate-400 font-medium line-clamp-1">
                        Organizador: {reserva.organizador || "No asignado"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          reserva.auditorio === "A"
                            ? "bg-orange-600 border-orange-600 text-white"
                            : "bg-purple-600 border-purple-600 text-white"
                        }`}>
                        Aud. {reserva.auditorio}
                      </Badge>
                      {estaLleno(reserva) && (
                        <Badge className="bg-red-500/80 text-white font-semibold px-2.5 py-0.5 text-xs rounded-full">
                          Lleno
                        </Badge>
                      )}
                    </div>
                  </div>

<div className="space-y-1.5 mb-3 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <CalendarIcon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="text-sm font-medium text-slate-300 line-clamp-1">
                          {formatearFecha(reserva.fecha)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="text-sm font-medium text-slate-300">
                          {reserva.horaInicio} - {reserva.horaFin}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="text-sm font-medium text-slate-300">
                        Auditorio {reserva.auditorio}
                      </span>
                    </div>
                  </div>

                  {reserva.descripcion && (
                    <p className="text-xs text-slate-300 mb-3 line-clamp-2">
                      {reserva.descripcion}
                    </p>
                  )}

                  <div className="mb-3">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-xs mb-2 font-medium text-slate-300">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Armchair className="w-3 h-3 text-rose-400" />
                        <span className="text-slate-400">Asientos ocupados</span>
                      </span>
                      <span
                        className={
                          porcentajeOcupacion > 80
                            ? "font-semibold text-slate-200"
                            : "font-semibold text-slate-200"
                        }
                      >
                        {asientosOcupados}/{capacidadMaxima}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          porcentajeOcupacion > 80
                            ? "bg-[#f97316]"
                            : "bg-rose-500"
                        }`}
                        style={{ width: `${porcentajeOcupacion}%` }}
                      />
                    </div>
                  </div>

                  {yaRegistrado ? (
                    <div className="flex items-center gap-2 p-3 bg-slate-900 rounded-xl border border-slate-700 mt-auto">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-200">
                        Ya estás registrado
                      </span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        const s = conteosServidor[reserva.id];
                        if (!datosFormulario.email) {
                          toast({
                            title: "Sesión no lista",
                            description: "Espera a que carguen tus datos de usuario.",
                            variant: "destructive",
                          });
                          return;
                        }
                        if (s && s.capacidad > 0 && s.ocupados >= s.capacidad) {
                          toast({
                            title: "Evento completo",
                            description: "Lo sentimos, ya no quedan asientos disponibles.",
                            variant: "destructive",
                          });
                          return;
                        }
                        void manejarRegistro(reserva.id);
                      }}
                      disabled={Boolean(isSubmittingByEvent[reserva.id])}
                      className={`w-full text-white font-semibold rounded-lg shadow-sm transition-all text-sm py-2 mt-auto disabled:opacity-50 ${
                        reserva.auditorio === "A"
                          ? "bg-gradient-to-r from-[#e11d48] via-[#f43f5e] to-[#fb7185] hover:from-[#be123c] hover:via-[#e11d48] hover:to-[#f43f5e]"
                            : "bg-gradient-to-r from-[#e11d48] via-[#f43f5e] to-[#fb7185] hover:from-[#be123c] hover:via-[#e11d48] hover:to-[#f43f5e]"
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-2" />
                      {isSubmittingByEvent[reserva.id] ? "Registrando..." : "Registrarme"}
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      {detalleAsientoAbierto && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3">
                {(() => {
                  const asistente = misRegistros.find(
                    (a) => a.id === detalleAsientoAbierto
                  );
                  const reserva = asistente
                    ? eventosActuales.find((r) => r.id === asistente.reservaId)
                    : null;
                  if (!asistente || !reserva) return null;

                  return (
                    <Card className="w-full max-w-lg bg-card border-2 border-primary/60 rounded-xl shadow-2xl shadow-primary/30 max-h-[90vh] overflow-y-auto">
                      <div className="p-5 space-y-5">
                        <div className="flex items-center justify-between border-b border-primary/20 pb-3">
                          <h2 className="text-xl font-bold text-foreground">
                            Detalles del Evento
                          </h2>
                          <button
                            onClick={() => setDetalleAsientoAbierto(null)}
                            className="p-1.5 hover:bg-primary/10 rounded-lg transition text-foreground"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div className="flex gap-3 items-start">
                            <div className="flex-1 space-y-3">
                              <div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                  Evento
                                </p>
                                <p className="text-lg font-bold text-slate-100">
                                  {reserva.titulo}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                  Organizador
                                </p>
                                <p className="text-base text-slate-100">
                                  {reserva.organizador || "No especificado"}
                                </p>
                              </div>
                            </div>
                            <div className="shrink-0 text-center">
                              <div className="bg-primary/10 border-2 border-primary/40 rounded-lg p-3 shadow-lg">
                                <Armchair className="w-5 h-5 mx-auto text-primary mb-1" />
                                <p className="text-xs text-slate-400 font-medium mb-0.5">
                                  Asiento
                                </p>
                                <p className="text-2xl font-bold text-slate-100">
                                  {asistente.numeroAsiento}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2.5">
                            <div className="bg-slate-800 p-3.5 rounded-xl border border-slate-700">
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
                                Fecha
                              </p>
                              <p className="text-sm font-semibold text-slate-100 line-clamp-2">
                                {formatearFecha(reserva.fecha)}
                              </p>
                            </div>
                            <div className="bg-slate-800 p-3.5 rounded-xl border border-slate-700">
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
                                Hora
                              </p>
                              <p className="text-sm font-semibold text-slate-100">
                                {reserva.horaInicio} - {reserva.horaFin}
                              </p>
                            </div>
                            <div className="bg-slate-800 p-3.5 rounded-xl border border-slate-700">
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
                                Auditorio
                              </p>
                              <p className="text-sm font-semibold text-slate-100">
                                Aud. {reserva.auditorio}
                              </p>
                            </div>
                            <div className="bg-slate-800 p-3.5 rounded-xl border border-slate-700">
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
                                Estado
                              </p>
                              <p className="text-sm font-semibold text-emerald-300">
                                ✓ Confirmado
                              </p>
                            </div>
                          </div>

                          {reserva.descripcion && (
                            <div className="bg-slate-800/50 p-3.5 rounded-lg border border-slate-700">
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">
                                Descripción
                              </p>
                              <p className="text-sm text-slate-100 leading-relaxed">
                                {reserva.descripcion}
                              </p>
                            </div>
                          )}

                          <div className="bg-blue-950/30 border border-blue-900/50 rounded-lg p-3.5 flex gap-2.5">
                            <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-100 leading-relaxed">
                              Por favor, llega 10 minutos antes de la hora de inicio. Ten en cuenta tu número de asiento para facilitar tu entrada al evento.
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-primary/20">
                          <Button
                            onClick={() => setDetalleAsientoAbierto(null)}
                            className="flex-1 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all text-sm py-2"
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

