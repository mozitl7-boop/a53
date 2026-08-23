import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseServer";
import { getUserFromRequest } from "@/lib/auth";
import crypto from "crypto";

/**
 * Genera un código de invitación único para organizadores
 */
function generateInvitationCode(): string {
  return crypto.randomBytes(6).toString("hex").toUpperCase().slice(0, 8);
}

/**
 * GET /api/admin/invitaciones - Listar invitaciones (admin solo)
 */
export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request);
    const adminEmail = process.env.ADMIN_EMAIL || "";
    
    if (!user || user.email?.toLowerCase() !== adminEmail.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: "Acceso denegado. Solo el administrador puede listar invitaciones." },
        { status: 403 }
      );
    }

    const { data: invitations, error } = await supabaseAdmin
      .from("invitaciones_organizador")
      .select("*")
      .order("fecha_creacion", { ascending: false });

    if (error) throw error;

    return NextResponse.json(
      { success: true, invitaciones: invitations || [] },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error fetching invitations:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Error al obtener invitaciones" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/invitaciones - Crear nueva invitación
 * Body: { email: string, dias_validez?: number }
 */
export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    const adminEmail = process.env.ADMIN_EMAIL || "";
    
    if (!user || user.email?.toLowerCase() !== adminEmail.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: "Acceso denegado. Solo el administrador puede generar invitaciones." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, dias_validez = 7 } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email es requerido" },
        { status: 400 }
      );
    }

    // Validar que no exista invitación activa para este email
    const { data: existing, error: existErr } = await supabaseAdmin
      .from("invitaciones_organizador")
      .select("id")
      .eq("email", email.toLowerCase())
      .eq("usado", false)
      .gt("fecha_expiracion", new Date().toISOString());

    if (existErr) throw existErr;
    if (existing && existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "Ya existe una invitación activa para este email" },
        { status: 409 }
      );
    }

    // Generar código único
    let codigo = generateInvitationCode();
    let attempts = 0;
    let codeExists: boolean = true;

    while (codeExists && attempts < 5) {
      const { data: checkCode } = await supabaseAdmin
        .from("invitaciones_organizador")
        .select("id")
        .eq("codigo", codigo)
        .limit(1);

      codeExists = !!(checkCode && checkCode.length > 0);
      if (codeExists) {
        codigo = generateInvitationCode();
        attempts++;
      }
    }

    if (codeExists) {
      return NextResponse.json(
        { success: false, error: "No se pudo generar código único" },
        { status: 500 }
      );
    }

    // Crear invitación
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + dias_validez);

    const { data: invitation, error: invErr } = await supabaseAdmin
      .from("invitaciones_organizador")
      .insert([
        {
          codigo,
          email: email.toLowerCase(),
          creado_por: user.id,
          fecha_expiracion: expirationDate.toISOString(),
        },
      ])
      .select("*")
      .limit(1);

    if (invErr) throw invErr;

    const inv = invitation && invitation[0];

    // Construir link de registro
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const registerLink = `${appUrl}/auth/register-organizador?code=${codigo}`;

    console.log(
      "Invitation created for",
      email,
      "with code",
      codigo,
      "and link:",
      registerLink
    );

    return NextResponse.json(
      {
        success: true,
        invitacion: inv,
        registerLink,
        message: `Código de invitación generado: ${codigo}. Válido por ${dias_validez} días.`,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Error creating invitation:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Error al crear invitación",
      },
      { status: 500 }
    );
  }
}
