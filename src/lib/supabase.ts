import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

// Cliente do NAVEGADOR (chave anon/publishable). Só use dentro de efeitos ou handlers.
export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        "Configuração do Supabase ausente (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).",
      );
    }
    client = createClient(url, key);
  }
  return client;
}
