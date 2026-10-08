# Portal da Mia como página inicial e BI em /bi

## O que muda para o usuário
- Quem abrir o site (`/`) cai direto no Portal da Mia (login / cadastro).
- O painel de BI (Visão Geral) passa a viver em `/bi`.
- Ao concluir o portal (botão "Conectar" após informar o ERP), o usuário é levado automaticamente para `/bi`.
- `/contabil` e `/manual` continuam como estão; o menu lateral passa a apontar "Visão Geral" para `/bi`.

## Decisões assumidas (me avise se quiser diferente)
- A tela "Parabéns, vamos configurar seus dados... enviaremos um e-mail" deixa de aparecer, porque agora o fluxo termina no BI. Isso substitui a regra anterior ("não redirecionar para o dashboard").
- O endereço antigo `/acesso` continua funcionando, redirecionando para `/`, para não quebrar links já enviados.
- Continua sem backend: o portal segue em modo demonstração, e login/senha/credenciais do ERP não são guardados; o acesso a `/bi` não é bloqueado (sem autenticação real ainda).

## Passos técnicos
1. Mover `src/routes/index.tsx` (BI) para `src/routes/bi.tsx`, trocando `createFileRoute("/")` por `createFileRoute("/bi")` e ajustando title/description se necessário.
2. Mover o conteúdo de `src/routes/acesso.tsx` para `src/routes/index.tsx` (`createFileRoute("/")`, head próprio "Portal da Mia"). Recriar `src/routes/acesso.tsx` apenas com `beforeLoad` redirecionando para `/`.
3. Em `conectar` (portal): em vez de ir para a etapa "pronto", fazer `navigate({ to: "/bi" })`; remover a etapa e o texto "pronto" não utilizados.
4. Atualizar links para o BI: `Sidebar.tsx` (Visão Geral -> `/bi`, `activeOptions exact`), `manual.tsx` (dois `to="/"` -> `/bi`), e conferir `contabil.tsx`.
5. `__root.tsx`: o "Go home" da página 404/erro continua para `/` (portal) — sem mudança.
6. Atualizar `AGENTS.md` (regra do portal: início em `/`, termina redirecionando para `/bi`; substituir a regra antiga), `roadmap.md` e o manual se citar a rota inicial.
7. Validar com Playwright: abrir `/` mostra o portal; fluxo cadastro -> ERP -> Conectar chega em `/bi` com o painel; `/acesso` redireciona; menu lateral e `/contabil` seguem funcionando.
