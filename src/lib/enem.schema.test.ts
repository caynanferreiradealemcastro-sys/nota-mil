import { describe, expect, it } from "vitest";
import { extrairJSON, normalizarCorrecao } from "./enem.schema";

function comp(numero: number, nota: unknown) {
  return { numero, titulo: `C${numero}`, nota, comentario: "ok" };
}

describe("normalizarCorrecao", () => {
  it("recalcula o total e arredonda para passos de 40", () => {
    const r = normalizarCorrecao({
      notaTotal: 1000,
      competencias: [comp(1, 150), comp(2, 190), comp(3, 160), comp(4, 40), comp(5, 0)],
    });
    expect(r.competencias.map((c) => c.nota)).toEqual([160, 200, 160, 40, 0]);
    expect(r.notaTotal).toBe(560);
  });

  it("limita notas fora da faixa", () => {
    const r = normalizarCorrecao({
      competencias: [comp(1, 999), comp(2, -50), comp(3, "120"), comp(4, 80), comp(5, 80)],
    });
    expect(r.competencias.map((c) => c.nota)).toEqual([200, 0, 120, 80, 80]);
  });

  it("ordena por número e preenche listas ausentes", () => {
    const r = normalizarCorrecao({
      competencias: [comp(5, 40), comp(3, 40), comp(1, 40), comp(4, 40), comp(2, 40)],
    });
    expect(r.competencias.map((c) => c.numero)).toEqual([1, 2, 3, 4, 5]);
    expect(r.pontosFortes).toEqual([]);
    expect(r.trechosCorrigidos).toEqual([]);
  });

  it("rejeita resposta sem as 5 competências", () => {
    expect(() => normalizarCorrecao({ competencias: [comp(1, 40)] })).toThrow();
  });

  it("rejeita competências repetidas", () => {
    expect(() =>
      normalizarCorrecao({
        competencias: [comp(1, 40), comp(1, 40), comp(3, 40), comp(4, 40), comp(5, 40)],
      }),
    ).toThrow();
  });
});

describe("extrairJSON", () => {
  it("aceita JSON dentro de cerca de código", () => {
    expect(extrairJSON('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });
});
