"use client";

import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { initSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { FormularioReserva } from "@/components/formulario-reserva";
import { Calendario } from "@/components/vista-calendario";
import { ListaReservas } from "@/components/lista-reservas";
import { EstadoAuditorio } from "@/components/estado-auditorio";
import { VistaAsistente } from "@/components/vista-asistente";
import { MenuSeleccionUsuario } from "@/components/menu-seleccion-usuario";
import { LoginUsuario } from "@/components/login-usuario";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  CalendarIcon,
  List,
  LayoutDashboard,
  Users,
  CalendarDays,
  LogOut,
} from "lucide-react";

export type Reserva = {
  id: string;
  auditorio: "A" | "B";
  fecha: string;
  horaInicio: string;
  horaFin: string;
  titulo: string;
  organizador: string;
  organizadorId?: string;
  descripcion: string;
  asistentes: number;
  asistentes_registrados?: number;
  capacidad_total?: number;
  archivado?: boolean;
  carrera?: string;
  presentacion?: string;
};

export type AsistenteRegistrado = {
  id: string;
  reservaId: string;
  nombre: string;
  email: string;
  numeroAsiento: number;
  fechaRegistro: string;
};

export default function Page() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [asistentesRegistrados, setAsistentesRegistrados] = useState<
    AsistenteRegistrado[]
  >([]);
  const [asientosConteo, setAsientosConteo] = useState<
    Record<string, { ocupados: number; capacidad: number; auditorio?: string }>
  >({});
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [modoUsuario, setModoUsuario] = useState<
    "organizador" | "asistente" | null
  >(null);
  const [userIds, setUserIds] = useState<{
    organizador: string | null;
    asistente: string | null;
  }>({ organizador: null, asistente: null });
  const [organizadorVista, setOrganizadorVista] = useState<string>("calendario");
  const [openReservaMobile, setOpenReservaMobile] = useState(false);
  const [organizadorFiltrosSolicitud, setOrganizadorFiltrosSolicitud] = useState(0);
  const [asistenteFiltrosSolicitud, setAsistenteFiltrosSolicitud] = useState(0);
  const [asistenteSeccion, setAsistenteSeccion] = useState("eventos");

  const currentUserId =
    modoUsuario === "organizador"
      ? userIds.organizador
      : modoUsuario === "asistente"
      ? userIds.asistente
      : null;

  const agregarReserva = (
    nuevaReserva: Omit<Reserva, "id"> & Partial<Pick<Reserva, "id">>
  ) => {
    const reservaConId: Reserva = {
      ...nuevaReserva,
      id: nuevaReserva.id || crypto.randomUUID(),
      organizadorId: currentUserId || undefined,
    };
    setReservas((prev) => {
      const existingIndex = prev.findIndex((reserva) => reserva.id === reservaConId.id);
      if (existingIndex === -1) return [...prev, reservaConId];
      return prev.map((reserva, index) =>
        index === existingIndex ? { ...reserva, ...reservaConId } : reserva
      );
    });
  };

  const clearSession = () => {
    setModoUsuario(null);
    setUserIds({ organizador: null, asistente: null });
  };

  const handleBottomNavAction = useCallback(
    (action: string) => {
      if (modoUsuario === "organizador") {
        if (action !== "crear") {
          setOpenReservaMobile(false);
        }
        if (action === "calendario" || action === "lista") {
          setOrganizadorVista(action as "calendario" | "lista");
        }
        if (action === "filtros") {
          setOrganizadorVista("lista");
          setOrganizadorFiltrosSolicitud((previous) => previous + 1);
          window.requestAnimationFrame(() => {
            document.getElementById("organizador-filtros")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          });
        }
        if (action === "crear") {
          setOpenReservaMobile(true);
          window.requestAnimationFrame(() => {
            document.getElementById("crear-reserva-mobile")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          });
        }
      } else {
        if (typeof window === "undefined") return;

        if (action === "eventos") {
          setAsistenteSeccion("eventos");
          document.getElementById("asistente-eventos-disponibles")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        if (action === "mis-registros") {
          setAsistenteSeccion("mis-registros");
          document.getElementById("asistente-mis-registros")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        if (action === "filtros") {
          setAsistenteSeccion("filtros");
          setAsistenteFiltrosSolicitud((previous) => previous + 1);
          document.getElementById("asistente-eventos")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    },
    [modoUsuario],
  );

  useEffect(() => {
    if (modoUsuario !== "asistente" || typeof IntersectionObserver === "undefined") return;

    const sections = [
      { id: "asistente-eventos-disponibles", section: "eventos" },
      { id: "asistente-mis-registros", section: "mis-registros" },
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const section = sections.find((item) => item.id === visible.target.id)?.section;
          if (section) setAsistenteSeccion(section);
        }
      },
      { rootMargin: "-12% 0px -55% 0px", threshold: [0.1, 0.5, 0.9] },
    );

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [modoUsuario, asistentesRegistrados.length]);

  // Cargar eventos iniciales desde la API al montar
  useEffect(() => {
    let mounted = true;
    async function fetchEventos() {
      try {
        const res = await fetch("/api/eventos");
        const json = await res.json();
        if (mounted && json && json.success && Array.isArray(json.eventos)) {
          const mapped = json.eventos.map((e: any) => ({
            id: e.id,
            auditorio: String(e.id_auditorio),
            fecha: (e.fecha instanceof Date
              ? e.fecha.toISOString().substring(0, 10)
              : String(e.fecha)
            ).substring(0, 10),
            horaInicio: (e.hora_inicio || "").toString().substring(0, 5),
            horaFin: (e.hora_fin || "").toString().substring(0, 5),
            titulo: e.titulo,
            organizador: e.organizador_nombre || e.organizador_email || null,
            organizadorId: e.id_organizador || undefined,
            descripcion: e.descripcion || "",
            asistentes: e.asistentes_esperados || 0,
            archivado: (() => {
              try {
                const fechaStr = (
                  e.fecha instanceof Date
                    ? e.fecha.toISOString().substring(0, 10)
                    : String(e.fecha)
                ).substring(0, 10);
                const horaFin =
                  (e.hora_fin || "").toString().substring(0, 5) || "23:59";
                const end = new Date(`${fechaStr}T${horaFin}:00`);
                return new Date() > end;
              } catch (err) {
                return false;
              }
            })(),
            carrera: e.carrera || null,
            presentacion: null,
          }));
          setReservas(mapped);
          // También recuperar registros existentes para que las nuevas sesiones muestren datos históricos.
          try {
            const rres = await fetch(`/api/registros-asistentes/all`);
            const rjson = await rres.json();
            if (
              mounted &&
              rjson &&
              rjson.success &&
              Array.isArray(rjson.registros)
            ) {
              const regs = rjson.registros.map((row: any) => ({
                id: row.id,
                reservaId: row.id_evento,
                nombre: row.nombre || row.asistente_nombre || "",
                email: row.email || row.asistente_email || "",
                numeroAsiento: row.numero_orden || 0,
                fechaRegistro:
                  row.fecha_registro ||
                  row.fechaRegistro ||
                  new Date().toISOString(),
              }));
              setAsistentesRegistrados(regs);
            }
          } catch (err) {
            console.error("Error fetching initial registros:", err);
          }
        }
      } catch (err) {
        console.error("Error fetching eventos iniciales:", err);
      }
    }

    fetchEventos();
    return () => {
      mounted = false;
    };
  }, []);

  // Escuchar registros entrantes por socket para actualizar conteo en tiempo real
  useEffect(() => {
    const socket = initSocket();

    const handleRegistro = (row: any) => {
      try {
        // Normalizar posibles variantes de nombres desde el backend
        const id = row.id || row.registro_id || row.id_asistente || null;
        const reservaId =
          row.id_evento ||
          row.eventoId ||
          row.reservaId ||
          row.reserva_id ||
          null;
        const nombre = row.nombre || row.name || row.nombre_asistente || "";
        const email = row.email || row.correo || row.email_asistente || "";
        const numeroAsiento =
          (typeof row.numeroAsiento === "number" && row.numeroAsiento) ||
          (typeof row.numero_orden === "number" && row.numero_orden) ||
          (typeof row.numero === "number" && row.numero) ||
          0;
        const fechaRegistro =
          row.fechaRegistro || row.fecha_registro || new Date().toISOString();

        const nuevo: AsistenteRegistrado = {
          id: id || String(Math.random().toString(36).substring(2, 9)),
          reservaId: reservaId || String(row.eventoId || row.reservaId || ""),
          nombre,
          email,
          numeroAsiento,
          fechaRegistro,
        };

        setAsistentesRegistrados((prev) => {
          if (prev.some((p) => p.id === nuevo.id)) return prev;
          return [...prev, nuevo];
        });
      } catch (err) {
        console.error("Error al procesar registro en socket:", err);
      }
    };

    socket.on("asistente:registrado", handleRegistro);

    // Manejar eventos de creación de eventos (reservas) en tiempo real
    const handleEventoCreado = (e: any) => {
      try {
        const mapped: Reserva = {
          id: e.id || e.id || e.id_evento || e.eventoId || e.reservaId,
          auditorio: String(e.id_auditorio || e.auditorio || "A") as "A" | "B",
          fecha: (e.fecha instanceof Date
            ? e.fecha.toISOString().substring(0, 10)
            : String(e.fecha || "")
          ).substring(0, 10),
          horaInicio: (e.hora_inicio || e.horaInicio || "")
            .toString()
            .substring(0, 5),
          horaFin: (e.hora_fin || e.horaFin || "").toString().substring(0, 5),
          titulo: e.titulo || e.title || "",
          organizador:
            e.organizador_nombre ||
            e.organizador ||
            e.organizador_email ||
            null,
          organizadorId: e.id_organizador || e.organizadorId || undefined,
          descripcion: e.descripcion || e.description || "",
          asistentes: e.asistentes_esperados || e.asistentes || 0,
          archivado: (() => {
            try {
              const fechaStr = (
                e.fecha instanceof Date
                  ? e.fecha.toISOString().substring(0, 10)
                  : String(e.fecha || "")
              ).substring(0, 10);
              const horaFin =
                (e.hora_fin || e.horaFin || "").toString().substring(0, 5) ||
                "23:59";
              const end = new Date(`${fechaStr}T${horaFin}:00`);
              return new Date() > end;
            } catch (err) {
              return false;
            }
          })(),
          carrera: e.carrera || null,
          presentacion: undefined,
        };

        setReservas((prev) => {
          if (prev.some((r) => r.id === mapped.id)) return prev;
          return [...prev, mapped];
        });
      } catch (err) {
        console.error("Error al procesar evento creado socket:", err);
      }
    };

    // Manejar evento eliminado: remover de la lista local
    const handleEventoEliminado = (payload: any) => {
      try {
        const id = payload && (payload.id || payload.eventoId || payload.reservaId);
        if (!id) return;
        setReservas((prev) => prev.filter((r) => r.id !== id));
        setAsistentesRegistrados((prev) => prev.filter((a) => a.reservaId !== id));
      } catch (err) {
        console.error("Error procesando evento:eliminado socket:", err);
      }
    };

    socket.on("evento:creado", handleEventoCreado);
    socket.on("evento:eliminado", handleEventoEliminado);

    // Escuchar conteos agregados emitidos por el servidor
    const handleConteo = (payload: any) => {
      try {
        const eventoId =
          payload.reservaId || payload.eventoId || payload.id_evento;
        if (!eventoId) return;
        const ocupados = Number(payload.ocupados || 0);
        const capacidad = Number(
          payload.capacidad || payload.capacidad_total || 0
        );
        const auditorio =
          payload.auditorio || payload.id_auditorio || undefined;
        setAsientosConteo((prev) => ({
          ...prev,
          [eventoId]: { ocupados, capacidad, auditorio },
        }));
      } catch (err) {
        console.error("Error procesando asientos:conteo socket:", err);
      }
    };

    socket.on("asientos:conteo", handleConteo);

    // Solicitar al servidor el estado inicial de registros para poblar la UI
    let poller: any = null;
    const handleConnect = () => {
      // cuando el realtime se conecta, detener el poller si existe
      try {
        if (poller) {
          clearInterval(poller);
          poller = null;
        }
      } catch (e) {
        // ignore
      }
    };

    try {
      // registrar listener para que, si el socket se conecta después, pare el poller
      socket.on("connect", handleConnect);

      if (!socket.connected) {
        // comprobar visibilidad de la página: no pollear si la pestaña está oculta
        const shouldStart =
          typeof document !== "undefined" ? !document.hidden : true;
        if (shouldStart) {
          poller = setInterval(async () => {
            try {
              // si la pestaña está oculta, saltar esta iteración
              if (typeof document !== "undefined" && document.hidden) return;

              const [eresp, rresp] = await Promise.all([
                fetch("/api/eventos"),
                fetch("/api/registros-asistentes/all"),
              ]);
              if (eresp.ok) {
                const ej = await eresp.json();
                if (ej && Array.isArray(ej.eventos)) {
                  const mapped = ej.eventos.map((e: any) => ({
                    id: e.id,
                    auditorio: String(e.id_auditorio),
                    fecha: (e.fecha instanceof Date
                      ? e.fecha.toISOString().substring(0, 10)
                      : String(e.fecha)
                    ).substring(0, 10),
                    horaInicio: (e.hora_inicio || "")
                      .toString()
                      .substring(0, 5),
                    horaFin: (e.hora_fin || "").toString().substring(0, 5),
                    titulo: e.titulo,
                    organizador:
                      e.organizador_nombre || e.organizador_email || null,
                    organizadorId: e.id_organizador || undefined,
                    descripcion: e.descripcion || "",
                    asistentes: e.asistentes_esperados || 0,
                    archivado: (() => {
                      try {
                        const fechaStr = (
                          e.fecha instanceof Date
                            ? e.fecha.toISOString().substring(0, 10)
                            : String(e.fecha)
                        ).substring(0, 10);
                        const horaFin =
                          (e.hora_fin || "").toString().substring(0, 5) ||
                          "23:59";
                        const end = new Date(`${fechaStr}T${horaFin}:00`);
                        return new Date() > end;
                      } catch (err) {
                        return false;
                      }
                    })(),
                    carrera: e.carrera || null,
                    presentacion: null,
                  }));
                  // Combinar sin duplicar
                  setReservas((prev) => {
                    const ids = new Set(prev.map((p) => p.id));
                    const merged = [...prev];
                    mapped.forEach((m: any) => {
                      if (!ids.has(m.id)) merged.push(m);
                    });
                    return merged;
                  });
                }
              }

              if (rresp.ok) {
                const rj = await rresp.json();
                if (rj && Array.isArray(rj.registros)) {
                  const regs = rj.registros.map((row: any) => ({
                    id: row.id,
                    reservaId: row.id_evento,
                    nombre: row.nombre || row.asistente_nombre || "",
                    email: row.email || row.asistente_email || "",
                    numeroAsiento: row.numero_orden || 0,
                    fechaRegistro:
                      row.fecha_registro ||
                      row.fechaRegistro ||
                      new Date().toISOString(),
                  }));
                  setAsistentesRegistrados((prev) => {
                    const ids = new Set(prev.map((p) => p.id));
                    const merged = [...prev];
                    regs.forEach((r: any) => {
                      if (!ids.has(r.id)) merged.push(r);
                    });
                    return merged;
                  });
                }
              }
            } catch (e) {
              // ignorar errores de sondeo
            }
          }, 5000);
        }
      }
    } catch (e) {
      // ignorar
    }

    return () => {
      socket.off("asistente:registrado", handleRegistro);
      socket.off("evento:creado", handleEventoCreado);
      socket.off("evento:eliminado", handleEventoEliminado);
      socket.off("asientos:conteo", handleConteo);
      if (poller) clearInterval(poller);
    };
  }, []);

  const eliminarReserva = async (id: string, organizerId?: string) => {
    try {
      // Preferir el ID del usuario actual; si no existe (modo dev) usar el organizerId
      // TEMP LOG: verificar que el handler del cliente se ejecute al hacer click
      console.info("Client handler eliminarReserva called", {
        id,
        organizerId,
        currentUserId,
      });
      const callerId = currentUserId || organizerId || null;
      if (!callerId) {
        console.warn("No hay usuario disponible para eliminar reserva");
        return false;
      }
      console.info("Deleting evento", { id, callerId });
      const devHeader: Record<string, string> = process.env.NODE_ENV !== "production" ? { "x-usuario-id": String(callerId || "") } : {};
      const res = await fetch(`/api/eventos/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...devHeader,
        },
        body: JSON.stringify({ usuario_id: callerId }),
      });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok || !json.success) {
        console.error("Error eliminando reserva:", json.error || json);
        return false;
      }

      // Actualizar estado localmente solo si el servidor confirmó la eliminación
      setReservas((prev) => prev.filter((reserva) => reserva.id !== id));
      setAsistentesRegistrados((prev) =>
        prev.filter((asistente) => asistente.reservaId !== id)
      );
      return true;
    } catch (err) {
      console.error("Error eliminando reserva:", err);
      return false;
    }
  };

  const eliminarAsistente = async (reservaId: string, asistenteId: string) => {
    try {
      // Determinar el identificador de llamada: dar preferencia al identificador del organizador de la reserva (valor del lado del servidor).
      // TEMP LOG: verificar que el handler del cliente se ejecute al hacer click
      console.info("Client handler eliminarAsistente called", {
        reservaId,
        asistenteId,
        currentUserId,
      });
      const reserva = reservas.find((r) => r.id === reservaId);
      const callerId = reserva?.organizadorId || currentUserId || null;

      console.info("Deleting asistente", {
        reservaId,
        asistenteId,
        callerId,
      });
      const devHeader: Record<string, string> = process.env.NODE_ENV !== "production" ? { "x-usuario-id": String(callerId || "") } : {};
      const res = await fetch(`/api/registros-asistentes/${reservaId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...devHeader,
        },
        body: JSON.stringify({
          registroId: asistenteId,
          usuario_id: callerId,
        }),
      });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok || !json.success) {
        console.error(
          "Error eliminando asistente en servidor:",
          json.error || json
        );
        return false;
      }

      // También recuperar registros para esta reserva desde el servidor para mantener la UI consistente
      try {
        const rres = await fetch(`/api/registros-asistentes/${reservaId}`);
        const rjson = await rres.json();
        if (rres.ok && rjson && Array.isArray(rjson.registros)) {
          const regs = rjson.registros.map((row: any) => ({
            id: row.id,
            reservaId: row.id_evento,
            nombre: row.nombre || row.asistente_nombre || "",
            email: row.email || row.asistente_email || "",
            numeroAsiento: row.numero_orden || 0,
            fechaRegistro:
              row.fecha_registro ||
              row.fechaRegistro ||
              new Date().toISOString(),
          }));
          setAsistentesRegistrados((prev) => {
            // mantener intactos los registros de otras reservas, sustituir los de esta reserva
            const others = prev.filter((p) => p.reservaId !== reservaId);
            return [...others, ...regs];
          });
        } else {
          // fallback: eliminar localmente
          setAsistentesRegistrados((prev) =>
            prev.filter((a) => a.id !== asistenteId)
          );
        }
      } catch (e) {
        setAsistentesRegistrados((prev) =>
          prev.filter((a) => a.id !== asistenteId)
        );
      }
      return true;
    } catch (err) {
      console.error("Error eliminando asistente:", err);
      return false;
    }
  };

  const registrarAsistente = useCallback(
    (reservaId: string, nombre: string, email: string) => {
      return (async () => {
        const reserva = reservas.find((r) => r.id === reservaId);
        if (!reserva) return { exito: false, mensaje: "Evento no encontrado" };

        try {
          // usar el ID de asistente generado por la selección de usuario (userIds.asistente)
          const asistenteId =
            userIds.asistente || Math.random().toString(36).substring(2, 9);

          const res = await fetch(`/api/registros-asistentes/${reservaId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_asistente: asistenteId, nombre, email }),
          });

          const json = await res.json();
          if (!res.ok) {
            return {
              exito: false,
              mensaje: json.error || "Error al registrar",
            };
          }

          const row = json.registro;

          // El POST ya devuelve el registro normalizado; actualizarlo de inmediato.
          const nuevoRegistro: AsistenteRegistrado = {
            id: row.id,
            reservaId: row.reservaId || row.eventoId || row.id_evento || reservaId,
            nombre: row.nombre || nombre,
            email: row.email || email,
            numeroAsiento: row.numeroAsiento || row.numero_orden || 0,
            fechaRegistro: row.fecha_registro || new Date().toISOString(),
          };

          setAsistentesRegistrados((prev) => {
            if (prev.some((registro) => registro.id === nuevoRegistro.id)) return prev;
            return [...prev, nuevoRegistro];
          });

          return {
            exito: true,
            mensaje: `Asiento ${nuevoRegistro.numeroAsiento} asignado exitosamente`,
            asiento: nuevoRegistro.numeroAsiento,
          };
        } catch (err: any) {
          console.error("Error registrando asistente:", err);
          return { exito: false, mensaje: err.message || "Error" };
        }
      })();
    },
    [reservas, asistentesRegistrados, userIds]
  );

  if (modoUsuario === null) {
    return (
      <div className="relative isolate min-h-screen overflow-hidden bg-[#020617] px-4 py-8 sm:px-6 lg:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(244,63,94,0.12),transparent_35%),radial-gradient(circle_at_85%_80%,rgba(148,163,184,0.08),transparent_35%)]" />
        <div className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:gap-20">
          <section className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="mb-8 flex aspect-square h-32 w-32 items-center justify-center sm:h-36 sm:w-36">
              <img
                src="/logo53.png"
                alt="Logo A53"
                className="h-full w-full object-contain"
              />
            </div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-[#f43f5e]">A53</p>
            <h1 className="max-w-xl bg-gradient-to-r from-white via-white to-[#f43f5e] bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl lg:text-6xl">
              Sistema de Reservas
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-400 sm:text-lg">
              Gestión de auditorios con una experiencia clara y directa para organizadores y asistentes.
            </p>
          </section>

          <section className="w-full rounded-[2rem] border border-[#1e344f] bg-[#132338] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
            <div className="mb-6 space-y-2">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">Iniciar Sesión</h2>
              <p className="text-sm leading-6 text-slate-400 sm:text-base">
                Ingresa tu correo institucional para recibir tu enlace de acceso.
              </p>
            </div>
            <LoginUsuario
              onSelect={(user) => {
                const tipo = user.tipo_usuario;
                setUserIds((prev) => ({
                  ...prev,
                  [tipo === "asistente" ? "asistente" : "organizador"]:
                    String(user.id),
                }));
                setModoUsuario(tipo === "admin" ? "organizador" : (tipo as any));
              }}
            />
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-[#020617] font-sans text-slate-200 selection:bg-primary/30">
      <main className="mx-auto min-w-0 max-w-7xl overflow-x-hidden px-3 py-5 sm:px-6 sm:py-8">
        {modoUsuario === "organizador" ? (
          <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_560px] xl:gap-8">
            {/* COLUMNA IZQUIERDA: CALENDARIO Y LISTA */}
            <section className="mx-auto w-full max-w-6xl min-w-0 space-y-6">
              <Card className="mx-auto w-full min-w-0 overflow-hidden border border-slate-700 bg-slate-950/95 shadow-[0_25px_50px_-30px_rgba(15,23,42,0.85)]">
                <CardHeader className="space-y-3 border-b border-slate-700/60 px-4 py-4 sm:px-5 sm:py-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>Agenda y eventos</CardTitle>
                      <CardDescription>
                        Alterna entre el calendario y la lista para administrar tu programación.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="min-w-0 px-1 pb-2 sm:px-3 sm:pb-3">
                  <Tabs
                    value={organizadorVista}
                    onValueChange={(value) => {
                      setOpenReservaMobile(false);
                      setOrganizadorVista(value);
                    }}
                    className="mx-auto w-full"
                  >
                    <TabsList className="hidden md:inline-flex h-14 items-center justify-center rounded-2xl bg-slate-900/50 p-1.5 text-slate-400 border border-slate-700 mb-6">
                      <TabsTrigger
                        value="calendario"
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-8 py-2.5 text-sm font-bold transition-all data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-100 data-[state=active]:shadow-sm gap-2"
                      >
                        <CalendarIcon className="w-4 h-4" />
                        Vista de Calendario
                      </TabsTrigger>
                      <TabsTrigger
                        value="lista"
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-8 py-2.5 text-sm font-bold transition-all data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-100 data-[state=active]:shadow-sm gap-2"
                      >
                        <List className="w-4 h-4" />
                        Lista de Eventos
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="calendario" className="mt-0 min-w-0 outline-none">
                      <Calendario
                        reservas={reservas}
                        fechaSeleccionada={fechaSeleccionada}
                        alCambiarFecha={setFechaSeleccionada}
                      />
                    </TabsContent>

                    <TabsContent value="lista" className="mt-0 min-w-0 outline-none">
                      <ListaReservas
                        reservas={reservas}
                        alEliminar={eliminarReserva}
                        alEliminarAsistente={eliminarAsistente}
                        asistentesRegistrados={asistentesRegistrados}
                        usuarioActualId={currentUserId || undefined}
                        modoUsuario={modoUsuario}
                        abrirFiltrosSolicitud={organizadorFiltrosSolicitud}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {openReservaMobile && (
                <div id="crear-reserva-mobile" className="mx-auto w-full max-w-4xl min-w-0 overflow-x-hidden rounded-2xl border border-cyan-400/30 bg-slate-950/95 p-2 shadow-2xl sm:p-3">
                  <div className="mb-2 flex items-center justify-between gap-3 px-2">
                    <div>
                      <h2 className="text-lg font-semibold text-white">Crear reserva</h2>
                      <p className="text-xs text-slate-400">Completa los datos del evento.</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setOpenReservaMobile(false)}
                    >
                      Cerrar
                    </Button>
                  </div>
                  <div className="min-w-0 max-h-[calc(100dvh-10rem)] overflow-x-hidden overflow-y-auto overscroll-contain px-0 pb-16">
                    <FormularioReserva
                      alEnviar={(reserva) => {
                        agregarReserva(reserva);
                        setOpenReservaMobile(false);
                      }}
                      reservas={reservas}
                      fechaSeleccionada={fechaSeleccionada}
                    />
                  </div>
                </div>
              )}
            </section>

            <aside className="hidden lg:block">
              <Card className="overflow-hidden border border-slate-700 bg-slate-950/95 shadow-[0_25px_50px_-30px_rgba(15,23,42,0.85)] sticky top-28">
                <CardHeader className="space-y-2 border-b border-slate-700/60 px-5 py-5">
                  <CardTitle>Crear nueva reserva</CardTitle>
                  <CardDescription>
                    Añade un evento rápido con los datos esenciales.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="w-full max-w-full">
                    <FormularioReserva
                      alEnviar={agregarReserva}
                      reservas={reservas}
                      fechaSeleccionada={fechaSeleccionada}
                    />
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-6xl" id="asistente-panel">
            <Card className="overflow-hidden border border-slate-700 bg-slate-950/95 shadow-[0_25px_50px_-30px_rgba(15,23,42,0.85)]">
              <CardHeader className="space-y-2 border-b border-slate-700/60 px-5 py-5">
                <CardTitle className="text-2xl font-bold text-white">Panel de Asistencia y Reservas</CardTitle>
                <CardDescription>
                  Explora el catálogo de eventos disponibles, consulta la disponibilidad de asientos y gestiona tus asistencias registradas.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <VistaAsistente
                  reservas={reservas}
                  asistentesRegistrados={asistentesRegistrados}
                  onRegisterAttendee={registrarAsistente}
                  abrirFiltrosSolicitud={asistenteFiltrosSolicitud}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <BottomNavigation
        role={modoUsuario}
        active={modoUsuario === "organizador" ? organizadorVista : asistenteSeccion}
        onAction={handleBottomNavAction}
      />
    </div>
  );
}