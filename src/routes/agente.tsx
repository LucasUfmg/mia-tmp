import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Bot,
  Check,
  Clock,
  MessageCircle,
  Sparkle,
  TrendingDown,
  Zap,
} from "lucide-react";
import { WhatsappMockup } from "@/components/flexia/WhatsappMockup";
import { beneficiosPlano, capacidades, economias, faq, insights, passos } from "@/data/flexia";

const title = "Mia — IA no WhatsApp para postos de combustíveis | R$ 49,90 por telefone";
const description =
  "Saiba a margem, a galonagem e o ticket do seu posto em tempo real pelo WhatsApp. A Mia avisa antes do prejuízo acontecer. R$ 49,90 por telefone/mês, setup de R$ 4.990.";
const url = "https://mia-tmp.lovable.app/agente";

const WHATSAPP =
  "https://wa.me/5531992932316?text=" +
  encodeURIComponent("Olá! Quero conhecer a Mia para os meus postos.");

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

function CtaPrincipal({ label = "Quero a Mia nos meus postos" }: { label?: string }) {
  return (
    <a
      href={WHATSAPP}
      target="_blank"
      rel="noopener"
      className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-sm font-bold text-brand-foreground shadow-[0_12px_32px_-14px_oklch(0.82_0.148_88/60%)] transition hover:brightness-110"
    >
      <MessageCircle className="h-4 w-4" />
      {label}
      <ArrowUpRight className="h-4 w-4" />
    </a>
  );
}

function AgentePage() {
  return (
    <div className="mia-landing min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-sidebar/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-accent">
              <Bot className="h-5 w-5 text-brand" strokeWidth={2.4} />
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-extrabold tracking-tight">
                M<span className="text-brand">IA</span>
              </span>
              <span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Inteligência em postos de combustíveis
              </span>
            </span>
          </span>
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener"
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:brightness-110"
          >
            Falar no WhatsApp
          </a>
        </div>
      </header>

      <section className="border-b border-border bg-sidebar">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-12 md:px-8 lg:grid-cols-2 lg:pb-24 lg:pt-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand">
              <Sparkle className="h-3.5 w-3.5" />
              R$ 49,90 por telefone / mês
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight md:text-5xl lg:text-[3.4rem]">
              Cada centavo de margem que você descobre no dia 30{" "}
              <span className="gold-text">já virou prejuízo</span>.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              A Mia é a agente de IA que lê direto do banco de dados dos seus postos em tempo real e
              responde no WhatsApp: galonagem, margem M/LT, ticket médio, ranking e projeção. Você age
              no mesmo dia — não no fechamento.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <CtaPrincipal />
              <a
                href="#conversa"
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-bold transition hover:bg-sidebar-accent"
              >
                <MessageCircle className="h-4 w-4 text-brand" />
                Ver a conversa
              </a>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-6">
              {[
                { k: "< 5s", v: "Para saber sua margem" },
                { k: "24/7", v: "Sempre respondendo" },
                { k: "R$ 1,66", v: "Por dia, por telefone" },
              ].map((s) => (
                <div key={s.k}>
                  <dt className="text-2xl font-extrabold text-brand">{s.k}</dt>
                  <dd className="mt-1 text-xs text-muted-foreground">{s.v}</dd>
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
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand">
          <TrendingDown className="h-3.5 w-3.5" />
          Quanto o atraso custa
        </span>
        <h2 className="mt-5 max-w-3xl text-3xl font-extrabold tracking-tight md:text-4xl">
          Informação em tempo real paga a Mia no primeiro dia
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Números de referência de um posto médio. Um único alerta atendido cobre o ano inteiro de
          assinatura.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {economias.map((e) => (
            <div key={e.titulo} className="card-elevated brand-rail p-7 pl-8">
              <h3 className="text-xl font-extrabold text-brand">{e.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{e.texto}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          Investimento: <strong className="text-foreground">R$ 49,90 por telefone/mês</strong>. Uma
          rede com 5 gestores cadastrados paga R$ 249,50 — menos de 7% de uma única correção de margem.
        </p>
      </section>

      <section className="border-y border-border bg-surface-muted py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
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
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 lg:py-24">
        <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">O que ela responde</h2>
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
      </section>

      <section className="border-y border-border bg-surface-muted py-16 lg:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:px-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand">
              <Clock className="h-3.5 w-3.5" />
              Insights proativos
            </span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight md:text-4xl">
              Ela avisa antes de você perguntar
            </h2>
            <p className="mt-4 text-muted-foreground">
              A Mia acompanha o ritmo de cada posto e manda mensagem quando algo sai do padrão —
              enquanto ainda dá tempo de corrigir.
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

      <section id="preco" className="mx-auto max-w-6xl px-5 py-16 md:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="card-elevated relative overflow-hidden p-8 md:p-10">
            <span className="absolute right-6 top-6 rounded-full bg-brand-soft px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
              Lançamento
            </span>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Plano Mia
            </p>
            <p className="mt-4 flex items-end gap-2">
              <span className="text-5xl font-extrabold tracking-tight text-brand md:text-6xl">
                R$ 49,90
              </span>
              <span className="pb-2 text-sm text-muted-foreground">/ telefone / mês</span>
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              Setup único: R$ 4.990
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Setup com configuração e treinamento inclusos. Sem contrato de fidelidade.
            </p>
            <ul className="mt-7 grid gap-3">
              {beneficiosPlano.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span className="text-muted-foreground">{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <CtaPrincipal label="Assinar pelo WhatsApp" />
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              Perguntas frequentes
            </h2>
            <div className="mt-8 grid gap-5">
              {faq.map((f) => (
                <div key={f.p} className="border-b border-border pb-5">
                  <h3 className="font-bold">{f.p}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.r}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-sidebar py-16 lg:py-24">
        <div className="mx-auto max-w-3xl px-5 text-center md:px-8">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Sua rede em tempo real por <span className="gold-text">R$ 1,66 ao dia</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Fale agora no WhatsApp <strong className="text-foreground">(31) 99293-2316</strong> e
            receba uma demonstração da Mia com os dados dos seus postos.
          </p>
          <div className="mt-8 flex justify-center">
            <CtaPrincipal label="Quero minha demonstração" />
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-surface py-8">
        <div className="mx-auto max-w-6xl px-5 text-xs text-muted-foreground md:px-8">
          <p className="font-semibold text-foreground">
            Mia — Inteligência em postos de combustíveis
          </p>
          <p className="mt-1">
            WhatsApp (31) 99293-2316 · A conversa exibida é uma demonstração com números fictícios.
            Valores de economia são estimativas de referência e variam conforme a operação.
          </p>
        </div>
      </footer>
    </div>
  );
}
