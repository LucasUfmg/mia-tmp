# Preparar o painel para atender várias redes de postos

Objetivo: deixar a base pronta para ligar uma segunda rede (com sistema de origem
diferente) sem reescrever o painel, e com cada cliente vendo só os seus postos.

## Estratégia em uma frase

Tudo passa a pertencer a uma "rede" (cliente). O painel nunca fala direto com o
banco de origem: ele lê de um formato único interno, e cada rede tem um pequeno
"tradutor" que converte o formato dela para esse padrão.

```text
Rede A (banco atual)  --> tradutor A --\
                                        >-- formato único --> painel / Mia / contábil
Rede B (outro sistema) --> tradutor B --/
```

## Etapas

### 1. Cadastro de redes e usuários
- Nova tabela de redes (nome, apelido curto, situação ativa/inativa).
- Nova tabela de postos por rede (código do posto, nome, cidade, bairro,
  coordenadas) — hoje a lista de postos está fixa no código.
- Vínculo entre pessoa que faz login e rede, com dois papéis: administrador da
  plataforma (vê todas as redes) e usuário da rede (vê apenas a sua).
- Login por e-mail e senha, mais Google. As telas do painel passam a ficar atrás
  do login; a página de vendas da Mia continua aberta.

### 2. Toda leitura passa a ser por rede
- As consultas de vendas, mapa, ranking de vendedores e indicadores contábeis
  recebem a rede como parâmetro obrigatório.
- Os lançamentos contábeis e os contatos de WhatsApp da Mia ganham a coluna de
  rede, com regra de acesso que impede um cliente de ver dados do outro.
- No WhatsApp, o número cadastrado define a rede da conversa automaticamente.

### 3. Tradutor por rede (o ponto que dá escala)
- Uma "porta de entrada de dados" com um contrato fixo: dado um período e uma
  lista de postos, devolver volume, receita, margem, tempos e vendedores.
- O tradutor da rede atual é o código Mongo que já existe, movido para trás desse
  contrato, sem mudar fórmulas.
- Para uma rede nova basta escrever um tradutor novo e apontar as credenciais
  dela no cadastro; nada do painel muda.
- As credenciais de cada rede ficam guardadas no backend, referenciadas pelo
  cadastro da rede — nunca no navegador.

### 4. Ligar a segunda rede depois
Checklist que sobra para o futuro: cadastrar a rede, cadastrar os postos,
guardar as credenciais, escrever o tradutor, criar o usuário. Sem tocar em telas.

## Detalhes técnicos

- Tabelas novas: `redes`, `rede_postos`, `rede_usuarios` (papel), e coluna
  `rede_id` em `contabil_lancamentos` e `mia_contatos`. GRANTs + RLS via função
  `security definer` `pertence_a_rede(rede_id)`, evitando recursão nas políticas.
- Migração de dados: rede inicial `redeflex` criada na mesma migração, com os 41
  postos de `src/data/postos-localizacao.ts` inseridos e as linhas existentes de
  `contabil_lancamentos`/`mia_contatos` apontadas para ela.
- Camada de dados: interface `FonteDeDados` (`vendasPorDia`, `vendasPorMes`,
  `indices`, `vendedores`, `lojas`) em `src/lib/fontes/tipos.ts`; adaptador atual
  em `src/lib/fontes/redeflex-mongo.ts` reusando `redeflex-mongo.server.ts` sem
  alterar agregações; `resolverFonte(redeId)` faz o registro por rede.
- Credenciais por rede: nome do secret guardado na linha da rede
  (`secret_conexao`), lido com `process.env[nome]` dentro do handler — mantém a
  regra de não fazer I/O em escopo global no Worker.
- Rotas do painel movidas para `src/routes/_authenticated/` (índice, contábil,
  manual); `/agente` e as rotas `api/public/*` seguem públicas.
- `src/lib/mia/*` mantém prompt, memória e ferramentas; as ferramentas apenas
  recebem `redeId` resolvido a partir do contato.
- Cache (`src/lib/cache.server.ts` e `sessionStorage`) passa a incluir `redeId` na
  chave.

## Fora de escopo

Fórmulas dos indicadores, layout, cores e o canal FZAP (segue em espera).
