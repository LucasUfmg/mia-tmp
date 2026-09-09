# Receita de vendas e custo vindos do painel (somente leitura)

No "Calcular EBITDA", as linhas **(+) Receita de vendas** e **(-) Custo** deixam de ser digitadas: passam a vir direto dos dados de venda do posto, somando combustível + loja, com o acumulado do mês (do dia 1 até hoje, quando é o mês corrente; mês inteiro quando o mês já encerrou).

## Como fica na tela

- Os dois campos aparecem preenchidos com o valor do posto/mês, em modo de leitura (não editáveis, com aparência de campo travado).
- Uma etiqueta ao lado indica a origem: "Do painel — acumulado até dd/mm" (mês corrente) ou "Do painel — mês fechado".
- Enquanto os valores carregam, os campos mostram um estado de carregamento; os totais (Receita líquida, Resultado bruto, EBITDA, EBIT) recalculam sozinhos quando chegam.
- Se o posto/mês não tiver movimento no período, os dois campos mostram 0 com o aviso "sem vendas registradas neste período".
- Trocar o posto ou o mês no formulário recarrega os dois valores.
- Todas as outras linhas continuam digitadas normalmente pelo usuário.
- Ao salvar, receita e custo gravados são sempre os do painel, nunca um valor digitado. O "Usar no lançamento contábil" continua funcionando igual.
- Na opção "Rede (consolidado)", os valores somam todos os postos.

## Detalhes técnicos

- Nova server function `getReceitaCusto` em `src/lib/redeflex.functions.ts` (ou em `contabil.functions.ts` chamando o mesmo caminho): entrada `{ mes: "YYYY-MM-01", ibm?: string }`, saída `{ receita, custo, parcial, ate }`.
  - Reaproveita `getIndicadores(dates, ibm, cutoffMinutes?, desde)` de `redeflex-mongo.server.ts`, que já devolve `receita` e `lucroBruto` de combustível e produto; `custo = receita - lucroBruto` somando as duas frentes.
  - Mês corrente: `desde` = dia 1, `dates` = [hoje], `cutoffMinutes` = corte on-time → `parcial: true`.
  - Mês encerrado: `desde` = dia 1, `dates` = [último dia do mês], sem corte → `parcial: false`.
  - Mantém o `comCache`/`chaveDeCache` já usado pelas outras funções.
- `EbitdaDialog.tsx`: `useQuery` com chave `["contabil","ebitda-bi", ibm, mes]`; `receitaVendas` e `custo` saem do estado do formulário e passam a vir da query, com `Input` `readOnly` + `disabled`-styling; `calcularEbitda` recebe esses valores mesclados. Os campos travados são excluídos do `onChange`.
- `salvarEbitda` continua com o mesmo schema; o diálogo envia os valores do painel. Sem mudança de banco, pois `contabil_ebitda` já tem `receita_vendas` e `custo`.
- `LancamentoDialog` não muda: segue lendo o cálculo salvo.
