import { createServerFn } from "@tanstack/react-start";
import type { EstadoAcesso } from "./acesso.server";

export type Acesso = ({ logado: true } & EstadoAcesso) | { logado: false };

export const obterAcesso = createServerFn({ method: "POST" }).handler(async (): Promise<Acesso> => {
  const { usuarioOpcional } = await import("./auth.server");
  const { obterEstado } = await import("./acesso.server");
  const user = await usuarioOpcional();
  if (!user) return { logado: false };
  return { logado: true, ...(await obterEstado(user.id)) };
});

// Monta o link de pagamento da Cakto com um identificador opaco do aluno (?callback=...).
// Quando o pagamento é aprovado, a Cakto devolve esse identificador no webhook.
export const criarAssinatura = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ url: string }> => {
    const { exigirUsuario } = await import("./auth.server");
    const { obterEstado } = await import("./acesso.server");
    const { getConfig } = await import("./config.server");
    const { supabaseAdmin } = await import("./supabase-admin.server");
    const { randomUUID } = await import("node:crypto");

    const user = await exigirUsuario();
    const estado = await obterEstado(user.id);
    if (estado.encerrado) throw new Error("O Nota Mil já encerrou. Boa prova!");
    if (estado.ativa) throw new Error("Você já tem acesso ativo.");
    if (!user.email) throw new Error("Sua conta precisa ter um e-mail.");

    const base = getConfig().caktoCheckoutUrl;
    let url: URL;
    try {
      url = new URL(base);
    } catch {
      throw new Error("Pagamento indisponível no momento.");
    }

    const token = randomUUID();
    const { error } = await supabaseAdmin()
      .from("checkouts")
      .insert({ token, user_id: user.id, email: user.email.trim().toLowerCase() });
    if (error) throw new Error("Não foi possível iniciar o pagamento. Tente novamente.");

    url.searchParams.set("callback", token);
    return { url: url.toString() };
  },
);
