# Corrigir a Receita bruta do Contábil

## O que foi encontrado

- A Receita bruta de outubro aparece como R$ 6.163. Esse valor é só a "Venda de Serviços" digitada (R$ 31.843 × 6/31 dias). As vendas de combustível e de mercadorias do BI não entraram.
- Motivo 1: as consultas ao BI feitas pelo Contábil estão estourando o tempo e sendo canceladas. O registro do servidor mostra vários cancelamentos. Hoje o painel faz 48 consultas pesadas ao abrir: 24 meses × 2, uma do mês fechado e outra do "mesmo período".
- Motivo 2: quando o BI não responde, o painel usa valores antigos guardados no cadastro (CMV de R$ 49,6 mi da planilha antiga). Por isso o CMV parece certo e a receita não.
- Motivo 3: a fórmula só usa a receita total de reserva quando a soma de combustível + mercadorias + serviços dá zero. Como há serviços digitados, a soma nunca dá zero e a receita fica só com os serviços.

## O que muda

1. **Consulta ao BI mais leve:** em vez de uma consulta por posto e mês, faz uma única consulta por posto para o ano inteiro, já separada por mês. Ela traz combustível, mercadorias, custos, litros e abastecimentos, com e sem o corte do "mesmo período". Isso dá poucas consultas no lugar de 48, sem cancelamentos.
2. **Nunca usar valores antigos:** Receita e CMV vêm só do BI. Enquanto o BI carrega, os cards mostram "carregando…" em vez de números errados. Se o BI falhar, aparece um aviso com o botão "Tentar novamente".
3. **Fórmula corrigida:** Receita bruta = combustível + mercadorias do BI + serviços digitados, sempre.
4. Conferir no preview que a receita de outubro da Rede fica perto do faturamento acumulado do mês mostrado na Visão Geral.

## Detalhes técnicos

- `src/lib/redeflex-mongo.server.ts`: nova `getIndicadoresPorMes(ibm?, desde, ate, corte?)` com `$group` por `$dateToString %Y-%m` em `gasMonitor.abastecimentos` e `sales.vendas` (itens `iTip='0'`). O corte por dia/minuto usa `$dayOfMonth`/minuto do dia, como em `matchMesesMesmoPeriodo`.
- `src/lib/receita-custo.server.ts` / `listarReceitaCusto`: agrupa os pares por ibm, faz uma consulta por ibm (concorrência limitada), com cache, e devolve o mesmo formato por par. Também devolve um sinal de falha em vez de engolir o erro.
- `src/lib/ebitda.ts`: `receitaBruta = (vendaCombustivel + vendaMercadorias || receitaVendasBi) + vendaServicosManual`. `custo` só do BI.
- `src/routes/contabil.tsx`: zera `receitaVendas`/`custo` salvos antes de mesclar e repassa o estado carregando/erro do BI ao `DreDashboard`, que mostra "carregando…" nos cards de BI.
- Validar com typecheck, conferir os registros do servidor sem cancelamentos e conferir os valores no preview.
