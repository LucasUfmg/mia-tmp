import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Bot, MessageCircle, PieChart, Sparkle, Zap } from "lucide-react";
import { WhatsappMockup } from "@/components/flexia/WhatsappMockup";
import { capacidades, insights, passos } from "@/data/flexia";

const title = "Mia — a agente de IA para postos de combustíveis";
const description =
  "Pergunte no WhatsApp e receba na hora os números do seu posto: galonagem, margem M/LT, ticket médio, comparativo semanal e projeção do mês. Conheça a Mia.";
const url = "https://oficial.redeflexapp.com.br/agente";

export const Route = createFileRoute("/agente")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "product" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: url }],
  }),
  component: AgentePage,
});

function AgentePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-accent">
              <Bot className="h-5 w-5 text-brand" strokeWidth={2.4} />
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-extrabold tracking-tight">
                M<span className="text-brand">IA</span>
              </span>
              <span className="block text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/60">
                Inteligência em postos de combustíveis
              </span>
            </span>
          </span>
          <a
            href="#lista"
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:brightness-105"
          >
            Quero conhecer
          </a>
        </div>
      </header>

      <section className="bg-sidebar text-sidebar-foreground">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-12 md:px-8 lg:grid-cols-2 lg:pb-24 lg:pt-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand">
              <Sparkle className="h-3.5 w-3.5" />
              Novo produto
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight md:text-5xl lg:text-6xl">
              Pergunte. A <span className="text-brand">Mia</span> responde com os dados do seu
              posto.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-sidebar-foreground/70 md:text-lg">
              A primeira agente de inteligência artificial que lê o BI da sua rede e responde
              qualquer pergunta no WhatsApp — em segundos, com número, comparação e o próximo passo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#lista"
                className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-brand-foreground transition hover:brightness-105"
              >
                Entrar na lista de espera
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <a
                href="#conversa"
                className="inline-flex items-center gap-2 rounded-full border border-sidebar-border px-6 py-3 text-sm font-bold text-sidebar-foreground/90 transition hover:bg-sidebar-accent"
              >
                <MessageCircle className="h-4 w-4 text-brand" />
                Ver a conversa
              </a>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-sidebar-border pt-6">
              {[
                { k: "24/7", v: "Sempre disponível" },
                { k: "< 5s", v: "Resposta média" },
                { k: "0", v: "Relatórios para abrir" },
              ].map((s) => (
                <div key={s.k}>
                  <dt className="text-2xl font-extrabold text-brand">{s.k}</dt>
                  <dd className="mt-1 text-xs text-sidebar-foreground/60">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div id="conversa" className="lg:pl-6">
            <WhatsappMockup />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 lg:py-24">
        <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Como funciona</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {passos.map((p, i) => (
            <div key={p.titulo} className="card-elevated p-7">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-base font-extrabold text-brand">
                {i + 1}
              </span>
              <h3 className="mt-5 text-lg font-bold">{p.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface-muted py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">O que ele responde</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Tudo o que hoje exige abrir o painel — agora em uma pergunta de texto ou áudio.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {capacidades.map((c) => (
              <div key={c.titulo} className="card-elevated flex gap-4 p-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
                  <Zap className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h3 className="font-bold">{c.titulo}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand">
              <Bot className="h-3.5 w-3.5" />
              Insights proativos
            </span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight md:text-4xl">
              Ele avisa antes de você perguntar
            </h2>
            <p className="mt-4 text-muted-foreground">
              A Mia acompanha o ritmo de cada posto e manda mensagem quando algo sai do padrão.
            </p>
          </div>
          <div className="grid gap-4">
            {insights.map((it) => (
              <div key={it.titulo} className="card-elevated border-l-4 border-brand p-6">
                <h3 className="font-bold">{it.titulo}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{it.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="lista" className="bg-sidebar py-16 text-sidebar-foreground lg:py-24">
        <div className="mx-auto max-w-3xl px-5 text-center md:px-8">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Quer a Mia na sua rede?
          </h2>
          <p className="mt-4 text-sidebar-foreground/70">
            Estamos abrindo o lançamento para um grupo pequeno de redes. Fale com a gente e receba a
            demonstração com os dados do seu posto.
          </p>
          <a
            href="https://wa.me/5500000000000"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-sm font-bold text-brand-foreground transition hover:brightness-105"
          >
            <MessageCircle className="h-4 w-4" />
            Falar no WhatsApp
          </a>
        </div>
      </section>

      <footer className="border-t border-border bg-surface py-8">
        <div className="mx-auto max-w-6xl px-5 text-xs text-muted-foreground md:px-8">
          <p className="font-semibold">Mia — Inteligência em postos de combustíveis</p>
          <p className="mt-1">
            Página de demonstração da Mia. A conversa e os números exibidos são fictícios e
            servem apenas para ilustrar o produto.
          </p>
        </div>
      </footer>
    </div>
  );
}
