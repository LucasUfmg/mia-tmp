# Atualização automática (on-time) do BI

Hoje o dashboard busca os dados uma única vez, quando a página carrega, e o texto "Última atualização" é fixo no código. O objetivo é que a visualização acompanhe a atualização dos dados sem o usuário recarregar a página.

## 1. Atualização automática

- Os dados de galonagem, produto e projeção passam a ser buscados novamente em intervalo fixo (padrão: a cada 60 segundos), incluindo quando a aba volta ao foco ou a conexão retorna.
- A atualização é silenciosa: a tabela e os números continuam mostrando os valores atuais enquanto a nova leitura chega, sem tela em branco nem "Carregando…" piscando.
- Trocar o filtro (Rede / posto) continua buscando na hora, como já acontece.

## 2. Indicadores no topo

- "Última atualização" passa a mostrar o horário real da última leitura bem-sucedida (data e hora, fuso de São Paulo), atualizado a cada ciclo.
- Um ponto/indicador "ao vivo" ao lado do horário fica pulsando quando há uma atualização em andamento.
- O botão **Atualizar** passa a funcionar: força a releitura imediata e gira o ícone enquanto carrega.
- Se a leitura falhar, aparece um aviso discreto ("Falha ao atualizar — tentando novamente") e os últimos valores válidos permanecem na tela.

## 3. Quando a API real entrar

O intervalo de atualização e a lógica de indicador continuam iguais — só a camada de dados troca do payload atual para o `fetch` real. Se a API tiver um endpoint de "última carga", posso usar esse horário em vez do horário da leitura.

## Detalhes técnicos

- `src/routes/index.tsx`: nas duas `useQuery` do dashboard, adicionar `refetchInterval: 60_000`, `refetchOnWindowFocus: true`, `refetchIntervalInBackground: false`, `placeholderData: keepPreviousData` e `staleTime` curto; expor `isFetching`, `dataUpdatedAt`, `isError` e `refetch`.
- Novo `src/components/redeflex/LiveStatus.tsx`: horário formatado de `dataUpdatedAt` (`Intl.DateTimeFormat` pt-BR, `America/Sao_Paulo`), indicador pulsante ligado a `isFetching`, botão Atualizar chamando `refetch()`, e mensagem de erro quando `isError`.
- `WeeklyOverview.tsx`: usar `carregando` apenas para o primeiro carregamento (`comparativo.length === 0`), evitando trocar a tabela por "Carregando…" nas atualizações seguintes — comportamento que já existe e será mantido.
- Nenhuma mudança na transformação `IBM_data` nem na camada de dados.
