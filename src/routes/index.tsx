import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { corrigirRedacao, type Correcao } from "@/lib/enem.functions";
import { temasProvaveis, temasAnteriores, areas } from "@/lib/previsoes";
import { propostasRedacao, questoes } from "@/lib/exercicios";
import { Acesso } from "@/components/acesso";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nota Mil — Corretor de Redação ENEM 2026" },
      {
        name: "description",
        content:
          "Corrija sua redação do ENEM pelas 5 competências e veja os temas e conteúdos que podem cair no ENEM 2026.",
      },
      { property: "og:title", content: "Nota Mil — Corretor de Redação ENEM 2026" },
      {
        property: "og:description",
        content: "Correção por competências e previsões para o ENEM 2026.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [aba, setAba] = useState<"corrigir" | "previsoes" | "treinar">("corrigir");
  const [tema, setTema] = useState("");
  return (
    <div className="min-h-screen">
      <header className="mx-auto max-w-5xl px-5 pt-10 pb-6">
        <p className="font-[family-name:var(--font-hand)] text-2xl text-accent -rotate-2">
          ENEM 2026
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-5xl md:text-6xl font-semibold tracking-tight">
          Rumo à <span className="marker">nota mil</span>.
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Cole sua redação e receba a correção pelas 5 competências — e descubra o que tem mais
          chance de cair na prova.
        </p>
        <nav className="mt-8 flex flex-wrap gap-2 border-b">
          {(
            [
              ["corrigir", "Corrigir redação"],
              ["previsoes", "O que pode cair"],
              ["treinar", "Treinar"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setAba(k)}
              className={`-mb-px border-b-2 px-4 py-2 font-medium transition-colors ${aba === k ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {l}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-5 pb-20">
        {aba === "corrigir" && (
          <Acesso>
            {(recarregar) => <Corretor key={tema} temaInicial={tema} aoCorrigir={recarregar} />}
          </Acesso>
        )}
        {aba === "previsoes" && <Previsoes />}
        {aba === "treinar" && (
          <Treinar
            usarTema={(t) => {
              setTema(t);
              setAba("corrigir");
              window.scrollTo(0, 0);
            }}
          />
        )}
      </main>
    </div>
  );
}

function Treinar({ usarTema }: { usarTema: (t: string) => void }) {
  const [materia, setMateria] = useState("Todas");
  const [resp, setResp] = useState<Record<number, number>>({});
  const materias = ["Todas", ...Array.from(new Set(questoes.map((q) => q.materia)))];
  const lista = questoes
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => materia === "Todas" || q.materia === materia);
  const acertos = Object.entries(resp).filter(([i, r]) => questoes[+i]?.correta === r).length;
  return (
    <div className="space-y-12">
      <section>
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
          Propostas de redação
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha um tema, escreva e envie para correção.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {propostasRedacao.map((p) => (
            <div key={p.tema} className="paper flex flex-col rounded-lg p-5">
              <p className="font-[family-name:var(--font-display)] text-lg">{p.tema}</p>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.apoio}</p>
              <button
                onClick={() => usarTema(p.tema)}
                className="mt-4 self-start rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Escrever sobre este tema
              </button>
            </div>
          ))}
        </div>
      </section>
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
            Questões para treinar
          </h2>
          <span className="font-[family-name:var(--font-hand)] text-2xl text-accent">
            {acertos} de {Object.keys(resp).length} acertos
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {materias.map((m) => (
            <button
              key={m}
              onClick={() => setMateria(m)}
              className={`rounded-full border px-3 py-1 text-sm ${materia === m ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="mt-5 space-y-4">
          {lista.map(({ q, i }) => {
            const r = resp[i];
            return (
              <div key={i} className="paper rounded-lg p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {q.materia}
                </p>
                <p className="mt-1 font-medium">{q.enunciado}</p>
                <div className="mt-3 grid gap-2">
                  {q.alternativas.map((a, j) => {
                    const estado =
                      r === undefined
                        ? ""
                        : j === q.correta
                          ? "border-success bg-success/10"
                          : j === r
                            ? "border-destructive bg-destructive/10"
                            : "opacity-60";
                    return (
                      <button
                        key={j}
                        disabled={r !== undefined}
                        onClick={() => setResp({ ...resp, [i]: j })}
                        className={`rounded-md border px-3 py-2 text-left text-sm transition hover:bg-muted ${estado}`}
                      >
                        <b>{"ABCDE"[j]})</b> {a}
                      </button>
                    );
                  })}
                </div>
                {r !== undefined && (
                  <p className="mt-3 text-sm">
                    <b className={r === q.correta ? "text-success" : "text-destructive"}>
                      {r === q.correta ? "Acertou! " : "Errou. "}
                    </b>
                    {q.explicacao}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Corretor({
  temaInicial,
  aoCorrigir,
}: {
  temaInicial: string;
  aoCorrigir: () => Promise<void>;
}) {
  const corrigir = useServerFn(corrigirRedacao);
  const [tema, setTema] = useState(temaInicial);
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [res, setRes] = useState<Correcao | null>(null);

  async function enviar() {
    setErro("");
    setLoading(true);
    setRes(null);
    try {
      setRes(await corrigir({ data: { tema, texto } }));
      void aoCorrigir();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao corrigir.");
    } finally {
      setLoading(false);
    }
  }
  const linhas = texto.split("\n").length;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      <section className="paper rounded-lg p-6">
        <label className="text-sm font-medium text-muted-foreground">Tema da redação</label>
        <input
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          placeholder="Ex.: Perspectivas acerca do envelhecimento na sociedade brasileira"
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="mt-5 flex items-end justify-between">
          <label className="text-sm font-medium text-muted-foreground">Sua redação</label>
          <span className="text-xs text-muted-foreground">
            {linhas} linhas · {texto.length} caracteres
          </span>
        </div>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={18}
          placeholder="Escreva ou cole seu texto aqui…"
          className="lined mt-1 w-full resize-y rounded-md border bg-card px-4 py-0 font-[family-name:var(--font-display)] text-lg outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={enviar}
          disabled={loading}
          className="mt-5 w-full rounded-md bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Corrigindo… (pode levar alguns segundos)" : "Corrigir minha redação"}
        </button>
        {erro && <p className="mt-3 text-sm text-destructive">{erro}</p>}
      </section>

      <section>
        {!res && !loading && (
          <div className="rounded-lg border-2 border-dashed p-8 text-center text-muted-foreground">
            <p className="font-[family-name:var(--font-hand)] text-3xl text-accent">
              sua nota aparece aqui
            </p>
            <p className="mt-2 text-sm">Avaliação nas 5 competências do INEP, de 0 a 1000.</p>
          </div>
        )}
        {loading && <div className="h-64 animate-pulse rounded-lg bg-muted" />}
        {res && <Resultado r={res} />}
      </section>
    </div>
  );
}

function Resultado({ r }: { r: Correcao }) {
  return (
    <div className="space-y-6">
      <div className="paper rounded-lg p-6">
        <p className="text-sm text-muted-foreground">Nota estimada</p>
        <p className="font-[family-name:var(--font-hand)] text-7xl leading-none text-accent -rotate-3">
          {r.notaTotal}
        </p>
        <p className="mt-3 text-sm">{r.resumo}</p>
      </div>
      <div className="paper rounded-lg p-6 space-y-4">
        {r.competencias.map((c) => (
          <div key={c.numero}>
            <div className="flex justify-between text-sm font-semibold">
              <span>
                C{c.numero} · {c.titulo}
              </span>
              <span className="text-accent">{c.nota}/200</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${(c.nota / 200) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{c.comentario}</p>
          </div>
        ))}
      </div>
      {r.trechosCorrigidos.length > 0 && (
        <div className="paper rounded-lg p-6">
          <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold">
            Correções no texto
          </h3>
          <ul className="mt-3 space-y-3 text-sm">
            {r.trechosCorrigidos.map((t, i) => (
              <li key={i}>
                <span className="text-destructive line-through">{t.original}</span>
                {" → "}
                <span className="font-semibold text-success">{t.sugestao}</span>
                <p className="text-muted-foreground">{t.motivo}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Lista titulo="Pontos fortes" itens={r.pontosFortes} />
        <Lista titulo="Como melhorar" itens={r.melhorias} />
      </div>
    </div>
  );
}

function Lista({ titulo, itens }: { titulo: string; itens: string[] }) {
  return (
    <div className="paper rounded-lg p-5">
      <h4 className="font-semibold">{titulo}</h4>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {itens.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

function Previsoes() {
  return (
    <div className="space-y-12">
      <section>
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
          Temas de redação em alta
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Apostas baseadas no padrão do INEP e nos debates atuais — não são temas oficiais.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {temasProvaveis.map((t) => (
            <div key={t.tema} className="paper rounded-lg p-5">
              <div className="flex justify-between text-xs font-semibold uppercase tracking-wide">
                <span className="text-muted-foreground">{t.eixo}</span>
                <span className={t.chance === "Alta" ? "text-accent" : "text-primary"}>
                  Chance {t.chance}
                </span>
              </div>
              <p className="mt-2 font-[family-name:var(--font-display)] text-lg">{t.tema}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
          Conteúdos que mais caem
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {areas.map((a) => (
            <div key={a.nome} className="paper rounded-lg p-5">
              <h3 className="font-semibold">{a.nome}</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {a.itens.map((i) => (
                  <li key={i}>✓ {i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
          Temas dos últimos anos
        </h2>
        <ul className="mt-4 divide-y rounded-lg border">
          {temasAnteriores.map((t) => (
            <li key={t.ano} className="flex gap-4 p-4">
              <span className="font-[family-name:var(--font-hand)] text-2xl text-accent">
                {t.ano}
              </span>
              <span>{t.tema}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
