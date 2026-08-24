import supabase from "@/lib/supabaseServer";
import { sendMagicLinkEmail } from "@/lib/send-magic-link";
import crypto from "crypto";
import { isAllowed } from "@/lib/rateLimiter";

export async function POST(request: Request) {
  const { email, nombre, tipo_usuario } = await request.json();

  if (!email) {
    return Response.json({ error: "Correo requerido" }, { status: 400 });
  }

  // SEGURIDAD: Solo permitir asistentes en registro normal
  // Organizadores DEBEN registrarse via /api/auth/register-organizador con código de invitación
  if (tipo_usuario && tipo_usuario.toLowerCase() === "organizador") {
    return Response.json(
      { 
        error: "Los organizadores deben registrarse mediante un código de invitación válido proporcionado por un administrador" 
      }, 
      { status: 403 }
    );
  }

  try {
    const emailLower = email.toLowerCase();
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

    // Rate limiting: por IP y por correo
    if (!isAllowed(`rl:register:ip:${ip}`, 10, 60 * 1000)) {
      return Response.json({ error: "Demasiadas solicitudes desde esta IP. Intenta en un minuto." }, { status: 429 });
    }
    if (!isAllowed(`rl:register:email:${emailLower}`, 3, 60 * 60 * 1000)) {
      return Response.json({ error: "Demasiadas solicitudes para este correo. Intenta más tarde." }, { status: 429 });
    }
    // Forzar asistente (ignorar valor del cliente)
    const targetTipo = "asistente";

    // Si el email ya existe como usuario registrado, no permitir cambio de tipo ni re-registro
    const { data: existingUsers, error: userCheckError } = await supabase
      .from("usuarios")
      .select("id,tipo_usuario")
      .eq("email", emailLower)
      .limit(1);

    if (userCheckError) throw userCheckError;
    if (existingUsers && existingUsers.length > 0) {
      // Evitar enumeración: no revelar si el correo existe. Indicar que se envió enlace si aplica.
      return Response.json({ message: "Si el correo existe, se enviará un enlace de confirmación." }, { status: 200 });
    }

    // Evitar solicitudes repetidas de registro para el mismo correo si ya hay un magic link válido
    const now = new Date().toISOString();
    const { data: pendingLinks, error: pendingError } = await supabase
      .from("magic_links")
      .select("id,fecha_expiracion")
      .eq("email", emailLower)
      .eq("tipo", "registro")
      .order("fecha_expiracion", { ascending: false })
      .limit(1);

    if (pendingError) throw pendingError;
    if (pendingLinks && pendingLinks.length > 0) {
      const expiration = pendingLinks[0].fecha_expiracion;
      if (expiration && new Date(expiration) > new Date()) {
        return Response.json(
          {
            error:
              "Ya existe una solicitud de registro pendiente para este correo. Revisa tu bandeja o espera a que caduque el enlace.",
          },
          { status: 409 }
        );
      }
    }

    // Generar un token único para el magic link y almacenar HASH en la DB
    const token = crypto.randomBytes(4).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const nowDate = new Date();
    const expiresAt = new Date(nowDate.getTime() + 1 * 60 * 60 * 1000); // 1 hora

    // Guardar el enlace mágico en la base de datos vía Supabase
    const { error: insertErr } = await supabase.from("magic_links").insert([
      {
        token: tokenHash,
        email: emailLower,
        tipo: "registro",
        nombre: nombre || null,
        tipo_usuario: targetTipo,
        data_json: JSON.stringify({ nombre, tipo_usuario: targetTipo }),
        fecha_expiracion: expiresAt,
      },
    ]);
    if (insertErr) throw insertErr;

    // Enviar el enlace mágico por correo
    const requestOrigin = request.headers.get("origin") ||
      `${request.headers.get("x-forwarded-proto") || "http"}://${request.headers.get("host") || "localhost:3000"}`;
    await sendMagicLinkEmail(email, token, "registro", requestOrigin);

    return Response.json({
      message:
        "Se ha enviado un enlace de confirmación a tu correo. Revisa tu bandeja de entrada.",
    });
  } catch (error: any) {
    console.error("Error en registro:", error);
    return Response.json(
      { error: error.message || "Error al procesar el registro" },
      { status: 500 }
    );
  }
}
