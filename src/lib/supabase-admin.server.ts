import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let admin: SupabaseClient | undefined;

// Cliente do SERVIDOR com service role (ignora RLS). Nunca importe isso em código de navegador.
export function supabaseAdmin(): SupabaseClient {
  if (!admin) {
    const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
    const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
    if (!url || !key) {
      throw new Error("Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não configuradas.");
    }
    admin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return admin;
}
