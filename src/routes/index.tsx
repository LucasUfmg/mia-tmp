import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Database, Sparkles } from "lucide-react";
import postoAcesso from "@/assets/posto-acesso.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const title = "Portal da Mia";
const description =
  "Entre ou crie sua conta para falar com a Mia, agente contábil e financeira que acompanha em tempo real a operação do seu posto.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Acesso,
});

type Etapa = "entrar" | "cadastro" | "boas-vindas" | "erp" | "credenciais";
const ERPS = [
  { id: "LBC", nome: "LBC", desc: "Gestão para postos LBC" },
  { id: "Linx", nome: "Linx (Totvs)", desc: "Linx Postos / Totvs" },
  { id: "WebPosto", nome: "WebPosto", desc: "Sistema WebPosto" },
];
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function Acesso() {
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState<Etapa>("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [erro, setErro] = useState("");
  const [erp, setErp] = useState("");
  const [erpLogin, setErpLogin] = useState("");
  const [erpSenha, setErpSenha] = useState("");

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("mia_portal_usuario") ?? "null");
      if (u?.email) setEmail(u.email);
    } catch {}
  }, []);

  const ir = (e: Etapa) => {
    setErro("");
    setEtapa(e);
  };

  const entrar = (ev: FormEvent) => {
    ev.preventDefault();
    if (!emailOk(email) || !senha) return setErro("Informe e-mail e senha válidos.");
    let n = email.split("@")[0] ?? "";
    try {
      const u = JSON.parse(localStorage.getItem("mia_portal_usuario") ?? "null");
      if (u?.email === email && u.nome) n = u.nome;
    } catch {}
    setNome(n);
    localStorage.setItem("mia_portal_usuario", JSON.stringify({ nome: n, email }));
    ir("boas-vindas");
  };

  const cadastrar = (ev: FormEvent) => {
    ev.preventDefault();
    if (!nome.trim()) return setErro("Informe seu nome.");
    if (!emailOk(email)) return setErro("Informe um e-mail válido.");
    if (senha.length < 6) return setErro("A senha precisa ter ao menos 6 caracteres.");
    if (senha !== confirma) return setErro("As senhas não conferem.");
    localStorage.setItem("mia_portal_usuario", JSON.stringify({ nome: nome.trim(), email }));
    ir("boas-vindas");
  };

  const conectar = (ev: FormEvent) => {
    ev.preventDefault();
    if (!erpLogin || !erpSenha) return setErro("Informe login e senha do ERP.");
    // Credenciais do ERP não são guardadas (sem servidor nesta etapa).
    localStorage.setItem("mia_portal_erp", erp);
    setErpLogin("");
    setErpSenha("");
    navigate({ to: "/bi" });
  };

  const primeiroNome = nome.trim().split(" ")[0];

  return (
    <div className="grid min-h-screen grid-cols-1 bg-background text-foreground lg:grid-cols-2">
      {/* Foto — metade esquerda no desktop, faixa no topo no celular */}
      <div className="relative h-56 overflow-hidden sm:h-72 lg:h-auto">
        <img
          src={postoAcesso}
          alt="Posto de combustível moderno"
          width={1080}
          height={1920}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-verde/80 via-verde/25 to-transparent lg:bg-gradient-to-r lg:from-verde/30 lg:via-verde/10 lg:to-verde/40" />
        <div className="absolute bottom-5 left-5 right-5 text-white lg:bottom-12 lg:left-12">
          <h2 className="text-2xl font-bold drop-shadow-sm lg:text-4xl">
            Portal da Mia
          </h2>
          <p className="mt-1 max-w-sm text-sm text-white/85 lg:text-base">
            Sua agente contábil e financeira, em tempo real.
          </p>
        </div>
      </div>

      {/* Portal de acesso — metade direita, fundo claro */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl sm:p-8">
            {etapa === "entrar" && (
              <form onSubmit={entrar} className="space-y-4">
                <h1 className="text-2xl font-bold">Entrar</h1>
                <Campo id="email" label="E-mail" type="email" value={email} onChange={setEmail} />
                <Campo id="senha" label="Senha" type="password" value={senha} onChange={setSenha} />
                <Erro msg={erro} />
                <Button type="submit" className="w-full bg-verde text-verde-foreground hover:bg-verde/90">
                  Entrar
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Não tem conta?{" "}
                  <button type="button" onClick={() => ir("cadastro")} className="font-semibold text-gold hover:underline">
                    Criar conta
                  </button>
                </p>
              </form>
            )}

            {etapa === "cadastro" && (
              <form onSubmit={cadastrar} className="space-y-4">
                <h1 className="text-2xl font-bold">Criar conta</h1>
                <Campo id="nome" label="Nome" value={nome} onChange={setNome} />
                <Campo id="email" label="E-mail" type="email" value={email} onChange={setEmail} />
                <Campo id="senha" label="Senha" type="password" value={senha} onChange={setSenha} />
                <Campo id="confirma" label="Confirmar senha" type="password" value={confirma} onChange={setConfirma} />
                <Erro msg={erro} />
                <Button type="submit" className="w-full bg-verde text-verde-foreground hover:bg-verde/90">
                  Cadastrar
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Já tem conta?{" "}
                  <button type="button" onClick={() => ir("entrar")} className="font-semibold text-gold hover:underline">
                    Entrar
                  </button>
                </p>
              </form>
            )}

            {etapa === "boas-vindas" && (
              <div className="space-y-5 text-center">
                <Sparkles className="mx-auto h-10 w-10 text-verde" />
                <h1 className="text-2xl font-bold">Olá, {primeiroNome}!</h1>
                <p className="text-muted-foreground">
                  Eu sou a <strong className="text-foreground">Mia</strong>, sua agente contábil e financeira.
                  Acompanho em tempo real os dados da operação do seu posto.
                </p>
                <p className="text-sm text-muted-foreground">
                  Vamos fazer uma configuração rápida: preciso do acesso ao seu ERP.
                </p>
                <Button onClick={() => ir("erp")} className="w-full bg-verde text-verde-foreground hover:bg-verde/90">
                  Começar configuração
                </Button>
              </div>
            )}

            {etapa === "erp" && (
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gold">Passo 1 de 2</p>
                <h1 className="text-xl font-bold">Qual ERP seu posto usa?</h1>
                <div className="grid gap-3">
                  {ERPS.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => {
                        setErp(e.nome);
                        ir("credenciais");
                      }}
                      className="flex items-center gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:border-verde hover:bg-verde-soft/50"
                    >
                      <Database className="h-6 w-6 text-verde" />
                      <span>
                        <span className="block font-semibold">{e.nome}</span>
                        <span className="text-xs text-muted-foreground">{e.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {etapa === "credenciais" && (
              <form onSubmit={conectar} className="space-y-4">
                <button type="button" onClick={() => ir("erp")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" /> Trocar ERP
                </button>
                <p className="text-xs font-bold uppercase tracking-wider text-gold">Passo 2 de 2</p>
                <h1 className="text-xl font-bold">Acesso ao {erp}</h1>
                <Campo id="erp-login" label={`Login do ${erp}`} value={erpLogin} onChange={setErpLogin} />
                <Campo id="erp-senha" label={`Senha do ${erp}`} type="password" value={erpSenha} onChange={setErpSenha} />
                <Erro msg={erro} />
                <Button type="submit" className="w-full bg-verde text-verde-foreground hover:bg-verde/90">
                  Conectar
                </Button>
              </form>
            )}
          </div>

          <p className="mt-4 text-center text-[11px] text-muted-foreground/70">
            Modo de demonstração: nenhum dado de acesso é enviado ou guardado.
          </p>
        </div>
      </div>
    </div>
  );
}

function Campo(p: { id: string; label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={p.id}>{p.label}</Label>
      <Input id={p.id} type={p.type ?? "text"} value={p.value} onChange={(e) => p.onChange(e.target.value)} />
    </div>
  );
}

function Erro({ msg }: { msg: string }) {
  return msg ? <p className="text-sm text-destructive">{msg}</p> : null;
}
