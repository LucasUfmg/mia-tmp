# Destaque azul, números formatados e receita líquida divergente

## 1. Campos em azul claro

- Em "Calcular EBITDA": **Receita de vendas** e **Custo** (que vêm do painel) ganham fundo azul claro, borda azul e a etiqueta de origem na mesma cor.
- Em "Lançar dados contábeis": **Receita líquida**, **EBITDA** e **EBIT** ficam em azul claro quando existem valores vindos do cálculo de EBITDA daquele posto/mês.
- Um novo tom azul claro é adicionado à paleta do sistema (claro e escuro), sem alterar as cores atuais.

## 2. Números com ponto e vírgula

Todos os valores em dinheiro dos dois formulários passam a aparecer no padrão brasileiro, com ponto de milhar e vírgula de centavos (ex.: 25.637.207,81):

- Ao abrir os formulários, os campos já aparecem formatados.
- Enquanto o usuário digita, a formatação é aplicada automaticamente.
- Campos de porcentagem (alíquota, WACC) seguem com vírgula de decimal, sem milhar.
- Os valores gravados continuam sendo os mesmos números de hoje.

## 3. Receita líquida diferente entre as duas telas

Conferido no banco (posto REDE, set/2026):

```text
Cálculo de EBITDA salvo:  receita 28.027.912,62 - deduções 2.390.704,81
                          => receita líquida 25.637.207,81
Lançamento contábil salvo: receita líquida 16.241.327,00
```

Ou seja: o lançamento guarda uma **cópia antiga** da receita líquida. O cálculo de EBITDA usa a receita do painel, que cresce a cada dia do mês; quando o cálculo é refeito, o lançamento já gravado continua com o número anterior — e é esse número que aparece nos cards e na tabela.

Correção:

- Receita líquida, EBITDA e EBIT no lançamento passam a ser somente leitura (em azul claro) sempre que existir cálculo de EBITDA para aquele posto/mês, deixando claro que a origem é o cálculo.
- Ao salvar o cálculo de EBITDA, o lançamento daquele posto/mês é atualizado com os novos valores de receita líquida, EBITDA e EBIT — os demais campos do lançamento (patrimônio, dívida, caixa, alíquota, WACC, lucro líquido) permanecem intactos.
- Sem cálculo de EBITDA para o posto/mês, os três campos continuam editáveis como hoje.

## Detalhes técnicos

- `src/styles.css`: novos tokens `--info`, `--info-soft`, `--info-foreground` (azul claro) mapeados em `@theme` e no bloco `.dark`.
- Novo helper de moeda em `src/lib/contabil.ts` (ou `src/lib/ebitda.ts`): `formatarBR(n)` e `paraNumero(str)` compartilhados, com máscara aplicada no `onChange` dos inputs de `EbitdaDialog.tsx` e `LancamentoDialog.tsx` (substituindo as duas cópias locais de `texto`/`paraNumero`).
- `EbitdaDialog.tsx`: inputs travados usam `bg-info-soft border-info text-foreground`; etiqueta de origem em `text-info`.
- `LancamentoDialog.tsx`: `receitaLiquida`, `ebitda`, `ebit` renderizados com `readOnly` + estilo `info` quando `calculo` existe; `salvarLancamento` continua enviando os mesmos campos.
- Sincronização: em `salvarEbitda` (`src/lib/contabil.server.ts`), após o upsert em `contabil_ebitda`, fazer update dos campos `receita_liquida`, `ebitda`, `ebit` em `contabil_lancamentos` quando já houver linha para o mesmo `ibm`/`mes` (sem criar lançamento novo). Sem mudança de schema.
