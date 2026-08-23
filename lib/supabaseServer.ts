import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Cliente Supabase para uso server-side (Service Role Key).
// Usar este cliente en los handlers del servidor para evitar
// repetir la inicialización y para mantener la clave Privada
// fuera del frontend.

function createSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error("Supabase server environment variables are not configured");
  }

  return createClient(url, key, {
    auth: {
      // No configurar persistencia ni storage en handlers server-side.
    },
  });
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, property: string | symbol) {
    const client = createSupabaseAdmin();
    const value = client[property as keyof SupabaseClient];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export default supabaseAdmin;
