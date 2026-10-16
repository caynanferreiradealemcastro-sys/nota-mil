import { createMiddleware } from "@tanstack/react-start";
import { getSupabase } from "./supabase";

// Anexa o token de login do Supabase em toda chamada de server function feita pelo navegador.
export const anexarToken = createMiddleware({ type: "function" }).client(async ({ next }) => {
  let token: string | undefined;
  try {
    const { data } = await getSupabase().auth.getSession();
    token = data.session?.access_token;
  } catch {
    token = undefined;
  }
  return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
});
