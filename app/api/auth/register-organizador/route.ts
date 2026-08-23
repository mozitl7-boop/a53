import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseServer";
import { sendMagicLinkEmail } from "@/lib/send-magic-link";
import crypto from "crypto";
import { isAllowed } from "@/lib/rateLimiter";

/**
 * POST /api/auth/register-organizador - Registrar nuevo organizador con código de invitación
 * Body: { email, nombre, codigo }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, nombre, codigo } = body;
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Rate limiting
    if (!isAllowed(`rl:register-org:ip:${ip}`, 5, 60 * 1000)) {
      return NextResponse.json(
        {
          success: false,
          error: "Demasiadas solicitudes desde esta IP. Intenta en un minuto.",
        },
        { status: 429 }
      );
    }

    const emailLower = (email || "").toString().trim().toLowerCase();

    if (!emailLower || !nombre || !codigo) {
      return NextResponse.json(
        { success: false, error: "Email, nombre y código son requeridos" },
        { status: 400 }
      );
    }

    if (!isAllowed(`rl:register-org:email:${emailLower}`, 3, 60 * 60 * 1000)) {
      return NextResponse.json(
        {
          success: false,
          error: "Demasiadas solicitudes para este correo. Intenta más tarde.",
        },
        { status: 429 }
      );
    }

    // Validar invitación
    const { data: invitaciones, error: invErr } = await supabaseAdmin
      .from("invitaciones_organizador")
      .select("*")
      .eq("codigo", codigo.trim().toUpperCase())
      .limit(1);

    if (invErr) throw invErr;

    if (!invitaciones || invitaciones.length === 0) {
      return NextResponse.json(
        { success: false, error: "Código de invitación inválido" },
        { status: 404 }
      );
    }

    const invitacion = invitaciones[0];

    // Validar que no esté usado
    if (invitacion.usado) {
      return NextResponse.json(
        { success: false, error: "Este código ya ha sido utilizado" },
        { status: 410 }
      );
    }

    // Validar que no esté expirado
    const now = new Date();
    const expiration = new Date(invitacion.fecha_expiracion);
    if (now > expiration) {
      return NextResponse.json(
        { success: false, error: "Este código de invitación ha expirado" },
        { status: 410 }
      );
    }

    // Validar que el email coincida
    if (invitacion.email !== emailLower) {
      return NextResponse.json(
        {
          success: false,
          error: "El email no coincide con el de la invitación",
        },
        { status: 403 }
      );
    }

    // Verificar si el usuario ya existe
    const { data: existingUsers, error: checkErr } = await supabaseAdmin
      .from("usuarios")
      .select("id,tipo_usuario")
      .eq("email", emailLower)
      .limit(1);

    if (checkErr) throw checkErr;

    let usuarioId: string;

    if (existingUsers && existingUsers.length > 0) {
      const existing = existingUsers[0];
      if (existing.tipo_usuario === "organizador") {
        return NextResponse.json(
          {
            success: false,
            error: "Este usuario ya está registrado como organizador",
          },
          { status: 409 }
        );
      }
      // Actualizar tipo_usuario a organizador
      const { error: updateErr } = await supabaseAdmin
        .from("usuarios")
        .update({ tipo_usuario: "organizador" })
        .eq("id", existing.id);

      if (updateErr) throw updateErr;
      usuarioId = existing.id;
    } else {
      // Crear nuevo usuario como organizador
      const { data: newUsers, error: createErr } = await supabaseAdmin
        .from("usuarios")
        .insert([
          {
            nombre: nombre.trim(),
            email: emailLower,
            tipo_usuario: "organizador",
          },
        ])
        .select("id")
        .limit(1);

      if (createErr) throw createErr;
      if (!newUsers || newUsers.length === 0) {
        throw new Error("No se pudo crear el usuario");
      }
      usuarioId = newUsers[0].id;
    }

    // Marcar invitación como usada
    const { error: markErr } = await supabaseAdmin
      .from("invitaciones_organizador")
      .update({
        usado: true,
        fecha_uso: new Date().toISOString(),
        usuario_id_creado: usuarioId,
      })
      .eq("id", invitacion.id);

    if (markErr) throw markErr;

    // Generar magic link para login automático
    const token = crypto.randomBytes(4).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const magicLinkExpiration = new Date(
      Date.now() + 1 * 60 * 60 * 1000
    ).toISOString();

    const { error: magicErr } = await supabaseAdmin
      .from("magic_links")
      .insert([
        {
          token: tokenHash,
          email: emailLower,
          usuario_id: usuarioId,
          tipo: "registro",
          nombre: nombre.trim(),
          tipo_usuario: "organizador",
          usado: false,
          fecha_expiracion: magicLinkExpiration,
        },
      ]);

    if (magicErr) {
      console.warn("Warning: could not insert magic link after org registration:", magicErr);
    }

    // Enviar email de bienvenida con link de login
    try {
      const requestOrigin = request.headers.get("origin") ||
        `${request.headers.get("x-forwarded-proto") || "http"}://${request.headers.get("host") || "localhost:3000"}`;
      await sendMagicLinkEmail(emailLower, token, "registro", requestOrigin);
    } catch (emailErr) {
      console.warn("Warning: could not send welcome email:", emailErr);
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Organizador registrado exitosamente. Se ha enviado un email de confirmación.",
        usuarioId,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Error registering organizador:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Error al registrar organizador",
      },
      { status: 500 }
    );
  }
}
