# Troca de posto rápida em Lançar despesas

## Causa
Ao trocar de posto ou mês, a janela ainda busca Receita e CMV no BI (consulta lenta, feita em segundo plano) e trava os campos com "Carregando…" até a resposta chegar, mesmo sem mostrar esses valores.

## O que muda
- Trocar de posto ou mês fica instantâneo: os campos mostram na hora as despesas já salvas, ou aparecem vazios.
- Não aparece mais "Carregando…" na troca de posto ou mês.
- Receita e CMV do BI passam a ser buscados só ao clicar em "Salvar despesas". O botão mostra "Salvando…" enquanto isso.

## Detalhes técnicos
- `EbitdaDialog.tsx`: remover a `useQuery` de `getReceitaCusto`, o overlay e os `disabled` ligados a `buscandoPainel`. O mutation envia só as despesas.
- `salvarEbitda` (`contabil.functions.ts`): no servidor, obter receita/custo via a mesma lógica de `getReceitaCusto` (extrair para helper reutilizável em `redeflex.functions.ts`/`.server.ts`) antes do upsert. A sincronização com o lançamento continua como hoje.
