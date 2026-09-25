import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseServer";

/**
 * GET /api/eventos/horarios-libres?auditorio_id=A&fecha=2025-11-21&duracion_minutos=60&limit=3
 * Devuelve horarios de inicio libres para la duración solicitada.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const auditorio_id = url.searchParams.get("auditorio_id");
    const fecha = url.searchParams.get("fecha");
    const limitParam = url.searchParams.get("limit") || "3";
    const limit = Math.max(1, Math.min(24, parseInt(limitParam, 10) || 3));
    const duracionParam = Number(url.searchParams.get("duracion_minutos") || 60);
    const duracionMinutos = Number.isFinite(duracionParam)
      ? Math.max(1, Math.min(600, duracionParam))
      : 60;

    if (!auditorio_id || !fecha) {
      return NextResponse.json(
        { success: false, error: "auditorio_id y fecha son requeridos" },
        { status: 400 }
      );
    }

    // Obtener horarios ocupados en esa fecha/auditorio
    let { data: res, error } = await supabaseAdmin
      .from("eventos")
      .select("hora_inicio,hora_fin,estado")
      .eq("auditorio_id", auditorio_id)
      .eq("fecha", fecha)
      .neq("estado", "cancelado");
    if (error) {
      const fallback = await supabaseAdmin
        .from("eventos")
        .select("hora_inicio,hora_fin,estado")
        .eq("id_auditorio", auditorio_id)
        .eq("fecha", fecha)
        .neq("estado", "cancelado");
      res = fallback.data;
      error = fallback.error;
    }
    if (error) throw error;

    const minutos = (valor: string) => {
      const [hora, minuto] = String(valor).slice(0, 5).split(":").map(Number);
      return hora * 60 + minuto;
    };

    // Generar inicios en horas completas y filtrar usando el intervalo solicitado.
    const todas: string[] = [];
    for (let h = 7; h <= 16 && h * 60 + duracionMinutos <= 17 * 60; h++) {
      todas.push(`${String(h).padStart(2, "0")}:00`);
    }

    const libres = todas.filter((inicio) => {
      const inicioMinutos = minutos(inicio);
      const finMinutos = inicioMinutos + duracionMinutos;
      return !(res || []).some((evento: any) =>
        inicioMinutos < minutos(evento.hora_fin) &&
        minutos(evento.hora_inicio) < finMinutos
      );
    });

    return NextResponse.json(
      { success: true, slots: libres.slice(0, limit) },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error en horarios-libres:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Error" },
      { status: 500 }
    );
  }
}
