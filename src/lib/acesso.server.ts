import { getConfig } from "./config.server";
import { supabaseAdmin } from "./supabase-admin.server";

export type EstadoAcesso = {
  ativa: boolean;
  venceEm: string | null;
  aguardando: boolean;
  encerrado: boolean;
  fimEm: string;
  preco: number;
  restantes: number;
  limite: number;
};

export async function obterEstado(userId: string): Promise<EstadoAcesso> {
  const cfg = getConfig();
  const db = supabaseAdmin();
  const agora = Date.now();

  const { data: ass } = await db
    .from("assinaturas")
    .select("valid_until")
    .eq("user_id", userId)
    .maybeSingle();
  const venceEm = ass?.valid_until ? new Date(String(ass.valid_until)) : null;
  const ativa = !!venceEm && venceEm.getTime() > agora;

  const desde = new Date(agora - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await db
    .from("correcoes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("criado_em", desde);

  // "Aguardando": o aluno abriu o pagamento na última hora e o aviso da Cakto ainda não chegou.
  const umaHora = new Date(agora - 60 * 60 * 1000).toISOString();
  const { count: abertos } = await db
    .from("checkouts")
    .select("token", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("criado_em", umaHora);

  return {
    ativa,
    venceEm: venceEm ? venceEm.toISOString() : null,
    aguardando: !ativa && (abertos ?? 0) > 0,
    encerrado: agora > cfg.fimEm.getTime(),
    fimEm: cfg.fimEm.toISOString(),
    preco: cfg.preco,
    restantes: Math.max(0, cfg.limiteDiario - (count ?? 0)),
    limite: cfg.limiteDiario,
  };
}

export async function verificarAcesso(userId: string): Promise<EstadoAcesso> {
  const e = await obterEstado(userId);
  if (e.encerrado) throw new Error("O Nota Mil já encerrou. Boa prova!");
  if (!e.ativa) throw new Error("Assine para corrigir sua redação.");
  if (e.restantes <= 0) {
    throw new Error("Você atingiu o limite de correções de hoje. Volte amanhã.");
  }
  return e;
}

export async function registrarUso(userId: string): Promise<void> {
  const { error } = await supabaseAdmin().from("correcoes").insert({ user_id: userId });
  if (error) console.error("Falha ao registrar uso", error.message);
}
