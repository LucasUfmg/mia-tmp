# Seleção múltipla de postos + identidade visual da logo

## 1. Selecionar vários postos e ver os valores agrupados

O filtro do topo passa de "um posto por vez" para **multisseleção**:

- Novo controle (popover com busca + checkboxes) substituindo o Select atual.
- Opção "Rede (todos os postos)" continua no topo; ao marcar postos individuais ela é desmarcada automaticamente.
- Rótulo do botão: "Rede", "Nome do posto" (1 selecionado) ou "3 postos selecionados".
- Ações rápidas: "Selecionar todos", "Limpar".
- Clicar em "Ver no painel" no balão do mapa passa a **adicionar** o posto à seleção (com Rede ativa, troca para só aquele posto).

Todos os números do painel (KPIs, Rede Combustíveis, Rede Produtos, gráficos de pizza, comparativo e projeção) passam a somar os postos selecionados. Importante: os índices agregados são **ponderados**, não médias simples — M/LT = Resultado Bruto somado ÷ litros somados; TMC/TMV/TMP e LB seguem a mesma lógica sobre os totais do grupo, exatamente como já é feito para a Rede.

O texto de escopo (ex.: "Rede · abastecimentos de hoje até 11:07") mostra os nomes quando forem poucos, ou "3 postos" quando forem muitos.

## 2. Cores da logo

Nova paleta derivada da logo (azul-marinho + amarelo/âmbar), substituindo o teal atual:

- Azul da logo como cor institucional: sidebar, títulos de seção, botões.
- Amarelo/âmbar como cor de destaque: ícones dos KPIs, realces, estado ativo das abas Diário/Mensal.
- Paleta dos gráficos de pizza reconstruída em tons de azul + âmbar, mantendo contraste entre fatias.
- Mapa: fundo claro continua igual; verde/amarelo/vermelho dos ícones permanecem (são semáforo de desempenho, não marca).
- Contraste AA verificado em texto sobre azul e sobre amarelo.

## Detalhes técnicos

- `redeflex.functions.ts`: os schemas de `getIndicators`, `getCategorias`, `getFuelSeries`, `getProductSeries`, `getFuelMonths` e `getProductMonths` passam a aceitar `ibms: string[]` (opcional) além do `ibm` atual.
- `redeflex-mongo.server.ts`: os filtros `{ ibm }` viram `{ ibm: { $in: [...] } }` quando houver lista; sem lista, comportamento de rede inalterado. A chave de cache inclui a lista ordenada.
- `redeflex-dashboard.ts`: `Selecao` passa a ser `string[]` (vazio/`REDE_ID` = rede); `groupByDate` filtra por conjunto de postos no comparativo.
- Novo `MultiStoreFilter.tsx` (Popover + Command + Checkbox do shadcn) substituindo `NetworkFilter.tsx`; estado em `src/routes/index.tsx` passa a array e entra na `queryKey`.
- Cores: apenas tokens em `src/styles.css` (`--brand`, `--brand-soft`, `--sidebar`, `--chart-*`, `--accent`) em oklch; componentes seguem usando tokens semânticos, sem cores fixas.
