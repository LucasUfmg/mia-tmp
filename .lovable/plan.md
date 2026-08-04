# Dashboard RedeFlex — dados por data/posto e filtro no topo

O backend (repo `new-flex-micro-service-mongo-db`) já tem as 4 funções em `src/Services/DataService.ts`:

- `calcFuelByDates` / `calcProductByDates` → objeto `{ "2025-11-28": 8489.5 }` (rede inteira)
- `getVolumePorPosto` / `getItensTotaisPorPosto` → objeto `{ "00000000291901_2025-11-28": 8489.5 }` (por posto)

Não existe API publicada para consumir agora, então o dashboard fica com uma **camada de dados isolada** que hoje devolve um payload de exemplo no formato exato acima e amanhã só troca a implementação pelo `fetch` real — nenhum componente muda.

## 1. Função de transformação

Nova função utilitária que recebe o objeto da API e devolve o array de visualização:

```text
{ "00000000291901_2025-11-28": 8489.50 }
        ↓  quebra a chave no último "_"
[{ postoId: "00000000291901", data: "2025-11-28", valor: 8489.50 }]
```

- Chaves sem posto (formato só-data, das funções da rede) viram `postoId: "REDE"`.
- Valores inválidos/ausentes viram `0`; a ordenação final é por data crescente.

## 2. Filtro no topo (Select)

Um dropdown no topo da "Visão Geral da Rede":

- **Rede (todos os postos)** — usa `calcFuelByDates` / `calcProductByDates`
- **um posto por vez (IBM)** — usa `getVolumePorPosto` / `getItensTotaisPorPosto`, filtrando o `postoId` escolhido

A lista de postos é derivada dos IBMs únicos presentes nos dados recebidos. Trocar a opção recarrega galonagem e produto.

## 3. Dados atualizados

- **Comparativo semanal**: 4 datas do mesmo dia da semana (hoje e as 3 semanas anteriores), galonagem e produto vindos da camada de dados; a lógica de variação percentual com seta de alta/queda é mantida como está.
- **Projeção mensal**: acumulado do 1º dia do mês até a data atual, projetado para o mês cheio, também respeitando o filtro selecionado.
- Os demais blocos (big numbers da rede, gráficos de pizza) ficam como estão nesta etapa.

## Detalhes técnicos

- `src/lib/redeflex-transform.ts`: `parseKeyedSeries()`, `groupByDate()`, `extractPostoIds()`, `sameWeekdayDates()`, `projectMonth()` — puras e testáveis.
- `src/lib/redeflex-datasource.ts`: 4 funções espelhando as do `DataService` (`calcFuelsByDate`, `calcProductsByDate`, `getVolumePorPosto`, `getItensTotaisPorPosto`), assinatura `(dates: string[]) => Promise<Record<string, number>>`. Implementação atual = payload mock no formato da API, com um único ponto de troca marcado por comentário.
- Leitura via TanStack Query (`useQuery` com chave incluindo o filtro), já disponível no projeto.
- `src/components/redeflex/NetworkFilter.tsx`: Select (shadcn) com "Rede" + IBMs.
- `WeeklyOverview.tsx` passa a receber os dados por props em vez de importar constantes de `src/data/redeflex.ts`; as constantes de comparativo/projeção saem do arquivo de dados estáticos.
- Quando a API entrar no ar: informe a URL base, as rotas e o `use_token`; troco a implementação da camada de dados por uma server function (`createServerFn`) que faz o `fetch` e devolve o mesmo formato.
