import { z } from "zod";

export type Competencia = { numero: number; titulo: string; nota: number; comentario: string };
export type Correcao = {
  notaTotal: number;
  competencias: Competencia[];
  pontosFortes: string[];
  melhorias: string[];
  trechosCorrigidos: { original: string; sugestao: string; motivo: string }[];
  resumo: string;
};

// Notas do INEP: 0 a 200, em passos de 40.
function arredondarNota(n: number): number {
  const limitada = Math.min(200, Math.max(0, n));
  return Math.round(limitada / 40) * 40;
}

const competenciaSchema = z.object({
  numero: z.coerce.number().int().min(1).max(5),
  titulo: z.string().trim().min(1),
  nota: z.coerce.number().finite().transform(arredondarNota),
  comentario: z.string().trim().default(""),
});

const correcaoSchema = z.object({
  competencias: z.array(competenciaSchema).length(5),
  pontosFortes: z.array(z.string()).default([]),
  melhorias: z.array(z.string()).default([]),
  trechosCorrigidos: z
    .array(z.object({ original: z.string(), sugestao: z.string(), motivo: z.string() }))
    .default([]),
  resumo: z.string().default(""),
});

export function extrairJSON(texto: string): unknown {
  const limpo = texto
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  return JSON.parse(limpo);
}

// Valida a resposta da IA e recalcula o total (não confiamos no notaTotal que ela devolve).
export function normalizarCorrecao(bruto: unknown): Correcao {
  const r = correcaoSchema.parse(bruto);
  if (new Set(r.competencias.map((c) => c.numero)).size !== 5) {
    throw new Error("Competências repetidas na resposta da IA.");
  }
  const competencias = [...r.competencias].sort((a, b) => a.numero - b.numero);
  return {
    notaTotal: competencias.reduce((soma, c) => soma + c.nota, 0),
    competencias,
    pontosFortes: r.pontosFortes.slice(0, 8),
    melhorias: r.melhorias.slice(0, 8),
    trechosCorrigidos: r.trechosCorrigidos.slice(0, 6),
    resumo: r.resumo,
  };
}
