import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseServer";
import { sendMagicLinkEmail } from "@/lib/send-magic-link";
import crypto from "crypto";
import { isAllowed } from "@/lib/rateLimiter";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body?.email || "").toString().trim().toLowerCase();
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!isAllowed(`rl:login:ip:${ip}`, 10, 60 * 1000)) {
      return NextResponse.json({ error: "Demasiadas solicitudes desde esta IP. Intenta en un minuto." }, { status: 429 });
    }
    if (!isAllowed(`rl:login:email:${email}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "Demasiadas solicitudes para este correo. Intenta más tarde." }, { status: 429 });
    }
    if (!email)
      return NextResponse.json({ error: "email required" }, { status: 400 });

    // Buscar usuario por email usando Supabase
    const { data: users, error: userErr } = await supabaseAdmin
      .from("usuarios")
      .select("id,nombre,email,tipo_usuario")
      .ilike("email", email)
      .limit(1);
    if (userErr) throw userErr;
    const user = users && users[0];
    if (!user) {
      console.warn("[auth/login] No existe una cuenta para el correo solicitado");
      // Evitar enumeración: responder igual si el usuario no existe
      return NextResponse.json({ message: "Si existe una cuenta con ese correo, se enviará un enlace de acceso." }, { status: 200 });
    }

    // Generar magic link para login, almacenar HASH en BD y usar expiración corta
    const token = crypto.randomBytes(4).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(new Date().getTime() + 1 * 60 * 60 * 1000); // 1 hora

    // Guardar el magic link de login en Supabase (guardar hash)
    const { error: insertErr } = await supabaseAdmin.from("magic_links").insert([
      { token: tokenHash, email, usuario_id: user.id, tipo: "login", fecha_expiracion: expiresAt },
    ]);
    if (insertErr) throw insertErr;

    // Enviar el enlace mágico por correo (se envía el token sin hash)
    const requestOrigin = req.headers.get("origin") ||
      `${req.headers.get("x-forwarded-proto") || "http"}://${req.headers.get("host") || "localhost:3000"}`;
    const emailSent = await sendMagicLinkEmail(email, token, "login", requestOrigin);
    if (!emailSent) {
      return NextResponse.json(
        { error: "No se pudo enviar el enlace de acceso. Verifica la configuración del correo." },
        { status: 502 }
      );
    }

    console.info("[auth/login] Enlace aceptado para envío por Mailjet");

    return NextResponse.json(
      {
        message:
          "Se ha enviado un enlace de confirmación a tu correo. Revisa tu bandeja de entrada.",
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
