import { getRequest } from "@tanstack/react-start/server";
import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "./supabase-admin.server";

export async function usuarioOpcional(): Promise<User | null> {
  const auth = getRequest().headers.get("authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token) return null;
  const { data, error } = await supabaseAdmin().auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function exigirUsuario(): Promise<User> {
  const user = await usuarioOpcional();
  if (!user) throw new Error("Entre na sua conta para continuar.");
  return user;
}
