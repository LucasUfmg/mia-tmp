import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  CalendarRange,
  Clock,
  Download,
  Fuel,
  Info,
  LayoutGrid,
  PieChart,
  ShoppingBag,
  Store,
} from "lucide-react";
import { Sidebar } from "@/components/redeflex/Sidebar";
import { useState } from "react";

const title = "Manual do BI RedeFlex — como ler o painel e os índices";
const description =
  "Guia rápido do BI RedeFlex: visão diária e mensal (on-time), o que cada bloco do painel mostra e como M/LT, TMC, TMV, TMP, Resultado Bruto e LB% são calculados.";

export const Route = createFileRoute("/manual")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ManualPage,
});

const blocos = [
  {
    icon: CalendarRange,
    titulo: "1. Comparativo por período",
    texto:
      "Na visão diária, compara cada dia da última semana com o mesmo dia da semana anterior, sempre no mesmo horário. Na visão mensal, compara o acumulado do mês com o mesmo número de dias dos meses anteriores. A seta verde indica alta, a vermelha indica queda.",
  },
  {
    icon: BarChart3,
    titulo: "2. Projeção do mês",
    texto:
      "Projeta o fechamento do mês para combustível e para produtos, usando o ritmo já realizado. Serve para responder: mantendo esse ritmo, onde a rede chega no último dia do mês?",
  },
  {
    icon: LayoutGrid,
    titulo: "3. Faixa de indicadores",
    texto:
      "Logo abaixo do comparativo, quatro indicadores-resumo do período e do posto selecionados: volume vendido em litros, Resultado Bruto (com o LB% ao lado), margem média M/LT e ticket médio TMC (com o TMV ao lado).",
  },
  {
    icon: Fuel,
    titulo: "4. Rede Combustíveis",
    texto:
      "Faturamento de combustíveis em destaque e, abaixo, os índices de eficiência: M/LT (margem por litro), LB%, TMV (litros por abastecimento) e TMC (valor médio por abastecimento). O rodapé mostra o número de abastecimentos considerados.",
  },
  {
    icon: ShoppingBag,
    titulo: "5. Rede Produtos",
    texto:
      "Faturamento da loja de conveniência, o TMP (valor médio por cupom) e a quantidade de cupons. É onde se vê se a conveniência acompanha o movimento da pista.",
  },
  {
    icon: PieChart,
    titulo: "6. Distribuição (gráficos de pizza)",
    texto:
      "Participação de cada combustível e de cada categoria de produto no total. Passando o mouse (ou tocando) em uma fatia, aparecem os detalhes dela — no combustível, também M/LT e Resultado Bruto.",
  },
];

const indices = [
  {
    sigla: "M/LT",
    nome: "Margem por litro",
    formula: "Resultado Bruto ÷ litros vendidos",
    exemplo: "R$ 42.000 de resultado ÷ 100.000 L = R$ 0,42 por litro",
  },
  {
    sigla: "RB",
    nome: "Resultado Bruto",
    formula: "Faturamento − custo da mercadoria vendida",
    exemplo: "R$ 620.000 de venda − R$ 578.000 de custo = R$ 42.000",
  },
  {
    sigla: "LB%",
    nome: "Lucro bruto percentual",
    formula: "Resultado Bruto ÷ faturamento × 100",
    exemplo: "R$ 42.000 ÷ R$ 620.000 = 6,8%",
  },
  {
    sigla: "TMV",
    nome: "Ticket médio de volume",
    formula: "litros vendidos ÷ nº de abastecimentos",
    exemplo: "100.000 L ÷ 4.700 abastecimentos = 21,3 L por abastecimento",
  },
  {
    sigla: "TMC",
    nome: "Ticket médio de combustível",
    formula: "faturamento de combustível ÷ nº de abastecimentos",
    exemplo: "R$ 620.000 ÷ 4.700 = R$ 131,9 por abastecimento",
  },
  {
    sigla: "TMP",
    nome: "Ticket médio de produtos",
    formula: "faturamento de produtos ÷ nº de cupons de produtos",
    exemplo: "R$ 48.000 ÷ 1.600 cupons = R$ 30,00 por cupom",
  },
];

function ManualPage() {
  const [isPrinting, setIsPrinting] = useState(false);

  const handleDownload = () => {
    setIsPrinting(true);
    document.body.classList.add("printing");
    setTimeout(() => {
      window.print();
      document.body.classList.remove("printing");
      setIsPrinting(false);
    }, 200);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar className="print:hidden" />

      <main className="min-w-0 flex-1 px-4 py-5 sm:px-5 sm:py-6 md:px-8 md:py-8 print:px-0 print:py-0">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline lg:hidden print:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao painel
        </Link>

        <header className="mt-4 lg:mt-0 print:mt-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand">
                <BookOpen className="h-3.5 w-3.5" />
                Manual da plataforma
              </span>
              <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                Como ler o BI RedeFlex
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                O BI acompanha a operação da rede de postos em tempo quase real: os dados vêm direto do
                sistema de pista e da loja, e o painel se atualiza sozinho durante o dia. Este guia
                explica as duas visões, o que cada bloco mostra e como cada índice é calculado.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isPrinting}
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-brand-foreground transition hover:brightness-105 print:hidden"
              aria-label="Baixar manual em PDF"
            >
              <Download className="h-4 w-4" />
              {isPrinting ? "Preparando..." : "Baixar manual"}
            </button>
          </div>
        </header>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <article className="card-elevated min-w-0 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Clock className="h-4.5 w-4.5 text-brand" />
              Visão diária (on-time)
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Mostra o que já aconteceu hoje até este minuto. Toda comparação usa o mesmo horário de
              corte no dia anterior ou na semana anterior — assim as 10h de hoje são comparadas com
              as 10h daquele dia, e não com o dia fechado. É a visão para decidir durante o turno.
            </p>
          </article>
          <article className="card-elevated min-w-0 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <CalendarRange className="h-4.5 w-4.5 text-brand" />
              Visão mensal (acumulado)
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Mostra o acumulado do primeiro dia do mês até hoje, comparado com o mesmo número de
              dias dos meses anteriores. É a visão de evolução: mostra tendência, ritmo e se o mês
              caminha para bater o anterior.
            </p>
          </article>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">O que cada parte mostra</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {blocos.map((b) => (
              <article key={b.titulo} className="card-elevated min-w-0 p-5 sm:p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <b.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-bold">{b.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.texto}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Como os índices são calculados
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Todos partem de três informações simples: quanto foi vendido, quanto custou e quantas
            vendas aconteceram.
          </p>

          <div className="card-elevated mt-5 min-w-0 overflow-hidden">
            <div className="w-full max-w-full overflow-x-auto [scrollbar-width:thin]">
              <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="bg-surface-muted text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    <th className="whitespace-nowrap px-3 py-2.5 sm:px-6">Índice</th>
                    <th className="whitespace-nowrap px-3 py-2.5 sm:px-6">Conta</th>
                    <th className="whitespace-nowrap px-3 py-2.5 sm:px-6">Exemplo</th>
                  </tr>
                </thead>
                <tbody>
                  {indices.map((i) => (
                    <tr key={i.sigla} className="border-t border-border align-top">
                      <td className="px-3 py-3 sm:px-6">
                        <span className="block font-bold text-brand">{i.sigla}</span>
                        <span className="block text-xs text-muted-foreground">{i.nome}</span>
                      </td>
                      <td className="px-3 py-3 font-semibold sm:px-6">{i.formula}</td>
                      <td className="px-3 py-3 text-muted-foreground sm:px-6">{i.exemplo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-border px-4 pt-2 pb-2 text-[11px] text-muted-foreground sm:hidden">
              Arraste a tabela para o lado para ver os exemplos.
            </p>
            <p className="flex items-start gap-2 border-t border-border bg-surface-muted px-4 py-3 text-xs text-muted-foreground sm:items-center sm:px-6">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 sm:mt-0" />
              Os valores do exemplo são ilustrativos. No painel, cada índice usa os dados reais do
              período e do posto selecionados.
            </p>
          </div>
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-2">
          <article className="card-elevated min-w-0 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Store className="h-4.5 w-4.5 text-brand" />
              Filtro de posto
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              No topo do painel é possível ver a REDE inteira ou um posto específico. Ao escolher um
              posto, todos os blocos e índices passam a considerar apenas ele — inclusive as
              comparações e a projeção.
            </p>
          </article>
          <article className="card-elevated min-w-0 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Clock className="h-4.5 w-4.5 text-brand" />
              Atualização
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              O indicador ao lado do filtro mostra o horário da última atualização. O painel
              recarrega os dados automaticamente, sem precisar sair da tela.
            </p>
          </article>
        </section>

        <div className="mt-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-brand-foreground transition hover:brightness-105"
          >
            <ArrowLeft className="h-4 w-4" />
            Ir para o painel
          </Link>
        </div>
      </main>
    </div>
  );
}
