const PRECO_PADRAO = 9.9;

export function getConfig() {
  const fim = process.env["DATA_FIM"] ?? "2026-11-15";
  // Vale até o fim do último dia, no horário de Brasília.
  const fimEm = new Date(`${fim}T23:59:59-03:00`);
  // O preço real é o da oferta na Cakto; este valor só aparece na tela. Mantenha igual.
  const preco = Number(process.env["PRECO_SEMANAL"] ?? PRECO_PADRAO);
  return {
    fimEm,
    preco: Number.isFinite(preco) && preco > 0 ? preco : PRECO_PADRAO,
    limiteDiario: 15,
    caktoCheckoutUrl: process.env["CAKTO_CHECKOUT_URL"] ?? "",
    caktoWebhookSecret: process.env["CAKTO_WEBHOOK_SECRET"] ?? "",
    caktoProductId: process.env["CAKTO_PRODUCT_ID"] ?? "",
  };
}
