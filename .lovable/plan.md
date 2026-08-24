# Separar Miatech do RedeFlex em dois projetos

Hoje um único projeto atende três domínios (`oficial.redeflexapp.com.br`, `postos.mgdados.com.br` e `www.miatech.com.br`). A separação acontece em duas etapas: você duplica o projeto no Lovable e eu ajusto cada lado para conter só o que lhe pertence.

## Etapa 1 — você duplica o projeto (ação no Lovable)

No projeto atual, use **Remix / duplicar projeto** para criar o projeto novo (sugestão de nome: `miatech`). Depois disso:

- Domínio `www.miatech.com.br` sai deste projeto e é conectado no projeto novo.
- `oficial.redeflexapp.com.br` e `postos.mgdados.com.br` continuam neste projeto.
- O projeto novo recebe seu próprio backend (banco de autenticação/dados próprio); as credenciais do banco de dados dos postos (Mongo/Postgres) precisam ser cadastradas nele como segredos, iguais às atuais.

Me avise quando a cópia existir — eu entro nela e faço os ajustes da Etapa 3.

## Etapa 2 — neste projeto (RedeFlex)

- Remover a landing de vendas da Mia: rota `/agente` e a pasta `src/components/flexia/`, além dos dados de marketing em `src/data/flexia.ts` que só a landing usa.
- Manter intactos: painel `/`, `/manual`, mapa, ranking de vendedores e **a Mia do WhatsApp** (webhook `api/public/whatsapp`, agente e contatos ficam aqui, como você pediu).
- Manter o tema atual (azul institucional + dourado) e o favicon/logo RedeFlex.
- Se `/agente` já estiver indexada no domínio RedeFlex, adiciono um redirecionamento permanente para `https://www.miatech.com.br/agente` para não perder o link.

## Etapa 3 — no projeto Miatech

- Landing de vendas da Mia passa a ser a **home** (`/`), com o conteúdo atual de `/agente` (hero, mockup de WhatsApp, seção Mia BI, economia, planos, FAQ) e `head()` próprio de miatech.
- Painel BI real ganha rota própria (`/painel`) com os mesmos dados em tempo real, mas **todo em preto e dourado**: aplico o tema `mia-landing` como tema global do projeto, então sidebar, big numbers, gráficos de rosca, mapa, tabelas e badges passam a usar os tokens dourados. Paleta dos gráficos trocada para a escala dourada (a mesma já usada no mockup `BiMockup`).
- Remover do projeto Miatech o webhook e o código do agente de WhatsApp (fica só no RedeFlex), evitando dois webhooks concorrentes.
- Logo/favicon: mantém a identidade da Mia (bot em fundo amarelo).

## Detalhes técnicos

- Tema: hoje o preto e dourado vive em `.mia-landing` em `src/styles.css`. No projeto Miatech eu promovo esses valores para `:root`, removo o wrapper `mia-landing` da landing e ajusto `--chart-1..5` para tons de dourado; os componentes do painel já usam apenas tokens semânticos (`bg-brand`, `text-muted-foreground`, `card-elevated`), então herdam o novo tema sem reescrita.
- `NetworkMap`: mantém o fundo CARTO, mas troco para a variante escura e recoloro os marcadores/pin em dourado para contraste.
- Rotas no Miatech: `src/routes/index.tsx` recebe a landing; painel vai para `src/routes/painel.tsx` reusando `redeflex-dashboard`, `redeflex.functions` e componentes de `src/components/redeflex/`.
- Segredos necessários no projeto novo: as mesmas variáveis de conexão do banco dos postos usadas hoje pelos server functions. Sem elas o painel mostra falha ao carregar dados.
- Nenhuma alteração de schema no banco dos postos; só leitura, como já é hoje.
