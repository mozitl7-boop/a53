import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseServer";
import { getUserFromRequest } from "@/lib/auth";

/**
 * API GET /api/eventos — obtener todos los eventos
 */
export async function GET() {
  try {
    // Obtener eventos desde Supabase y computar agregados en el servidor
    // Comentarios y variables en español para claridad

    // 1) Traer todos los eventos (ordenados por fecha/hora)
    const { data: eventosData, error: eventosError } = await supabase
      .from("eventos")
      .select("*")
      .order("fecha", { ascending: false })
      .order("hora_inicio", { ascending: true });

    if (eventosError) throw eventosError;

    const eventosRows = eventosData || [];

    // 2) Detectar qué nombres de columna usa la BD según la primera fila (compatibilidad)
    const sample = eventosRows[0] || {};
    const organizadorColumn = sample.hasOwnProperty("id_organizador")
      ? "id_organizador"
      : sample.hasOwnProperty("organizador_id")
      ? "organizador_id"
      : "id_organizador";
    const auditorioColumn = sample.hasOwnProperty("id_auditorio")
      ? "id_auditorio"
      : sample.hasOwnProperty("auditorio_id")
      ? "auditorio_id"
      : "id_auditorio";

    // 3) Recolectar ids para consultas en lote (organizadores, auditorios, registros)
    const organizadorIds = Array.from(
      new Set(
        eventosRows
          .map((e: any) => e[organizadorColumn])
          .filter((v: any) => v !== null && v !== undefined)
      )
    );
    const auditorioIds = Array.from(
      new Set(
        eventosRows
          .map((e: any) => e[auditorioColumn])
          .filter((v: any) => v !== null && v !== undefined)
      )
    );
    const eventoIds = eventosRows.map((e: any) => e.id);

    // 4) Traer organizadores y auditorios en batch
    const usuariosPromise = organizadorIds.length
      ? supabase.from("usuarios").select("id,nombre,email").in("id", organizadorIds)
      : Promise.resolve({ data: [], error: null });
    const auditoriosPromise = auditorioIds.length
      ? supabase.from("auditorios").select("id,capacidad_total").in("id", auditorioIds)
      : Promise.resolve({ data: [], error: null });

    const [usuariosRes, auditoriosRes] = await Promise.all([usuariosPromise, auditoriosPromise]);
    if (usuariosRes.error) throw usuariosRes.error;
    if (auditoriosRes.error) throw auditoriosRes.error;

    const usuariosMap = (usuariosRes.data || []).reduce((acc: any, u: any) => {
      acc[String(u.id)] = u;
      return acc;
    }, {});
    const auditoriosMap = (auditoriosRes.data || []).reduce((acc: any, a: any) => {
      acc[String(a.id)] = a;
      return acc;
    }, {});

    // 5) Traer registros_confirmados para calcular asistentes_registrados por evento
    // Evitar referenciar columnas concretas en la consulta (p.ej. `evento_id`) ya que
    // algunos esquemas usan `id_evento` y referenciarlas en la cláusula SQL causa
    // errores 42703 si no existen. En su lugar traemos filas filtradas por estado y
    // filtramos en memoria por los ids de eventos.
    let registrosConfirmados: any[] = [];
    if (eventoIds.length > 0) {
      const { data: regs, error: regsError } = await supabase
        .from("registros_asistentes")
        .select("*")
        .eq("estado", "confirmado");
      if (regsError) {
        // Si falla la consulta por cualquier motivo, loguear y continuar sin conteos
        console.warn("Warning: no se pudieron obtener registros_asistentes:", regsError);
        registrosConfirmados = [];
      } else {
        registrosConfirmados = regs || [];
      }
      // Filtrar localmente por los eventoIds soportando ambas columnas
      registrosConfirmados = registrosConfirmados.filter((r: any) => {
        const eid = r.evento_id ?? r.id_evento ?? null;
        if (!eid) return false;
        return eventoIds.includes(String(eid));
      });
    }

    // Agrupar conteos por evento (desde los registros ya filtrados)
    const asistentesPorEvento: Record<string, number> = {};
    registrosConfirmados.forEach((r: any) => {
      const eid = r.evento_id ?? r.id_evento ?? null;
      if (!eid) return;
      asistentesPorEvento[String(eid)] = (asistentesPorEvento[String(eid)] || 0) + 1;
    });

    // 6) Mapear rows al formato esperado por el frontend
    const mapped = eventosRows.map((e: any) => {
      const orgId = e[organizadorColumn];
      const audId = e[auditorioColumn];
      const usuario = usuariosMap[String(orgId)] || {};
      const aud = auditoriosMap[String(audId)] || {};
      const asistentes_registrados = asistentesPorEvento[String(e.id)] || 0;
      const capacidad_total = Number(aud.capacidad_total ?? e.asistentes_esperados ?? 0);
      const fechaStr = e.fecha instanceof Date ? e.fecha.toISOString().substring(0, 10) : String(e.fecha).substring(0, 10);
      const horaFin = (e.hora_fin || "").toString().substring(0, 5) || "23:59";
      const end = new Date(`${fechaStr}T${horaFin}:00`);
      const archivado = new Date() > end;

      return {
        id: e.id,
        titulo: e.titulo,
        descripcion: e.descripcion,
        id_organizador: orgId,
        id_auditorio: audId,
        fecha: e.fecha instanceof Date ? e.fecha.toISOString().substring(0, 10) : String(e.fecha),
        hora_inicio: (e.hora_inicio || "").toString().substring(0, 5),
        hora_fin: (e.hora_fin || "").toString().substring(0, 5),
        asistentes: Number(e.asistentes_esperados || 0),
        estado: e.estado,
        tipo_evento: e.tipo_evento || null,
        carrera: e.carrera || null,
        organizador_nombre: e.ponente_nombre || usuario.nombre || null,
        organizador_email: usuario.email || null,
        capacidad_total,
        asistentes_registrados: Number(asistentes_registrados),
        archivado: Boolean(archivado),
      };
    });

    return NextResponse.json(
      {
        success: true,
        count: mapped.length,
        eventos: mapped,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching eventos:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al obtener eventos",
      },
      { status: 500 }
    );
  }
}

/**
 * API POST /api/eventos — crear un nuevo evento
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Aceptar variantes snake_case o camelCase
    const auditorio_id = body.auditorio_id ?? body.id_auditorio ?? null;
    const ponente_nombre = body.ponente_nombre ?? body.organizador_nombre ?? body.organizadorNombre ?? null;
    const titulo = body.titulo ?? null;
    const descripcion = body.descripcion ?? "";
    const fecha = body.fecha ?? null;
    const hora_inicio = body.hora_inicio ?? body.horaInicio ?? null;
    const hora_fin = body.hora_fin ?? body.horaFin ?? null;
    const asistentes_esperados = body.asistentes_esperados ?? body.asistentes ?? 0;
    const tipo_evento = body.tipo_evento ?? body.tipoEvento ?? null;
    const carrera = body.carrera ?? null;

    // Campos requeridos
    if (!auditorio_id || !titulo || !fecha || !hora_inicio || !hora_fin) {
      return NextResponse.json({ success: false, error: "Faltan campos requeridos" }, { status: 400 });
    }

    // Detectar nombres de columna compatibles revisando una fila de ejemplo
    const { data: sampleArr } = await supabase.from('eventos').select('*').limit(1);
    const sample = (sampleArr && sampleArr[0]) || {};
    const organizadorColumn = sample.hasOwnProperty('id_organizador') ? 'id_organizador' : sample.hasOwnProperty('organizador_id') ? 'organizador_id' : 'id_organizador';
    const auditorioColumn = sample.hasOwnProperty('id_auditorio') ? 'id_auditorio' : sample.hasOwnProperty('auditorio_id') ? 'auditorio_id' : 'id_auditorio';

    // Verificar que el auditorio existe
    const { data: audCheck, error: audErr } = await supabase.from('auditorios').select('id,capacidad_total').eq('id', String(auditorio_id)).limit(1).maybeSingle();
    if (audErr) throw audErr;
    if (!audCheck) return NextResponse.json({ success: false, error: 'Auditorio no encontrado' }, { status: 404 });

    // La sesión conserva la propiedad de la reserva; el nombre visible del ponente es independiente.
    const sessionUser = getUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Autenticación requerida para crear eventos' }, { status: 401 });
    }
    if (sessionUser.tipo_usuario !== 'organizador' && sessionUser.tipo_usuario !== 'admin') {
      return NextResponse.json({ success: false, error: 'No autorizado: solo organizadores o administradores pueden crear eventos' }, { status: 403 });
    }

    const finalOrganizadorId = String(sessionUser.id);

    if (!ponente_nombre || !String(ponente_nombre).trim()) {
      return NextResponse.json({ success: false, error: 'El nombre del ponente es requerido' }, { status: 400 });
    }

    const minutos = (valor: string) => {
      const [hora, minuto] = String(valor).slice(0, 5).split(':').map(Number);
      return hora * 60 + minuto;
    };
    const formatoHora = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!formatoHora.test(String(hora_inicio)) || !formatoHora.test(String(hora_fin))) {
      return NextResponse.json({ success: false, error: 'Las horas deben tener formato HH:MM' }, { status: 400 });
    }
    if (minutos(hora_inicio) < 7 * 60 || minutos(hora_fin) <= minutos(hora_inicio) || minutos(hora_fin) > 17 * 60) {
      return NextResponse.json({ success: false, error: 'El horario debe iniciar desde las 07:00, terminar después del inicio y antes de las 17:00' }, { status: 400 });
    }

    const { data: eventosDelDia, error: eventosDelDiaError } = await supabase
      .from('eventos')
      .select('id,titulo,hora_inicio,hora_fin')
      .eq(auditorioColumn, String(auditorio_id))
      .eq('fecha', fecha)
      .neq('estado', 'cancelado');
    if (eventosDelDiaError) throw eventosDelDiaError;
    const conflicto = (eventosDelDia || []).find((evento: any) =>
      minutos(hora_inicio) < minutos(evento.hora_fin) &&
      minutos(evento.hora_inicio) < minutos(hora_fin)
    );
    if (conflicto) {
      return NextResponse.json({
        success: false,
        error: `El Auditorio ${auditorio_id} ya está reservado de ${String(conflicto.hora_inicio).slice(0, 5)} a ${String(conflicto.hora_fin).slice(0, 5)} para "${conflicto.titulo}"`,
        conflict: conflicto,
      }, { status: 409 });
    }

    // Insertar evento usando columnas detectadas
    const insertObj: any = {
      titulo,
      descripcion,
      fecha,
      hora_inicio,
      hora_fin,
      asistentes_esperados: asistentes_esperados || 0,
      estado: 'confirmado',
      tipo_evento: tipo_evento || null,
      carrera: carrera || null,
      ponente_nombre: ponente_nombre ? String(ponente_nombre).trim() : null,
    };
    insertObj[auditorioColumn] = String(auditorio_id);
    insertObj[organizadorColumn] = finalOrganizadorId;

    const { data: insertedArr, error: insertErr } = await supabase.from('eventos').insert([insertObj]).select().limit(1);
    if (insertErr) throw insertErr;
    const inserted = insertedArr && insertedArr[0];
    if (!inserted) return NextResponse.json({ success: false, error: 'No se pudo crear el evento' }, { status: 500 });

    // Calcular asistentes registrados (intentar con evento_id y con id_evento)
    let asistentes_registrados = 0;
    const { data: regs1, error: regsErr1 } = await supabase.from('registros_asistentes').select('id').eq('evento_id', inserted.id).eq('estado', 'confirmado');
    if (!regsErr1 && regs1) asistentes_registrados = regs1.length;
    else {
      const { data: regs2, error: regsErr2 } = await supabase.from('registros_asistentes').select('id').eq('id_evento', inserted.id).eq('estado', 'confirmado');
      if (!regsErr2 && regs2) asistentes_registrados = regs2.length;
    }

    // Obtener capacidad_total del auditorio
    const capacidad_total = audCheck.capacidad_total ?? inserted.asistentes_esperados ?? 0;

    // Calcular archivado
    const fechaStr = inserted.fecha instanceof Date ? inserted.fecha.toISOString().substring(0,10) : String(inserted.fecha).substring(0,10);
    const horaFinStr = (inserted.hora_fin || hora_fin || '').toString().substring(0,5) || '23:59';
    const end = new Date(`${fechaStr}T${horaFinStr}:00`);
    const archivado = new Date() > end;

    const mapped = {
      id: inserted.id,
      auditorio: String(inserted[auditorioColumn] ?? auditorio_id),
      fecha: inserted.fecha instanceof Date ? inserted.fecha.toISOString().substring(0,10) : String(inserted.fecha),
      horaInicio: (inserted.hora_inicio || '').toString().substring(0,5),
      horaFin: (inserted.hora_fin || '').toString().substring(0,5),
      titulo: inserted.titulo,
      organizador: inserted.ponente_nombre || null,
      organizador_email: null,
      organizadorId: inserted[organizadorColumn],
      descripcion: inserted.descripcion || '',
      asistentes: inserted.asistentes_esperados || 0,
      asistentes_registrados: Number(asistentes_registrados),
      capacidad_total: Number(capacidad_total),
      archivado: Boolean(archivado),
      carrera: inserted.carrera || null,
      presentacion: null,
    };

    // Intentar obtener datos del organizador para incluir nombre/email
    const { data: orgData } = await supabase.from('usuarios').select('id,nombre,email').eq('id', mapped.organizadorId).limit(1);
    if (orgData && orgData.length > 0) {
      mapped.organizador = inserted.ponente_nombre || orgData[0].nombre || null;
      mapped.organizador_email = orgData[0].email || null;
    }

    // Emitir evento Socket.IO para sincronización en tiempo real
    const { broadcastEvent } = await import('@/lib/socketServer');
    await broadcastEvent('evento:creado', mapped);

    return NextResponse.json({ success: true, evento: mapped }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating evento:', error);
    return NextResponse.json({ success: false, error: error?.message || String(error) || 'Error al crear evento' }, { status: 500 });
  }
}
