# Liberar seu WhatsApp na Mia (número não reconhecido)

## O que está acontecendo

O webhook funcionou (a Mia respondeu), mas ela não encontrou seu número na lista de autorizados.

No banco seu contato está salvo como **5531992932316** (com o 9 extra).
O WhatsApp/Twilio no Brasil normalmente entrega o número de celular **sem o 9**, ou seja `whatsapp:+553192932316`. Hoje a Mia compara só os dígitos exatos, então `553192932316` não casa com `5531992932316` e cai na mensagem "este número ainda não tem acesso".

## Correção

1. **Comparação tolerante ao 9º dígito** (na normalização de telefone da Mia):
   - gerar as duas variantes de números brasileiros de celular (com e sem o 9 depois do DDD);
   - buscar o contato por qualquer uma das variantes;
   - gravar histórico e contar o limite diário sempre pela variante canônica (a que está no cadastro), para não duplicar contagem.
2. **Cadastrar as duas formas** do seu número como autorizadas, garantindo funcionamento mesmo se o Twilio mudar o formato.
3. **Log de diagnóstico** quando um número não autorizado chegar: registrar o número recebido (mascarado) no log do servidor, para identificar rapidamente casos futuros.
4. **Mensagem de recusa mais útil**, informando que o número pode ser cadastrado pelo administrador.

## Como validar

- Reenviar "ajuda" pelo WhatsApp do seu número: deve vir o menu da Mia.
- Depois "resumo": deve vir os indicadores da rede do dia.

## Detalhes técnicos

- `src/lib/mia/store.server.ts`: `normalizarTelefone` passa a retornar variantes (`variantesTelefone`) e `buscarContato` usa `.in("telefone", variantes)`; o `telefone` retornado do cadastro vira a chave usada em `registrar`, `mensagensHoje` e `historico`.
- `src/routes/api/public/whatsapp.ts`: usa `contato.telefone` (canônico) nas chamadas de histórico/limite e loga tentativa não autorizada.
- Inserção de linha adicional em `mia_contatos` com a variante sem o 9 (mesmos `ibms`, `limite_diario`).
