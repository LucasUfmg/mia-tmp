# Corrigir o erro de escopo global do MongoDB no Cloudflare

## O problema, em uma frase
Em produção o app roda em um Worker do Cloudflare, e o driver do MongoDB executa operações proibidas (I/O, timers, valores aleatórios) no momento em que seu módulo é avaliado — não dentro da requisição. Resultado: toda atualização do dashboard falha.

O que já existe hoje: as consultas já são chamadas dentro dos handlers e o driver já é carregado por `import()` dinâmico (o build até gera um pedaço separado, `_libs/mongodb.mjs`). Mesmo assim o erro persiste em produção, o que indica que a avaliação do módulo do driver continua acontecendo fora do contexto de requisição aceito pelo runtime.

## Etapa 1 — Reproduzir localmente no runtime real (obrigatória antes de qualquer correção)
Hoje o erro só aparece depois de publicar. Vamos rodar o build de produção no mesmo runtime do Cloudflare dentro do sandbox (workerd/wrangler apontando para `dist/server`), chamar as consultas do dashboard e capturar o stack real do servidor.

Sem esse passo qualquer correção é adivinhação. O resultado dessa etapa decide entre 2A e 2B.

## Etapa 2A — Se a avaliação do driver puder ficar dentro do handler
- Isolar a criação do cliente em um único ponto carregado sob demanda e garantir que nada do driver seja alcançado pelo módulo de entrada do Worker (nem por tipos, nem por utilitários compartilhados).
- Ajustar o build para manter o driver em um pedaço separado, carregado apenas na primeira consulta, com "aquecimento" explícito dentro do handler.
- Reduzir o que o driver inicializa: pool mínimo, sem monitoramento/heartbeat extra e sem recursos opcionais (compressão, criptografia automática).
- Revalidar pela Etapa 1 até as seis áreas do dashboard trazerem dados reais.

## Etapa 2B — Se o runtime não permitir o driver (contingência)
Nesse caso o driver oficial simplesmente não roda no Worker, e insistir só consome tempo. Trocamos a conexão direta por acesso via HTTP:
- As funções de servidor passam a chamar um endpoint que executa as consultas fora do Worker (o micro-serviço Mongo que você já tem no GitHub é o candidato natural).
- Contrato de dados mantido igual ao atual, para o dashboard não mudar.
- Credenciais do banco saem do Worker e ficam apenas no serviço, o que também é mais seguro.

Se cairmos em 2B, aviso antes de implementar, com o que precisa existir no serviço.

## O que não muda
- Nada de visual do dashboard, nomes de métricas ou layout.
- A visão mensal continua desativada e comentada como está.
- Cache atual (servidor 5 min + persistência de sessão) preservado.

## Verificação final
1. Build de produção rodando no runtime do Cloudflare no sandbox, sem erro de escopo global.
2. As seis áreas do dashboard (comparativo semanal, projeção, indicadores da rede, produtos e as duas pizzas) com números reais.
3. Filtro entre REDE e posto individual funcionando.
4. Publicar e confirmar em https://redeflexapp.lovable.app.

## Detalhes técnicos
- Reprodução: workerd/`wrangler dev` sobre `dist/server` com `nodejs_compat`, injetando `DATABASE_URL_GAS_MONITOR` e `DATABASE_URLSALES`.
- Pontos envolvidos: `src/lib/mongo.server.ts`, `src/lib/mongo-driver.server.ts`, `src/lib/redeflex.functions.ts` e, se necessário, o particionamento de chunks em `vite.config.ts`.
- O diagnóstico depende do log do servidor no workerd; hoje só temos o stack do cliente reexibindo o erro, que não aponta o módulo culpado.