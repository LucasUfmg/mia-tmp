# Portal de acesso da Mia (somente telas) e ocultar "Lançar dados contábeis"

## 1. Aba Contábil
- O botão "Lançar dados contábeis" fica oculto por enquanto. O botão "Lançar valores da DRE" continua como está.
- O código continua no projeto, então o botão pode voltar depois.

## 2. Portal da Mia (só as telas, sem servidor)
Novo caminho `/acesso`, com o visual atual da RedeFlex (logo, dourado, fundo escuro):

1. **Entrar:** e-mail e senha, botão "Entrar" e link "Criar conta".
2. **Cadastro:** nome, e-mail, senha e confirmação da senha, com checagens simples (campos obrigatórios, e-mail válido, senha com no mínimo 6 caracteres e senhas iguais).
3. **Boas-vindas:** "Olá, {nome}! Eu sou a Mia, sua agente contábil e financeira. Acompanho em tempo real os dados da operação do seu posto." Botão "Começar configuração".
4. **Configuração rápida, passo 1:** escolha do ERP entre três cartões: LBC, Linx (Totvs) e WebPosto.
5. **Configuração rápida, passo 2:** login e senha do ERP escolhido, botão "Conectar" e opção de voltar para trocar o ERP.
6. **Conclusão:** aviso curto de "Tudo pronto" e envio para o sistema atual (Visão Geral).

Comportamento sem servidor:
- Qualquer e-mail e senha preenchidos entram no sistema. O cadastro só guarda no navegador o nome, para usar na saudação.
- O login e a senha do ERP **não são guardados em lugar nenhum**. O sistema só registra qual ERP foi escolhido, para pular a configuração na próxima vez.
- O painel atual continua abrindo direto, sem exigir login. O bloqueio de acesso só entra quando o servidor for construído.
- Um aviso discreto informa que o portal está em modo de demonstração.

## 3. Detalhes técnicos
- Nova rota `src/routes/acesso.tsx`, com etapas controladas por estado local (`entrar | cadastro | boas-vindas | erp | credenciais | pronto`) e `head()` próprio.
- Os componentes ficam em `src/components/redeflex/acesso/`, usando os componentes de interface que já existem (Input, Button, Card) e as cores do tema.
- No navegador ficam guardados só `mia_portal_usuario` ({nome, email}) e `mia_portal_erp` (nome do ERP), lidos em `useEffect`.
- Em `contabil.tsx`, o botão fica envolvido por uma condição `false` com um comentário explicando.
- Atualizar no `AGENTS.md` a regra sobre o que é público, incluindo `/acesso` como portal só de telas. Credenciais de ERP nunca são guardadas até existir um servidor seguro.
- Sem banco de dados, servidor ou login real nesta etapa.
