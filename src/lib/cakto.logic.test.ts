import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  assinaturaValida,
  normalizarEmail,
  novoVencimento,
  segredoDoCorpoValido,
} from "./cakto.logic";

const SEGREDO = "b3f1a9c2-7b4d-4a8e-9f01-2c6d5b8a4e37";
const CORPO = JSON.stringify({ secret: SEGREDO, event: "purchase_approved", data: { id: "1" } });

function assinar(corpo: string, ts: string, segredo = SEGREDO) {
  return `v1=${createHmac("sha256", segredo).update(`${ts}.${corpo}`).digest("hex")}`;
}

describe("assinaturaValida", () => {
  const agora = 1_800_000_000;
  const ts = String(agora);

  it("aceita assinatura correta", () => {
    expect(
      assinaturaValida({
        corpoCru: CORPO,
        timestamp: ts,
        assinatura: assinar(CORPO, ts),
        segredo: SEGREDO,
        agoraSeg: agora,
      }),
    ).toBe(true);
  });

  it("rejeita corpo adulterado", () => {
    expect(
      assinaturaValida({
        corpoCru: CORPO + " ",
        timestamp: ts,
        assinatura: assinar(CORPO, ts),
        segredo: SEGREDO,
        agoraSeg: agora,
      }),
    ).toBe(false);
  });

  it("rejeita segredo errado", () => {
    expect(
      assinaturaValida({
        corpoCru: CORPO,
        timestamp: ts,
        assinatura: assinar(CORPO, ts, "outro"),
        segredo: SEGREDO,
        agoraSeg: agora,
      }),
    ).toBe(false);
  });

  it("rejeita entrega antiga (replay)", () => {
    expect(
      assinaturaValida({
        corpoCru: CORPO,
        timestamp: ts,
        assinatura: assinar(CORPO, ts),
        segredo: SEGREDO,
        agoraSeg: agora + 600,
      }),
    ).toBe(false);
  });

  it("rejeita timestamp inválido", () => {
    expect(
      assinaturaValida({
        corpoCru: CORPO,
        timestamp: "abc",
        assinatura: "v1=00",
        segredo: SEGREDO,
        agoraSeg: agora,
      }),
    ).toBe(false);
  });

  it("aceita lista de assinaturas separadas por vírgula", () => {
    const lista = `v2=zzzz, ${assinar(CORPO, ts)}`;
    expect(
      assinaturaValida({
        corpoCru: CORPO,
        timestamp: ts,
        assinatura: lista,
        segredo: SEGREDO,
        agoraSeg: agora,
      }),
    ).toBe(true);
  });
});

describe("segredoDoCorpoValido", () => {
  it("compara o segredo do corpo", () => {
    expect(segredoDoCorpoValido(SEGREDO, SEGREDO)).toBe(true);
    expect(segredoDoCorpoValido("errado", SEGREDO)).toBe(false);
    expect(segredoDoCorpoValido(undefined, SEGREDO)).toBe(false);
  });
});

describe("novoVencimento", () => {
  const agora = new Date("2026-10-20T12:00:00Z");
  const DIA = 24 * 60 * 60 * 1000;

  it("vence 7 dias (+12h) depois do pagamento", () => {
    const v = novoVencimento(null, "2026-10-20T11:00:00Z", agora);
    expect(v.getTime()).toBe(
      new Date("2026-10-20T11:00:00Z").getTime() + 7 * DIA + 12 * 60 * 60 * 1000,
    );
  });

  it("é idempotente: o mesmo aviso repetido não soma tempo", () => {
    const a = novoVencimento(null, "2026-10-20T11:00:00Z", agora);
    const b = novoVencimento(a, "2026-10-20T11:00:00Z", agora);
    expect(b.getTime()).toBe(a.getTime());
  });

  it("uma renovação semanal empurra o vencimento", () => {
    const a = novoVencimento(null, "2026-10-20T11:00:00Z", agora);
    const depois = new Date("2026-10-27T11:00:00Z");
    const b = novoVencimento(a, "2026-10-27T11:00:00Z", depois);
    expect(b.getTime()).toBeGreaterThan(a.getTime());
  });

  it("data de pagamento inválida usa o momento atual", () => {
    const v = novoVencimento(null, "lixo", agora);
    expect(v.getTime()).toBe(agora.getTime() + 7 * DIA + 12 * 60 * 60 * 1000);
  });

  it("não aceita pagamento no futuro", () => {
    const v = novoVencimento(null, "2030-01-01T00:00:00Z", agora);
    expect(v.getTime()).toBe(agora.getTime() + 7 * DIA + 12 * 60 * 60 * 1000);
  });
});

describe("normalizarEmail", () => {
  it("coloca em minúsculas e tira espaços", () => {
    expect(normalizarEmail("  Aluno@Email.COM ")).toBe("aluno@email.com");
    expect(normalizarEmail(null)).toBe("");
  });
});
