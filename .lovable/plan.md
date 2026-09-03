# Liberar um segundo número na Mia (Ramon)

## O que será feito

Cadastrar o WhatsApp **(31) 9877-4981** como contato autorizado da Mia, com:

- Nome: **Ramon**
- Acesso: **rede inteira** (todos os postos, igual ao número já cadastrado)
- Limite: **50 perguntas por dia**

O número informado tem 8 dígitos após o DDD. Para não haver risco de o WhatsApp entregar
o número no formato com o 9 extra, serão cadastradas as duas formas do mesmo número
(com e sem o nono dígito), exatamente como já foi feito para o número atual. As duas
apontam para a mesma pessoa e o mesmo acesso.

## Como validar

1. Ramon envia **ajuda** para o WhatsApp da Mia — deve receber o menu de boas-vindas.
2. Em seguida envia **resumo** — deve receber os indicadores do dia da rede.

Se ainda vier a mensagem de "número não liberado", significa que o número correto é outro
(por exemplo com um dígito a mais no início); nesse caso basta me passar o número como ele
aparece no WhatsApp que ajusto o cadastro.

## Detalhes técnicos

- Inserção de duas linhas em `mia_contatos` via alteração de dados (sem mudança de schema):
  `553198774981` e `5531998774981`, ambas com `nome = 'Ramon'`, `ibms = '{}'`
  (escopo rede inteira), `ativo = true`, `limite_diario = 50`.
- Nenhuma alteração de código: `variantesTelefone`/`buscarContato` em
  `src/lib/mia/store.server.ts` já tratam a busca por variantes, e o histórico/limite
  usam o `telefone` canônico retornado do cadastro.
