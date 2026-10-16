import { createFileRoute } from "@tanstack/react-router";

type Envelope = { secret?: unknown; event?: unknown; data?: unknown };

export const Route = createFileRoute("/api/cakto-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { assinaturaValida, segredoDoCorpoValido } = await import("@/lib/cakto.logic");
        const { processarEvento } = await import("@/lib/cakto.server");
        const { getConfig } = await import("@/lib/config.server");

        const segredo = getConfig().caktoWebhookSecret;
        if (!segredo) {
          console.error("CAKTO_WEBHOOK_SECRET não configurado");
          return new Response("indisponível", { status: 503 });
        }

        // A assinatura é calculada sobre os bytes exatos recebidos: leia o corpo cru primeiro.
        const corpoCru = await request.text();
        let envelope: Envelope;
        try {
          envelope = JSON.parse(corpoCru) as Envelope;
        } catch {
          return new Response("corpo inválido", { status: 400 });
        }

        const assinatura = request.headers.get("x-cakto-signature");
        const timestamp = request.headers.get("x-cakto-timestamp");
        const autentico =
          assinatura && timestamp
            ? assinaturaValida({ corpoCru, timestamp, assinatura, segredo })
            : segredoDoCorpoValido(envelope.secret, segredo);
        if (!autentico) return new Response("não autorizado", { status: 401 });

        const evento = typeof envelope.event === "string" ? envelope.event : "";
        // Webhook V2 manda uma lista de pedidos; a V1 manda um objeto.
        const itens = Array.isArray(envelope.data) ? envelope.data : [envelope.data];

        try {
          for (const item of itens) {
            if (item && typeof item === "object") {
              await processarEvento(evento, item as Parameters<typeof processarEvento>[1]);
            }
          }
        } catch (e) {
          console.error("Webhook da Cakto falhou", e);
          // A Cakto não reenvia sozinha após uma resposta de erro: reenvie pelo painel (Histórico de Eventos).
          return new Response("erro", { status: 500 });
        }
        return new Response("ok", { status: 200 });
      },
    },
  },
});
