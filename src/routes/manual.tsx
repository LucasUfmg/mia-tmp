import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Calculator,
  CalendarRange,
  ChartNoAxesCombined,
  CircleDollarSign,
  Clock,
  Download,
  FileSpreadsheet,
  Fuel,
  Info,
  LayoutGrid,
  MapPinned,
  PieChart,
  ReceiptText,
  RefreshCw,
  Scale,
  ShoppingBag,
  Store,
} from "lucide-react";
import { Sidebar } from "@/components/redeflex/Sidebar";
import { Button } from "@/components/ui/button";

const title = "Manual da Plataforma — BI e Contábil | RedeFlex";
const description =
  "Manual completo do RedeFlex: painel operacional diário e mensal, mapa da rede, indicadores, DRE gerencial, despesas e lançamentos contábeis.";

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

const blocosOperacionais = [
  {
    icon: CalendarRange,
    titulo: "Comparativo por período",
    texto:
      "Na visão diária, compara cada dia da última semana com o mesmo dia da semana anterior, sempre no mesmo horário. Na mensal, compara o acumulado até hoje com o mesmo número de dias dos meses anteriores.",
  },
  {
    icon: BarChart3,
    titulo: "Projeção do mês",
    texto:
      "Projeta o fechamento de combustível e produtos pelo ritmo já realizado. A projeção indica onde a rede chegará no último dia se mantiver o desempenho atual.",
  },
  {
    icon: LayoutGrid,
    titulo: "Indicadores principais",
    texto:
      "Resume volume vendido, Resultado Bruto, LB%, margem média por litro, ticket médio de combustível e ticket médio de volume para o período e os postos selecionados.",
  },
  {
    icon: Fuel,
    titulo: "Rede Combustíveis",
    texto:
      "Apresenta faturamento e eficiência da pista: M/LT, LB%, TMV e TMC. O total de abastecimentos considerado aparece junto aos indicadores.",
  },
  {
    icon: ShoppingBag,
    titulo: "Rede Produtos",
    texto:
      "Mostra faturamento da conveniência, ticket médio de produtos e quantidade de cupons para acompanhar se a loja evolui junto com o movimento da pista.",
  },
  {
    icon: PieChart,
    titulo: "Distribuição das vendas",
    texto:
      "Os gráficos mostram a participação de cada combustível e categoria de produto. Passe o mouse ou toque em uma fatia para ver os detalhes daquela categoria.",
  },
];

const indices = [
  ["M/LT", "Margem por litro", "Resultado Bruto ÷ litros vendidos"],
  ["RB", "Resultado Bruto", "Faturamento − custo da mercadoria vendida"],
  ["LB%", "Lucro bruto percentual", "Resultado Bruto ÷ faturamento × 100"],
  ["TMV", "Ticket médio de volume", "Litros vendidos ÷ número de abastecimentos"],
  ["TMC", "Ticket médio de combustível", "Faturamento de combustível ÷ abastecimentos"],
  ["TMP", "Ticket médio de produtos", "Faturamento de produtos ÷ cupons de produtos"],
];

const bigNumbers = [
  ["Receita bruta", "Total das vendas importadas automaticamente do BI."],
  ["CMV", "Custo das mercadorias vendidas, também importado do BI."],
  ["Result. Operacional Bruto", "Receita bruta menos CMV."],
  ["Despesas totais", "Descontos, falta/sobra e despesas lançadas para o período."],
  ["EBITDA", "Resultado Operacional Bruto menos Despesas totais."],
  ["Resultado final", "EBITDA ajustado pelas demais receitas, bônus e rateios."],
];

const despesas = [
  "Pessoal",
  "Operação/Administrativas",
  "Aluguel",
  "Taxas de Cartão",
  "Frete",
  "IRPJ e CSLL",
  "Tributárias",
  "Despesas Financeiras",
  "Despesas Não Operacionais",
];

function SectionTitle({ icon, children }: { icon: typeof BookOpen; children: ReactNode }) {
  const Icon = icon;
  return (
    <h2 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
      <Icon className="h-5 w-5 text-brand" />
      {children}
    </h2>
  );
}

function ManualPage() {
  const [isPrinting, setIsPrinting] = useState(false);

  const handleDownload = () => {
    setIsPrinting(true);
    document.body.classList.add("printing");
    window.setTimeout(() => {
      window.print();
      document.body.classList.remove("printing");
      setIsPrinting(false);
    }, 200);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="print:hidden">
        <Sidebar />
      </div>

      <main className="min-w-0 flex-1 px-4 py-5 sm:px-5 sm:py-6 md:px-8 md:py-8 print:px-0 print:py-0">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline lg:hidden print:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao painel
        </Link>

        <header className="mt-4 border-b border-border pb-8 lg:mt-0 print:mt-0">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand">
                <BookOpen className="h-3.5 w-3.5" />
                Manual da plataforma
              </span>
              <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Como usar o RedeFlex</h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Guia da Visão Geral operacional e da área Contábil: entenda os filtros, indicadores,
                gráficos, mapa, DRE e lançamentos da rede de postos.
              </p>
            </div>
            <Button onClick={handleDownload} disabled={isPrinting} className="shrink-0 self-start print:hidden">
              <Download className="mr-2 h-4 w-4" />
              {isPrinting ? "Preparando…" : "Baixar manual"}
            </Button>
          </div>
        </header>

        <nav className="mt-6 flex flex-wrap gap-2 print:hidden" aria-label="Seções do manual">
          <a href="#visao-geral" className="rounded-full border border-border px-4 py-2 text-xs font-bold hover:bg-surface-muted">
            Visão Geral
          </a>
          <a href="#contabil" className="rounded-full border border-border px-4 py-2 text-xs font-bold hover:bg-surface-muted">
            Contábil
          </a>
          <a href="#lancamentos" className="rounded-full border border-border px-4 py-2 text-xs font-bold hover:bg-surface-muted">
            Lançamentos
          </a>
        </nav>

        <section id="visao-geral" className="mt-10 scroll-mt-6">
          <SectionTitle icon={ChartNoAxesCombined}>Visão Geral operacional</SectionTitle>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            A Visão Geral acompanha vendas de pista e loja durante o dia ou no acumulado do mês. Os
            números são atualizados automaticamente a partir da base dos postos.
          </p>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <article className="card-elevated min-w-0 p-5 sm:p-6">
              <h3 className="flex items-center gap-2 font-bold">
                <Clock className="h-4.5 w-4.5 text-brand" /> Visão diária (on-time)
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Mostra o que aconteceu hoje até o horário atual. As comparações respeitam o mesmo
                horário de corte, evitando comparar um dia parcial com outro já encerrado.
              </p>
            </article>
            <article className="card-elevated min-w-0 p-5 sm:p-6">
              <h3 className="flex items-center gap-2 font-bold">
                <CalendarRange className="h-4.5 w-4.5 text-brand" /> Visão mensal (acumulado)
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Soma do primeiro dia do mês até hoje e compara com a mesma quantidade de dias dos
                meses anteriores, mostrando tendência e ritmo de fechamento.
              </p>
            </article>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {blocosOperacionais.map((bloco) => (
              <article key={bloco.titulo} className="card-elevated min-w-0 p-5 sm:p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <bloco.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-bold">{bloco.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{bloco.texto}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-2">
          <article className="card-elevated min-w-0 p-5 sm:p-6">
            <h3 className="flex items-center gap-2 font-bold">
              <Store className="h-4.5 w-4.5 text-brand" /> Filtro de postos
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Selecione a rede inteira, um posto ou vários postos. Todos os indicadores, gráficos e
              comparações passam a considerar apenas a seleção aplicada.
            </p>
          </article>
          <article className="card-elevated min-w-0 p-5 sm:p-6">
            <h3 className="flex items-center gap-2 font-bold">
              <MapPinned className="h-4.5 w-4.5 text-brand" /> Mapa da rede
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Cada marcador representa um posto. A cor compara o M/LT do posto com a média da rede;
              ao abrir o marcador, aparecem volume, faturamento, resultado e tickets do período.
            </p>
          </article>
        </section>

        <section className="mt-10">
          <h3 className="text-lg font-bold">Como os índices operacionais são calculados</h3>
          <div className="card-elevated mt-4 min-w-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="bg-surface-muted text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    <th className="px-4 py-3 sm:px-6">Índice</th>
                    <th className="px-4 py-3 sm:px-6">Significado</th>
                    <th className="px-4 py-3 sm:px-6">Cálculo</th>
                  </tr>
                </thead>
                <tbody>
                  {indices.map(([sigla, nome, formula]) => (
                    <tr key={sigla} className="border-t border-border">
                      <td className="px-4 py-3 font-bold text-brand sm:px-6">{sigla}</td>
                      <td className="px-4 py-3 sm:px-6">{nome}</td>
                      <td className="px-4 py-3 text-muted-foreground sm:px-6">{formula}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="contabil" className="mt-14 scroll-mt-6 border-t border-border pt-10">
          <SectionTitle icon={Calculator}>Área Contábil</SectionTitle>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            A área Contábil transforma as vendas e despesas de cada posto em uma DRE gerencial. Use
            os filtros de posto, ano e mês e alterne entre o mês isolado e o acumulado do ano.
          </p>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <article className="card-elevated p-5">
              <h3 className="font-bold">Visão Geral</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Reúne os seis resultados principais, evolução da receita, composição das despesas,
                resultado mensal e as maiores contas do período.
              </p>
            </article>
            <article className="card-elevated p-5">
              <h3 className="font-bold">DRE Gerencial</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Abre cada linha da DRE por mês, com valor e análise vertical. Valores positivos
                aparecem em verde e negativos em vermelho.
              </p>
            </article>
            <article className="card-elevated p-5">
              <h3 className="font-bold">Comparativo entre Postos</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Ordena os postos por Resultado final, EBITDA, Receita, Despesas ou Margem e compara
                os principais percentuais lado a lado.
              </p>
            </article>
          </div>

          <h3 className="mt-9 text-lg font-bold">Os seis números principais</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {bigNumbers.map(([nome, explicacao], index) => (
              <article key={nome} className="card-elevated flex min-w-0 gap-4 p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-extrabold text-brand">
                  {index + 1}
                </span>
                <div>
                  <h4 className="font-bold">{nome}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{explicacao}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <article className="card-elevated p-5 sm:p-6">
              <h3 className="flex items-center gap-2 font-bold">
                <FileSpreadsheet className="h-4.5 w-4.5 text-brand" /> Leitura da DRE
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                A coluna Valor mostra o total da rubrica. AV é a análise vertical: o valor da linha
                dividido pela Receita bruta. Selecione um ou mais meses para comparar as colunas.
              </p>
            </article>
            <article className="card-elevated p-5 sm:p-6">
              <h3 className="flex items-center gap-2 font-bold">
                <Scale className="h-4.5 w-4.5 text-brand" /> Consolidação da rede
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Sem posto selecionado, os valores representam a rede. Ao selecionar postos, o painel
                soma somente os escolhidos e recalcula resultados, percentuais e comparações.
              </p>
            </article>
          </div>
        </section>

        <section id="lancamentos" className="mt-14 scroll-mt-6 border-t border-border pt-10">
          <SectionTitle icon={ReceiptText}>Lançamentos e despesas</SectionTitle>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <article className="card-elevated p-5 sm:p-6">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand">Primeiro passo</span>
              <h3 className="mt-2 text-lg font-bold">Lançar despesas</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Escolha o posto e o mês. Receita de vendas e custo vêm do BI, aparecem em azul e não
                podem ser alterados. Preencha as despesas e salve; EBITDA, EBIT, Receita líquida e
                Lucro líquido são atualizados no lançamento do mesmo posto e mês.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {despesas.map((item) => (
                  <span key={item} className="rounded-full bg-surface-muted px-3 py-1.5 text-xs font-semibold">
                    {item}
                  </span>
                ))}
              </div>
              <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                Se ainda não houver valores salvos, os campos editáveis podem vir preenchidos pela base histórica da DRE.
              </p>
            </article>

            <article className="card-elevated p-5 sm:p-6">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand">Segundo passo</span>
              <h3 className="mt-2 text-lg font-bold">Lançar dados contábeis</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Selecione o mesmo posto e mês para complementar o lançamento. Receita líquida,
                EBITDA e EBIT aparecem em azul quando vierem do cálculo de despesas. Os demais dados
                contábeis são informados pelo usuário e podem ser atualizados ao salvar novamente.
              </p>
              <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <li>Lucro líquido</li>
                <li>Alíquota efetiva</li>
                <li>Patrimônio líquido médio</li>
                <li>Dívida bruta</li>
                <li>Caixa e equivalentes</li>
                <li>WACC</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-2">
          <article className="card-elevated p-5 sm:p-6">
            <h3 className="flex items-center gap-2 font-bold">
              <CircleDollarSign className="h-4.5 w-4.5 text-brand" /> Origem dos valores
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Receita e CMV acompanham o BI: no mês atual, são acumulados até o momento; em meses
              encerrados, consideram o mês completo. As despesas e demais dados são lançados por posto e mês.
            </p>
          </article>
          <article className="card-elevated p-5 sm:p-6">
            <h3 className="flex items-center gap-2 font-bold">
              <RefreshCw className="h-4.5 w-4.5 text-brand" /> Atualização e edição
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Ao trocar de posto ou mês, aguarde o carregamento terminar antes de editar. Salvar
              novamente o mesmo posto e mês atualiza o registro existente, sem criar duplicidade.
            </p>
          </article>
        </section>

        <div className="mt-10 print:hidden">
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