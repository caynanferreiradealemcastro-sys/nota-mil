import { getConfig } from "./config.server";
import { normalizarEmail, novoVencimento } from "./cakto.logic";
import { supabaseAdmin } from "./supabase-admin.server";

export type PedidoCakto = {
  id?: string;
  status?: string;
  callback?: string | null;
  paidAt?: string | null;
  createdAt?: string | null;
  customer?: { email?: string | null } | null;
  subscription?: { id?: string | number | null } | null;
  product?: { id?: string; short_id?: string } | null;
};

// Eventos que confirmam um pagamento (primeira compra e renovações semanais).
const CONFIRMAM_PAGAMENTO = new Set(["purchase_approved", "subscription_renewed"]);
// Eventos que tiram o acesso na hora.
const REVOGAM = new Set(["refund", "chargeback"]);
// Eventos que só atualizam o status mostrado (o acesso vem do vencimento).
const INFORMATIVOS = new Set([
  "subscription_created",
  "subscription_paused",
  "subscription_resumed",
  "subscription_canceled",
  "subscription_late",
  "subscription_late_recovered",
  "subscription_renewal_refused",
]);

export type Resultado = "ok" | "ignorado" | "sem_usuario";

function produtoPermitido(p: PedidoCakto): boolean {
  const permitido = getConfig().caktoProductId;
  if (!permitido) return true;
  const ids = [p.product?.id, p.product?.short_id].filter(Boolean);
  return ids.length === 0 || ids.includes(permitido);
}

// Descobre de qual aluno é o pedido: token do link -> id da assinatura -> e-mail.
async function descobrirUsuario(p: PedidoCakto): Promise<string | null> {
  const db = supabaseAdmin();

  if (p.callback) {
    const { data } = await db
      .from("checkouts")
      .select("user_id")
      .eq("token", p.callback)
      .limit(1)
      .maybeSingle();
    if (data?.user_id) return String(data.user_id);
  }

  const subId = p.subscription?.id != null ? String(p.subscription.id) : "";
  if (subId) {
    const { data } = await db
      .from("assinaturas")
      .select("user_id")
      .eq("cakto_subscription_id", subId)
      .limit(1)
      .maybeSingle();
    if (data?.user_id) return String(data.user_id);
  }

  const email = normalizarEmail(p.customer?.email);
  if (email) {
    const { data: a } = await db
      .from("assinaturas")
      .select("user_id")
      .eq("email_cakto", email)
      .limit(1)
      .maybeSingle();
    if (a?.user_id) return String(a.user_id);

    const { data: c } = await db
      .from("checkouts")
      .select("user_id")
      .eq("email", email)
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (c?.user_id) return String(c.user_id);
  }
  return null;
}

export async function processarEvento(evento: string, pedido: PedidoCakto): Promise<Resultado> {
  const confirma = CONFIRMAM_PAGAMENTO.has(evento);
  const revoga = REVOGAM.has(evento);
  if (!confirma && !revoga && !INFORMATIVOS.has(evento)) return "ignorado";
  if (!produtoPermitido(pedido)) return "ignorado";
  if (confirma && pedido.status && pedido.status !== "paid") return "ignorado";

  const userId = await descobrirUsuario(pedido);
  if (!userId) {
    console.error("Cakto: não consegui ligar o pedido a nenhum aluno", {
      evento,
      pedido: pedido.id,
    });
    return "sem_usuario";
  }

  const db = supabaseAdmin();
  const { data: atual } = await db
    .from("assinaturas")
    .select("valid_until")
    .eq("user_id", userId)
    .maybeSingle();
  const venceAtual = atual?.valid_until ? new Date(String(atual.valid_until)) : null;

  let vencimento: Date | null = venceAtual;
  if (confirma) vencimento = novoVencimento(venceAtual, pedido.paidAt ?? pedido.createdAt);
  if (revoga) vencimento = new Date();

  const email = normalizarEmail(pedido.customer?.email);
  const subId = pedido.subscription?.id != null ? String(pedido.subscription.id) : "";

  const { error } = await db.from("assinaturas").upsert(
    {
      user_id: userId,
      status: evento,
      ...(subId ? { cakto_subscription_id: subId } : {}),
      ...(email ? { email_cakto: email } : {}),
      valid_until: vencimento ? vencimento.toISOString() : null,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(`Falha ao salvar assinatura: ${error.message}`);
  return "ok";
}
