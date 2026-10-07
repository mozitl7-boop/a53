import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseServer";
import { isAllowed } from "@/lib/rateLimiter";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function broadcastCheckIn(payload: Record<string, unknown>) {
  try {
    const { broadcastEvent } = await import("@/lib/socketServer");
    await broadcastEvent("asistente:registrado", payload);
  } catch (broadcastError) {
    console.warn("No se pudo actualizar el pase de lista en tiempo real:", broadcastError);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventoId: string }> }
) {
  const { eventoId } = await params;
  if (!UUID_PATTERN.test(eventoId)) {
    return NextResponse.json({ success: false, error: "Evento inválido" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const nombre = typeof body.nombre === "string" ? body.nombre.trim().replace(/\s+/g, " ") : "";
  const matricula = typeof body.matricula === "string" ? body.matricula.trim().toUpperCase() : "";
  if (!/^[\p{L}\p{M}][\p{L}\p{M} .'-]{1,119}$/u.test(nombre)) {
    return NextResponse.json({ success: false, error: "Escribe tu nombre completo (2 a 120 caracteres)." }, { status: 400 });
  }
  if (!/^[\p{L}\p{N}][\p{L}\p{N}-]{1,39}$/u.test(matricula)) {
    return NextResponse.json({ success: false, error: "Escribe una matrícula válida (2 a 40 letras o números)." }, { status: 400 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  if (!isAllowed(`rl:checkin:ip:${ip}`, 1000, 10 * 60 * 1000)) {
    return NextResponse.json({ success: false, error: "Se alcanzó el límite de registros. Intenta en unos minutos." }, { status: 429 });
  }

  try {
    const { data: evento, error: eventoError } = await supabase
      .from("eventos")
      .select("id")
      .eq("id", eventoId)
      .maybeSingle();
    if (eventoError) throw eventoError;
    if (!evento) {
      return NextResponse.json({ success: false, error: "Evento no encontrado" }, { status: 404 });
    }

    const { data: existing, error: existingError } = await supabase
      .from("asistencias_qr")
      .select("id,nombre,matricula,asistio")
      .eq("evento_id", eventoId)
      .eq("matricula", matricula)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      const sameName = String(existing.nombre).trim().toLocaleLowerCase("es-MX") === nombre.toLocaleLowerCase("es-MX");
      if (!sameName) {
        return NextResponse.json({ success: false, error: "Esa matrícula ya fue registrada con otro nombre." }, { status: 409 });
      }
      if (existing.asistio) {
        return NextResponse.json({ success: true, asistio: true, alreadyCheckedIn: true });
      }
      const { error: recheckError } = await supabase
        .from("asistencias_qr")
        .update({ asistio: true })
        .eq("id", existing.id)
        .eq("evento_id", eventoId);
      if (recheckError) throw recheckError;
      await broadcastCheckIn({
        id: existing.id,
        id_evento: eventoId,
        eventoId,
        nombre,
        matricula,
        asistio: true,
        source: "qr",
      });
      return NextResponse.json({ success: true, asistio: true, alreadyCheckedIn: false });
    }

    const { data: created, error: createError } = await supabase
      .from("asistencias_qr")
      .insert([{ evento_id: eventoId, nombre, matricula, asistio: true }])
      .select("id,asistio")
      .single();
    if (createError) {
      if (createError.code === "23505") {
        return NextResponse.json({ success: false, error: "Esta matrícula acaba de registrarse. Verifica con el organizador si necesitas corregir el nombre." }, { status: 409 });
      }
      if (createError.code === "PGRST205" || createError.code === "42P01") {
        return NextResponse.json({ success: false, error: "El pase de lista todavía no está configurado en la base de datos." }, { status: 503 });
      }
      throw createError;
    }

    await broadcastCheckIn({
      id: created.id,
      id_evento: eventoId,
      eventoId,
      nombre,
      matricula,
      fecha_registro: new Date().toISOString(),
      asistio: Boolean(created.asistio),
      source: "qr",
    });

    return NextResponse.json({ success: true, asistio: Boolean(created.asistio), alreadyCheckedIn: false });
  } catch (error: any) {
    console.error("Error registrando asistencia por QR:", error);
    return NextResponse.json({ success: false, error: error.message || "No se pudo registrar la asistencia" }, { status: 500 });
  }
}