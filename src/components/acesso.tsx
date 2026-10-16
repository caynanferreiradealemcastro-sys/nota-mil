import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import {
  obterAcesso,
  criarAssinatura,
  type Acesso as EstadoServidor,
} from "@/lib/assinatura.functions";

function useSessao() {
  const [session, setSession] = useState<Session | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    void sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setPronto(true);
    });
    const { data } = sb.auth.onAuthStateChange((_evento, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  return { session, pronto };
}

function traduzirErro(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
  if (/already registered/i.test(msg)) return 'Este e-mail já tem conta. Use "Entrar".';
  if (/password should be at least/i.test(msg))
    return "A senha precisa ter pelo menos 6 caracteres.";
  if (/email not confirmed/i.test(msg)) return "Confirme seu e-mail pelo link que enviamos.";
  return msg;
}

function dinheiro(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Login() {
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro("");
    setInfo("");
    setLoading(true);
    try {
      const sb = getSupabase();
      if (modo === "entrar") {
        const { error } = await sb.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
      } else {
        const { data, error } = await sb.auth.signUp({ email, password: senha });
        if (error) throw error;
        if (!data.session) {
          setInfo("Enviamos um link de confirmação para o seu e-mail. Confirme e depois entre.");
        }
      }
    } catch (err) {
      setErro(traduzirErro(err instanceof Error ? err.message : "Não foi possível entrar."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={enviar} className="paper mx-auto max-w-md rounded-lg p-6">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
        {modo === "entrar" ? "Entre para corrigir sua redação" : "Crie sua conta"}
      </h2>
      <label className="mt-5 block text-sm font-medium text-muted-foreground">E-mail</label>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        className="mt-1 w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
      />
      <label className="mt-4 block text-sm font-medium text-muted-foreground">Senha</label>
      <input
        type="password"
        required
        minLength={6}
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        autoComplete={modo === "entrar" ? "current-password" : "new-password"}
        className="mt-1 w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        type="submit"
        disabled={loading}
        className="mt-5 w-full rounded-md bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Aguarde…" : modo === "entrar" ? "Entrar" : "Criar conta"}
      </button>
      {erro && <p className="mt-3 text-sm text-destructive">{erro}</p>}
      {info && <p className="mt-3 text-sm text-success">{info}</p>}
      <button
        type="button"
        onClick={() => {
          setModo(modo === "entrar" ? "criar" : "entrar");
          setErro("");
          setInfo("");
        }}
        className="mt-4 text-sm text-muted-foreground underline"
      >
        {modo === "entrar" ? "Ainda não tenho conta" : "Já tenho conta"}
      </button>
    </form>
  );
}

function Assinar({
  estado,
  email,
}: {
  estado: Extract<EstadoServidor, { logado: true }>;
  email: string;
}) {
  const criar = useServerFn(criarAssinatura);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function assinar() {
    setErro("");
    setLoading(true);
    try {
      const { url } = await criar();
      window.location.href = url;
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível iniciar a assinatura.");
      setLoading(false);
    }
  }

  const fim = new Date(estado.fimEm).toLocaleDateString("pt-BR");

  return (
    <div className="paper mx-auto max-w-md rounded-lg p-6 text-center">
      <p className="font-[family-name:var(--font-hand)] text-3xl text-accent">acesso semanal</p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold">
        {dinheiro(estado.preco)}
        <span className="text-base font-normal text-muted-foreground"> por semana</span>
      </p>
      <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
        <li>✓ Correção pelas 5 competências do INEP</li>
        <li>✓ Até {estado.limite} correções por dia</li>
        <li>✓ Disponível até {fim}</li>
      </ul>
      {estado.aguardando && (
        <p className="mt-4 rounded-md bg-muted p-3 text-sm text-muted-foreground">
          Estamos aguardando a confirmação do seu pagamento. Se você já pagou, o acesso é liberado
          sozinho em instantes, não precisa pagar de novo.
        </p>
      )}
      <button
        onClick={assinar}
        disabled={loading}
        className="mt-5 w-full rounded-md bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {loading
          ? "Abrindo o pagamento…"
          : estado.aguardando
            ? "Abrir o pagamento de novo"
            : "Assinar agora"}
      </button>
      {erro && <p className="mt-3 text-sm text-destructive">{erro}</p>}
      <p className="mt-3 text-xs text-muted-foreground">
        No pagamento, use o mesmo e-mail da sua conta (<b>{email}</b>). Depois de pagar, volte para
        esta página. Pagamento seguro pela Cakto.
      </p>
    </div>
  );
}

export function Acesso({ children }: { children: (recarregar: () => Promise<void>) => ReactNode }) {
  const { session, pronto } = useSessao();
  const verAcesso = useServerFn(obterAcesso);
  const [estado, setEstado] = useState<EstadoServidor | null>(null);
  const [falhou, setFalhou] = useState(false);
  const uid = session?.user.id;

  const carregar = useCallback(async () => {
    try {
      setEstado(await verAcesso());
      setFalhou(false);
    } catch {
      setFalhou(true);
    }
  }, [verAcesso]);

  useEffect(() => {
    if (uid) void carregar();
    else setEstado(null);
  }, [uid, carregar]);

  const semAcesso = !!estado && estado.logado && !estado.ativa;
  const aguardando = !!estado && estado.logado && estado.aguardando;

  // O aluno volta do pagamento: confere de novo assim que a aba ganha foco.
  useEffect(() => {
    if (!semAcesso) return;
    const aoVoltar = () => void carregar();
    window.addEventListener("focus", aoVoltar);
    return () => window.removeEventListener("focus", aoVoltar);
  }, [semAcesso, carregar]);

  // Enquanto o pagamento é confirmado (webhook da Cakto), consulta a cada 5 segundos.
  useEffect(() => {
    if (!semAcesso || !aguardando) return;
    let tentativas = 0;
    const t = setInterval(() => {
      tentativas += 1;
      if (tentativas > 60) clearInterval(t);
      else void carregar();
    }, 5000);
    return () => clearInterval(t);
  }, [semAcesso, aguardando, carregar]);

  if (!pronto) return <div className="h-48 animate-pulse rounded-lg bg-muted" />;
  if (!session) return <Login />;
  if (falhou) {
    return (
      <div className="paper mx-auto max-w-md rounded-lg p-6 text-center">
        <p className="text-sm text-destructive">Não foi possível carregar sua conta.</p>
        <button
          onClick={() => void carregar()}
          className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Tentar de novo
        </button>
      </div>
    );
  }
  if (!estado) return <div className="h-48 animate-pulse rounded-lg bg-muted" />;
  if (!estado.logado) return <Login />;
  if (estado.encerrado) {
    return (
      <div className="paper mx-auto max-w-md rounded-lg p-6 text-center">
        <p className="font-[family-name:var(--font-hand)] text-3xl text-accent">até a próxima!</p>
        <p className="mt-2 text-sm text-muted-foreground">O Nota Mil encerrou. Boa prova!</p>
      </div>
    );
  }
  if (!estado.ativa) return <Assinar estado={estado} email={session.user.email ?? ""} />;

  const ate = estado.venceEm ? new Date(estado.venceEm).toLocaleDateString("pt-BR") : "";

  return (
    <div>
      {children(carregar)}
      <p className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {estado.restantes} de {estado.limite} correções restantes hoje
          {ate ? ` · acesso até ${ate}` : ""}
        </span>
        <button onClick={() => void getSupabase().auth.signOut()} className="underline">
          Sair
        </button>
      </p>
    </div>
  );
}
