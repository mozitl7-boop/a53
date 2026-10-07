import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseServer";
import { getUserFromRequest } from "@/lib/auth";

/**
 * API GET /api/registros-asistentes/all — obtener todos los registros de asistentes
 */
export async function GET(request: Request) {
  try {
    // Obtener filas de registros_asistentes mediante Supabase (del lado del servidor mediante el rol de servicio)
    // Seleccionamos todas las columnas y nos adaptaremos a los nombres de columnas PK/FK que existan
    const { data: registros, error: regError } = await supabase
      .from("registros_asistentes")
      .select("*")
      .order("fecha_registro", { ascending: false });

    if (regError) {
      throw regError;
    }

    const rows = registros || [];

    // Determinar qué columnas existen inspeccionando la primera fila (si hay alguna)
    const sample = rows[0] || {};
    const raEventoCol = sample.hasOwnProperty("id_evento")
      ? "id_evento"
      : sample.hasOwnProperty("evento_id")
      ? "evento_id"
      : "id_evento";
    const raAsistenteCol = sample.hasOwnProperty("id_asistente")
      ? "id_asistente"
      : sample.hasOwnProperty("asistente_id")
      ? "asistente_id"
      : sample.hasOwnProperty("usuario_id")
      ? "usuario_id"
      : "id_asistente";
    const raAsientoCol = sample.hasOwnProperty("id_asiento")
      ? "id_asiento"
      : sample.hasOwnProperty("asiento_id")
      ? "asiento_id"
      : "id_asiento";

    // Recopilar ids únicos de asistentes para obtener usuarios en lote
    const asistenteIds = Array.from(
      new Set(
        rows
          .map((r: any) => r[raAsistenteCol])
          .filter((v: any) => v !== null && v !== undefined)
      )
    );

    let usuariosMap: Record<string, any> = {};
    if (asistenteIds.length > 0) {
      const { data: usuarios, error: userError } = await supabase
        .from("usuarios")
        .select("id,nombre,email")
        .in("id", asistenteIds);
      if (userError) throw userError;
      usuariosMap = (usuarios || []).reduce((acc: any, u: any) => {
        acc[String(u.id)] = u;
        return acc;
      }, {});
    }

    const mapped = rows.map((r: any) => {
      const asistId = r[raAsistenteCol] ?? null;
      const user = asistId ? usuariosMap[String(asistId)] : null;
      return {
        id: r.id,
        id_evento: r[raEventoCol] ?? null,
        eventoId: r[raEventoCol] ?? null,
        reservaId: r[raEventoCol] ?? null,
        asistenteId: asistId,
        id_asistente: asistId,
        nombre: user?.nombre ?? null,
        email: user?.email ?? null,
        asientoId: r[raAsientoCol] ?? null,
        numero_orden: r.numero_orden ?? null,
        numeroAsiento: r.numero_orden ?? null,
        fecha_registro: r.fecha_registro ?? null,
        fechaRegistro: r.fecha_registro ?? null,
        estado: r.estado ?? null,
        asistio: Boolean(r.asistio),
        matricula: null,
        source: "reserva",
      };
    });

    let qrMapped: any[] = [];
    try {
      const user = getUserFromRequest(request);
      let allowedEventIds = new Set<string>();
      if (user?.tipo_usuario === "admin") {
        allowedEventIds = new Set(["*"]);
      } else if (user?.tipo_usuario === "organizador") {
        const { data: eventos, error: eventosError } = await supabase
          .from("eventos")
          .select("*");
        if (eventosError) throw eventosError;
        allowedEventIds = new Set(
          (eventos || [])
            .filter((evento: any) => {
              const ownerId = evento.id_organizador ?? evento.organizador_id ?? evento.organizer_id;
              return String(ownerId || "") === String(user.id);
            })
            .map((evento: any) => String(evento.id))
        );
      }

      const { data: qrRows, error: qrError } = await supabase
        .from("asistencias_qr")
        .select("id,evento_id,nombre,matricula,asistio,fecha_registro")
        .order("fecha_registro", { ascending: false });
      if (qrError) throw qrError;
      qrMapped = (qrRows || [])
        .filter((row: any) => allowedEventIds.has("*") || allowedEventIds.has(String(row.evento_id)))
        .map((row: any) => ({
        id: row.id,
        id_evento: row.evento_id,
        eventoId: row.evento_id,
        reservaId: row.evento_id,
        asistenteId: null,
        id_asistente: null,
        nombre: row.nombre,
        email: null,
        matricula: row.matricula,
        asientoId: null,
        numero_orden: null,
        numeroAsiento: null,
        fecha_registro: row.fecha_registro,
        fechaRegistro: row.fecha_registro,
        estado: "confirmado",
        asistio: Boolean(row.asistio),
        source: "qr",
        }));
    } catch (qrError) {
      console.warn("No se pudieron cargar las asistencias por QR; verifica la migración:", qrError);
    }

    const allMapped = [...mapped, ...qrMapped].sort((a, b) =>
      String(b.fechaRegistro || "").localeCompare(String(a.fechaRegistro || ""))
    );

    return NextResponse.json(
      {
        success: true,
        count: allMapped.length,
        registros: allMapped,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error al obtener registros_asistentes:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al obtener registros de asistentes",
      },
      { status: 500 }
    );
  }
}
