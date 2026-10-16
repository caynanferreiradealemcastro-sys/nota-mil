import { createHmac, timingSafeEqual } from "node:crypto";

// Lógica pura da Cakto (sem banco), fácil de testar.

export const TOLERANCIA_SEGUNDOS = 5 * 60;
const SEMANA_MS = 7 * 24 * 60 * 60 * 1000;
const FOLGA_MS = 12 * 60 * 60 * 1000; // folga para atrasos de processamento

function iguais(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

// Cakto: X-Cakto-Signature = "v1=" + HMAC-SHA256(segredo, `${timestamp}.${corpo cru}`) em hex.
export function assinaturaValida(args: {
  corpoCru: string;
  timestamp: string;
  assinatura: string;
  segredo: string;
  agoraSeg?: number;
}): boolean {
  const ts = Number(args.timestamp);
  if (!Number.isFinite(ts)) return false;
  const agora = args.agoraSeg ?? Date.now() / 1000;
  if (Math.abs(agora - ts) > TOLERANCIA_SEGUNDOS) return false;

  const esperado = createHmac("sha256", args.segredo)
    .update(`${args.timestamp}.`)
    .update(args.corpoCru)
    .digest("hex");

  // O header pode trazer mais de uma assinatura separada por vírgula (transição de versão).
  return args.assinatura
    .split(",")
    .map((s) => s.trim())
    .some((s) => iguais(s, `v1=${esperado}`));
}

// Alternativa documentada: o mesmo segredo vai no campo "secret" do corpo.
export function segredoDoCorpoValido(recebido: unknown, segredo: string): boolean {
  return typeof recebido === "string" && iguais(recebido, segredo);
}

// Vencimento = data do pagamento + 7 dias + folga. É idempotente: o mesmo aviso repetido
// dá o mesmo resultado, e uma renovação (uma semana depois) empurra o vencimento para frente.
export function novoVencimento(
  atual: Date | null,
  pagoEmISO: string | null | undefined,
  agora: Date = new Date(),
): Date {
  const pago = pagoEmISO ? new Date(pagoEmISO) : agora;
  const base = Number.isNaN(pago.getTime()) ? agora : pago;
  const limitada = new Date(Math.min(base.getTime(), agora.getTime()));
  const candidato = new Date(limitada.getTime() + SEMANA_MS + FOLGA_MS);
  return atual && atual.getTime() > candidato.getTime() ? atual : candidato;
}

export function normalizarEmail(email: unknown): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}
