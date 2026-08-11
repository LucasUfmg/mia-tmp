# Ajuste de responsividade mobile do painel

Em 375px o painel estoura a largura da tela (o conteúdo ocupa 573px, gerando rolagem lateral) e a marca desaparece porque a barra lateral é escondida. A landing da Mia (`/agente`) já está correta em mobile — o ajuste é no painel.

## Problemas confirmados em 375px

- O bloco de topo (filtro "Visualizar" + status de atualização) é mais largo que a tela: o seletor de posto tem largura fixa de 300px e o texto "Última atualização" não quebra.
- A tabela do comparativo semanal corta as colunas "Produto (R$)" e sua variação — só aparecem Dia, Galonagem e Variação.
- Sem barra lateral, o celular não mostra logo nem o nome do produto.
- Cartões com padding e ícones de desktop (ícone de 64px, padding de 28px, número em 5xl) deixam pouco espaço para os valores.
- O gráfico de pizza tem 240px fixos e o tooltip abre com 240px centralizado, podendo sair da tela.

## O que será ajustado

1. **Cabeçalho mobile**: adicionar um topo compacto (visível só abaixo de `lg`) com o logo RedeFlex e o subtítulo, já que a barra lateral fica oculta.
2. **Barra de controles**: empilhar em coluna no mobile; o seletor de posto passa a ocupar 100% da largura (largura fixa só a partir de `sm`), o rótulo "Visualizar" fica acima do campo, e o texto de última atualização quebra em duas linhas.
3. **Abas Diária/Mensal**: ficam em linha própria abaixo do título, com os botões dividindo a largura.
4. **Tabela do comparativo**: reduzir o padding lateral no mobile e manter rolagem horizontal com uma dica visual, para que Produto e Variação fiquem acessíveis.
5. **Cartões (KPIs, Rede Combustíveis/Produtos, Projeção)**: padding, tamanho de ícone e escala de tipografia menores no mobile, crescendo a partir de `sm`/`md`; garantir `min-w-0` e quebra de números longos.
6. **Gráficos de pizza**: donut responsivo (SVG com largura fluida limitada a 240px) e tooltip que não ultrapassa a largura do cartão; legenda abaixo do gráfico no mobile.
7. **Verificação**: nova captura em 375px e checagem de que a largura do documento passa a ser igual à da janela (sem rolagem lateral), além de conferência em 768px para não regredir o desktop.

## Detalhes técnicos

- Arquivos afetados: `src/routes/index.tsx` (cabeçalho, grid de KPIs, novo topo mobile), `src/components/redeflex/NetworkFilter.tsx`, `LiveStatus.tsx`, `PeriodTabs.tsx`, `WeeklyOverview.tsx`, `NetworkCard.tsx`, `DistributionCard.tsx`.
- Uso do padrão `grid-cols-[minmax(0,1fr)_auto]` + `min-w-0` + `shrink-0` nas linhas que misturam texto e widgets.
- Somente classes utilitárias e marcação — nenhuma mudança em consultas, cálculos ou dados.
