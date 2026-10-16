import { createServerFn } from "@tanstack/react-start";
import { extrairJSON, normalizarCorrecao, type Correcao } from "./enem.schema";

export type { Competencia, Correcao } from "./enem.schema";

const SYSTEM = `Você é um corretor oficial experiente do ENEM. Avalie a redação dissertativo-argumentativa segundo as 5 competências do INEP (cada uma de 0 a 200, em múltiplos de 40):
1. Domínio da norma padrão da língua escrita.
2. Compreensão da proposta e aplicação de conceitos de várias áreas para desenvolver o tema, dentro do tipo dissertativo-argumentativo.
3. Selecionar, relacionar, organizar e interpretar informações em defesa de um ponto de vista.
4. Conhecimento dos mecanismos linguísticos para a argumentação (coesão).
5. Proposta de intervenção detalhada (agente, ação, meio/modo, finalidade, detalhamento) respeitando os direitos humanos.
Seja rigoroso e justo como a banca. Se o texto tiver menos de 7 linhas ou fugir totalmente do tema, atribua nota 0 e explique.
Responda APENAS com JSON válido no formato:
{"notaTotal":number,"competencias":[{"numero":1,"titulo":string,"nota":number,"comentario":string}],"pontosFortes":[string],"melhorias":[string],"trechosCorrigidos":[{"original":string,"sugestao":string,"motivo":string}],"resumo":string}
Escreva tudo em português do Brasil. Inclua até 6 trechosCorrigidos com erros reais do texto.`;

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

export const corrigirRedacao = createServerFn({ method: "POST" })
  .inputValidator((d: { tema: string; texto: string }) => {
    if (!d?.texto || d.texto.trim().length < 50) {
      throw new Error("Escreva sua redação (mínimo de 50 caracteres).");
    }
    if (d.texto.length > 8000) throw new Error("Texto muito longo.");
    return { tema: (d.tema ?? "").slice(0, 300), texto: d.texto };
  })
  .handler(async ({ data }): Promise<Correcao> => {
    const { exigirUsuario } = await import("./auth.server");
    const { verificarAcesso, registrarUso } = await import("./acesso.server");

    const user = await exigirUsuario();
    await verificarAcesso(user.id);

    const key = process.env["GEMINI_API_KEY"];
    if (!key) throw new Error("Serviço de correção indisponível.");

    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env["GEMINI_MODEL"] ?? "gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `Tema: ${data.tema || "(não informado — avalie a coerência com o tema que o texto aparenta abordar)"}\n\nRedação:\n${data.texto}`,
          },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Muitas correções agora. Tente de novo em instantes.");
    if (!res.ok) {
      console.error("Gemini respondeu", res.status, await res.text());
      throw new Error("Não foi possível corrigir agora. Tente novamente.");
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";

    let correcao: Correcao;
    try {
      correcao = normalizarCorrecao(extrairJSON(raw));
    } catch (e) {
      console.error("Resposta da IA inválida", e);
      throw new Error("A correção veio num formato inesperado. Tente novamente.");
    }

    await registrarUso(user.id);
    return correcao;
  });
