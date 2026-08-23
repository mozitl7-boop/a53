"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Reserva } from "@/app/page";
import {
  CalendarIcon,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  FileText,
  Upload,
} from "lucide-react";
import { crearValidadorReservas } from "@/lib/validacion-reservas";

type PropiedadesFormularioReserva = {
  alEnviar: (
    reserva: Omit<Reserva, "id"> & Partial<Pick<Reserva, "id">>
  ) => void;
  reservas: Reserva[];
  fechaSeleccionada: Date;
};

export function FormularioReserva({
  alEnviar,
  reservas,
  fechaSeleccionada,
}: PropiedadesFormularioReserva) {
  const { toast } = useToast();

  const [organizadores, setOrganizadores] = useState<
    {
      id: string;
      nombre: string;
      email: string;
    }[]
  >([]);
  const [organizadorId, setOrganizadorId] = useState<string>("");
  const [organizadorLibre, setOrganizadorLibre] = useState<boolean>(false);
  const [enviando, setEnviando] = useState(false);

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

  const [datosFormulario, establecerDatosFormulario] = useState({
    auditorio: "A" as "A" | "B",
    fecha: obtenerFechaMinima(),
    horaInicio: "09:00",
    titulo: "",
    organizador: "",
    organizador_email: "",
    descripcion: "",
    asistentes: "",
    carrera: "no-especificado",
    presentacion: "",
  });

  const [mostrarHorariosDisponibles, establecerMostrarHorariosDisponibles] =
    useState(false);

  useEffect(() => {
    const fechaMinima = obtenerFechaMinima();
    const fechaFormularioFormato = formatearFechaLocal(fechaSeleccionada);

    // Si la fecha seleccionada en el calendario es válida, actualizar formulario
    if (fechaFormularioFormato >= fechaMinima) {
      establecerDatosFormulario((prev) => ({
        ...prev,
        fecha: fechaFormularioFormato,
      }));
    } else {
      // Si la fecha seleccionada es inválida, usar la fecha mínima
      establecerDatosFormulario((prev) => ({
        ...prev,
        fecha: fechaMinima,
      }));
    }
  }, [fechaSeleccionada]);

  // Obtener organizadores disponibles
  useEffect(() => {
    let mounted = true;
    async function fetchOrganizadores() {
      try {
        const res = await fetch("/api/usuarios/organizadores");
        const text = await res.text();
        let data: any;
        try {
          data = text ? JSON.parse(text) : {};
        } catch (e) {
          console.error("Organizadores: respuesta no-JSON:", text);
          data = { success: false, error: "Respuesta no JSON del servidor", raw: text };
        }

        if (mounted && data && data.success) {
          setOrganizadores(data.organizadores || []);
          if (data.organizadores && data.organizadores.length > 0) {
            setOrganizadorId(data.organizadores[0].id);
          }
        } else if (mounted) {
          console.warn("No se obtuvieron organizadores:", data && data.error ? data.error : data);
        }
      } catch (err) {
        console.error("Error fetching organizadores:", err);
      }
    }
    fetchOrganizadores();
    return () => {
      mounted = false;
    };
  }, []);
  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();

    // Protección contra doble envío
    if (enviando) {
      return;
    }

    // Validar que la fecha sea >= fecha mínima
    const fechaMinima = obtenerFechaMinima();
    if (datosFormulario.fecha < fechaMinima) {
      toast({
        title: "Fecha inválida",
        description:
          "No se pueden hacer reservas para hoy después de las 4:00 PM. Selecciona mañana o una fecha posterior.",
        variant: "destructive",
      });
      return;
    }

    const [hora, minuto] = datosFormulario.horaInicio.split(":").map(Number);
    const horaFin = hora + 1;
    const horaFinTexto = `${String(horaFin).padStart(2, "0")}:${String(
      minuto
    ).padStart(2, "0")}`;

    const validador = crearValidadorReservas(reservas);
    const validacion = validador.validar({
      auditorio: datosFormulario.auditorio,
      fecha: datosFormulario.fecha,
      horaInicio: datosFormulario.horaInicio,
      asistentes: Number.parseInt(datosFormulario.asistentes) || 0,
      titulo: datosFormulario.titulo,
    });

    if (!validacion.esValido) {
      toast({
        title: "Error de validación",
        description: validacion.error,
        variant: "destructive",
      });
      return;
    }

    if (validacion.advertencias && validacion.advertencias.length > 0) {
      validacion.advertencias.forEach((advertencia) => {
        toast({
          title: "Advertencia",
          description: advertencia,
          variant: "default",
        });
      });
    }

    try {
      // Crear evento en la BD
      const response = await fetch("/api/eventos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // auditorio_id debe ser el id de auditorios ('A' o 'B')
          id_auditorio: datosFormulario.auditorio,
          // enviar el organizador seleccionado (UUID) o el nombre si es libre
          id_organizador: organizadorId || null,
          organizador_nombre: !organizadorId
            ? datosFormulario.organizador
            : null,
          organizador_email: !organizadorId
            ? datosFormulario.organizador_email
            : null,
          titulo: datosFormulario.titulo,
          descripcion: datosFormulario.descripcion,
          fecha: datosFormulario.fecha,
          hora_inicio: datosFormulario.horaInicio,
          hora_fin: horaFinTexto,
          asistentes_esperados:
            Number.parseInt(datosFormulario.asistentes) || 0,
          tipo_evento:
            datosFormulario.carrera === "no-especificado"
              ? null
              : datosFormulario.carrera,
          carrera:
            datosFormulario.carrera === "no-especificado"
              ? null
              : datosFormulario.carrera,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Reserva creada",
          description: `${datosFormulario.titulo} reservado exitosamente.`,
        });

        // Informar al componente padre para que actualice la lista sin necesitar F5
        try {
          if (typeof alEnviar === "function") {
            // Usar el objeto `evento` devuelto por el servidor si está disponible
            const nuevoEvento = result.evento
              ? {
                  id: result.evento.id,
                  auditorio: String(result.evento.id_auditorio || result.evento.auditorio || datosFormulario.auditorio) as "A" | "B",
                  fecha: (result.evento.fecha || datosFormulario.fecha).substring(0, 10),
                  horaInicio: (result.evento.hora_inicio || datosFormulario.horaInicio).toString().substring(0, 5),
                  horaFin: (result.evento.hora_fin || horaFinTexto).toString().substring(0, 5),
                  titulo: result.evento.titulo || datosFormulario.titulo,
                  organizador: result.evento.organizador_nombre || datosFormulario.organizador || "",
                  organizadorId: result.evento.id_organizador || organizadorId || undefined,
                  descripcion: result.evento.descripcion || datosFormulario.descripcion || "",
                  asistentes: Number((result.evento.asistentes_esperados ?? Number.parseInt(datosFormulario.asistentes)) || 0),
                  archivado: result.evento.archivado || false,
                  carrera: result.evento.carrera || datosFormulario.carrera || null,
                  presentacion: null,
                }
              : {
                  auditorio: datosFormulario.auditorio,
                  fecha: datosFormulario.fecha,
                  horaInicio: datosFormulario.horaInicio,
                  horaFin: horaFinTexto,
                  titulo: datosFormulario.titulo,
                  organizador: datosFormulario.organizador || "",
                  descripcion: datosFormulario.descripcion || "",
                  asistentes: Number.parseInt(datosFormulario.asistentes) || 0,
                  carrera: datosFormulario.carrera || null,
                };

            // Llamar al callback para que el UI padre actualice su estado inmediatamente
            alEnviar(nuevoEvento as any);
          }
        } catch (e) {
          // No bloquear el flujo si falla el callback
          console.warn("alEnviar callback failed:", e);
        }

        // Limpiar formulario
        establecerDatosFormulario({
          auditorio: "A",
          fecha: obtenerFechaMinima(),
          horaInicio: "09:00",
          titulo: "",
          organizador: "",
          organizador_email: "",
          descripcion: "",
          asistentes: "",
          carrera: "no-especificado",
          presentacion: "",
        });
      } else {
        // Si es conflicto (409) el servidor ahora devuelve `conflict` con el evento
        if (response.status === 409 && result.conflict) {
          const c = result.conflict;
          toast({
            title: "Horario no disponible",
            description: `Ya existe '${c.titulo}' por ${
              c.organizador_nombre || c.organizador_email
            } a las ${c.hora_inicio?.substring(0, 5)}`,
            variant: "destructive",
          });

          // Solicitar sugerencias de horarios libres (3) y mostrarlas si hay
          try {
            const sugRes = await fetch(
              `/api/eventos/horarios-libres?auditorio_id=${datosFormulario.auditorio}&fecha=${datosFormulario.fecha}&limit=3`
            );
            const sugJson = await sugRes.json();
            if (
              sugJson &&
              sugJson.success &&
              Array.isArray(sugJson.slots) &&
              sugJson.slots.length > 0
            ) {
              toast({
                title: "Horarios alternativos",
                description: `Disponibles: ${sugJson.slots.join(", ")}`,
              });
            }
          } catch (err) {
            // No crítico
            console.error("Error fetching suggestions:", err);
          }
        } else {
          toast({
            title: "Error al crear reserva",
            description: result.error || "Error desconocido",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error creando reserva:", error);
      toast({
        title: "Error al crear reserva",
        description: "Error de conexión",
        variant: "destructive",
      });
    }
  };

  const obtenerHorariosDisponibles = () => {
    const validador = crearValidadorReservas(reservas);
    return validador.obtenerHorariosDisponibles(
      datosFormulario.auditorio,
      datosFormulario.fecha
    );
  };

  const esHorarioDisponible = (hora: string) => {
    const validador = crearValidadorReservas(reservas);
    return validador.estaHorarioDisponible(
      datosFormulario.auditorio,
      datosFormulario.fecha,
      hora
    );
  };

  const capacidadMaxima = datosFormulario.auditorio === "A" ? 168 : 168;
  const porcentajeCapacidad = datosFormulario.asistentes
    ? (Number.parseInt(datosFormulario.asistentes) / capacidadMaxima) * 100
    : 0;

  const inputGlowClass =
    datosFormulario.auditorio === "A"
      ? "focus:border-orange-400 focus:ring-orange-400/40"
      : "focus:border-purple-400 focus:ring-purple-400/40";

  const fieldClass = `mt-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 placeholder:text-[var(--input-placeholder)] shadow-sm outline-none transition duration-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30`;

  return (
    <Card className="w-full min-w-0 max-w-full rounded-2xl border border-slate-700 bg-slate-950/95 shadow-[0_25px_50px_-30px_rgba(15,23,42,0.85)] flex flex-col max-h-[90vh] overflow-hidden lg:sticky lg:top-4">
      <div className="flex items-center gap-4 p-5 border-b border-slate-700 shrink-0 bg-slate-950/95">
        <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-300">
          <CalendarIcon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Nueva Reserva</h2>
          <p className="text-sm text-slate-300">Gestión de espacios y eventos</p>
        </div>
      </div>
      <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 scrollbar-custom sm:p-5">
        <div className="mx-auto w-full min-w-0 max-w-130">
          <form id="reserva-form" onSubmit={manejarEnvio} className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2">
          
          {/* Selector de Auditorio */}
          <div className="md:col-span-2">
            <Label className="text-lg font-bold mb-4 block text-white">Auditorio</Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => establecerDatosFormulario({ ...datosFormulario, auditorio: "A" })}
                className={`p-4 rounded-xl transition-all border-2 ${
                  datosFormulario.auditorio === "A"
                    ? "bg-orange-600/20 text-orange-100 border-orange-500/80 shadow-lg shadow-orange-500/20"
                    : "bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-600"
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl font-black">A</div>
                  <div className="text-xs uppercase tracking-widest mt-1">168 personas</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => establecerDatosFormulario({ ...datosFormulario, auditorio: "B" })}
                className={`p-4 rounded-xl transition-all border-2 ${
                  datosFormulario.auditorio === "B"
                    ? "bg-purple-600/20 text-purple-100 border-purple-500/80 shadow-lg shadow-purple-500/20"
                    : "bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-600"
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl font-black">B</div>
                  <div className="text-xs uppercase tracking-widest mt-1">168 personas</div>
                </div>
              </button>
            </div>
          </div>

          {/* Fecha y Hora - Inputs más grandes */}
          <div className="space-y-2">
            <Label htmlFor="fecha" className="text-base font-semibold text-white">Fecha del Evento</Label>
            <Input
              id="fecha"
              type="date"
              value={datosFormulario.fecha}
              onChange={(e) => establecerDatosFormulario({ ...datosFormulario, fecha: e.target.value })}
              min={obtenerFechaMinima()}
              className={`${fieldClass} text-base h-12`}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="horaInicio" className="text-base font-semibold flex items-center gap-2 text-white">
                <Clock className="w-5 h-5" /> Horario
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => establecerMostrarHorariosDisponibles(!mostrarHorariosDisponibles)}
                className="text-sm font-bold text-primary hover:bg-primary/10"
              >
                {mostrarHorariosDisponibles ? "Cerrar" : "Ver libres"}
              </Button>
            </div>
            <Input
              id="horaInicio"
              type="time"
              value={datosFormulario.horaInicio}
              onChange={(e) => establecerDatosFormulario({ ...datosFormulario, horaInicio: e.target.value })}
              className={`${fieldClass} text-base h-12`}
              required
            />
          </div>

          {/* Menú Desplegable de Horarios */}
          {mostrarHorariosDisponibles && (
            <div className="md:col-span-2 p-4 bg-slate-900 border border-slate-700 rounded-xl animate-in zoom-in-95">
              <div className="grid grid-cols-4 gap-2">
                {obtenerHorariosDisponibles().map((ranura) => (
                  <Button
                    key={ranura}
                    type="button"
                    variant={datosFormulario.horaInicio === ranura ? "default" : "outline"}
                    className="text-sm h-10 font-bold"
                    onClick={() => {
                      establecerDatosFormulario({ ...datosFormulario, horaInicio: ranura });
                      establecerMostrarHorariosDisponibles(false);
                    }}
                  >
                    {ranura}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="titulo" className="text-base font-semibold text-white">Título del Evento</Label>
            <Input
              id="titulo"
              value={datosFormulario.titulo}
              onChange={(e) => establecerDatosFormulario({ ...datosFormulario, titulo: e.target.value })}
              placeholder="Título descriptivo del evento"
              className={`${fieldClass} text-base h-12`}
              required
            />
          </div>

          {/* Organizador */}
          <div className="md:col-span-2 space-y-2">
            <Label className="text-base font-semibold text-white">Responsable / Organizador</Label>
            <Select
              value={organizadorId}
              onValueChange={(val) => {
                if (val === "otro") { setOrganizadorId(""); setOrganizadorLibre(true); }
                else { setOrganizadorId(val); setOrganizadorLibre(false); }
              }}
            >
              <SelectTrigger className={`${fieldClass} text-base h-12`}>
                <SelectValue placeholder="Seleccione un responsable" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border border-slate-700 text-slate-100">
                <SelectItem value="otro">Ingreso manual...</SelectItem>
                {organizadores.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {organizadorLibre && (
              <div className="mt-4 space-y-3 p-4 bg-slate-900 rounded-xl border border-slate-700 animate-in slide-in-from-top-2">
                <Input
                  value={datosFormulario.organizador}
                  onChange={(e) => establecerDatosFormulario({ ...datosFormulario, organizador: e.target.value })}
                  placeholder="Nombre completo"
                  className={`${fieldClass} text-base h-12`}
                  required
                />
                <Input
                  type="email"
                  value={datosFormulario.organizador_email}
                  onChange={(e) => establecerDatosFormulario({ ...datosFormulario, organizador_email: e.target.value })}
                  placeholder="Correo institucional"
                  className={`${fieldClass} text-base h-12`}
                  required
                />
              </div>
            )}
          </div>

          {/* Asistentes con Barra de Animación */}
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="asistentes" className="text-base font-semibold flex items-center gap-2 text-white">
              <Users className="w-5 h-5" /> Número de Asistentes
            </Label>
            <Input
              id="asistentes"
              type="number"
              value={datosFormulario.asistentes}
              onChange={(e) => establecerDatosFormulario({ ...datosFormulario, asistentes: e.target.value })}
              max={capacidadMaxima}
              className={`${fieldClass} text-base h-12`}
              required
            />
            {datosFormulario.asistentes && (
              <div className="mt-4 p-4 bg-slate-900 rounded-xl border border-slate-700">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400 font-medium">Ocupación del Auditorio</span>
                  <span className={`font-bold ${porcentajeCapacidad > 100 ? "text-red-400" : "text-primary text-lg"}`}>
                    {datosFormulario.asistentes} / {capacidadMaxima}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner">
                  <div
                    className={`h-full transition-all duration-1000 ease-out rounded-full ${
                      porcentajeCapacidad > 100 ? "bg-red-500" : "bg-linear-to-r from-emerald-500 to-emerald-400"
                    }`}
                    style={{ width: `${Math.min(porcentajeCapacidad, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold text-white">
              Carrera Académica
            </Label>
            <Select
              value={datosFormulario.carrera}
              onValueChange={(value) => establecerDatosFormulario({ ...datosFormulario, carrera: value })}
            >
              <SelectTrigger className={`${fieldClass} text-base h-12 w-full`}>
                <SelectValue placeholder="Seleccionar carrera" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border border-slate-700 text-slate-100">
                <SelectItem value="no-especificado">General / Externo</SelectItem>
                <SelectItem value="tic">Ingeniería en TIC</SelectItem>
                <SelectItem value="electronica">Ingeniería Electrónica</SelectItem>
                <SelectItem value="industrial">Ingeniería Industrial</SelectItem>
                <SelectItem value="gestion">Gestión Empresarial</SelectItem>
                <SelectItem value="mecanica">Ingeniería Mecánica</SelectItem>
                <SelectItem value="electrica">Ingeniería Eléctrica</SelectItem>
                <SelectItem value="logistica">Ingeniería en Logística</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Columna: Material (PDF) */}
          <div className="space-y-2">
            <Label className="text-base font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5" /> Material (PDF)
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('presentacion')?.click()}
                className="w-full h-12 border-dashed border-2 bg-transparent hover:bg-white/5 text-white flex items-center justify-center"
              >
                <Upload className="w-4 h-4 mr-2" />
                <span className="truncate">
                  {datosFormulario.presentacion || "Subir PDF"}
                </span>
              </Button>
              <input
                id="presentacion"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const archivo = e.target.files?.[0];
                  if (archivo && archivo.type === "application/pdf") {
                    establecerDatosFormulario({ ...datosFormulario, presentacion: archivo.name });
                  }
                }}
              />
            </div>
          </div>
          </form>
        </div>
      </div>

      {/* FOOTER FIJO */}
      <div className="p-5 border-t border-slate-700 bg-slate-950/95 shrink-0">
        {datosFormulario.horaInicio && (
          <div className={`mb-4 flex items-center gap-3 p-4 rounded-xl text-sm font-bold border ${
            esHorarioDisponible(datosFormulario.horaInicio) 
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50" 
              : "bg-red-500/20 text-red-300 border-red-500/50"
          }`}>
            {esHorarioDisponible(datosFormulario.horaInicio) ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{esHorarioDisponible(datosFormulario.horaInicio) ? "HORARIO DISPONIBLE" : "HORARIO NO DISPONIBLE"}</span>
          </div>
        )}
        
        <Button
          form="reserva-form"
          type="submit"
          disabled={enviando || !esHorarioDisponible(datosFormulario.horaInicio)}
          className="w-full h-14 text-lg font-black rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {enviando ? "PROCESANDO..." : "CONFIRMAR RESERVACIÓN"}
        </Button>
      </div>
    </Card>
  );
}
