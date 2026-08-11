# Endereços dos postos pela web + mapa iniciando em Belo Horizonte

O Postgres do backend (que tem `lat`/`long` em `ibm_info`) continua inacessível — a
porta 5432 do servidor não responde, então toda consulta expira. Em vez de esperar
esse desbloqueio, vou montar as coordenadas buscando cada posto por nome na web.

## 1. Busca dos endereços (uma vez, na construção)

Para cada um dos postos de `LBCBi.Lojas` (nome fantasia / razão social, 41 registros),
faço uma busca de lugar no Google Maps (Places, busca por texto restrita ao Brasil) e
guardo o melhor resultado: nome encontrado, endereço formatado, latitude e longitude.

O resultado vira um arquivo fixo no projeto (`src/data/postos-localizacao.ts`), com
`ibm`, `nome`, `endereco`, `lat`, `lng` e um campo de confiança indicando se o nome
encontrado bate bem com o nome do posto. Assim:

- o painel não depende de API de geocodificação em tempo de execução;
- você pode revisar e corrigir qualquer linha errada direto no arquivo;
- quando o Postgres for liberado, os valores de `ibm_info` passam a ter prioridade e
  esse arquivo fica só como reserva.

Postos sem resultado confiável ficam de fora do mapa e eu listo quais foram, para você
completar manualmente.

## 2. Fonte de dados do mapa

`loadMapa` passa a montar a lista assim, em ordem de prioridade:

```text
lat/long do Postgres (quando disponível)
      ↓ faltando
lat/long do arquivo buscado na web (por IBM)
      ↓ faltando
posto não aparece no mapa
```

O cruzamento com os índices do MongoDB (volume, faturamento, RB, M/LT, TMC por posto)
continua igual, assim como o balão e o botão "Ver no painel".

## 3. Zoom inicial em Belo Horizonte

O mapa abre centralizado em Belo Horizonte com zoom de cidade (≈11), em vez do
enquadramento automático em todos os pontos. Depois disso o usuário navega livremente;
mantenho um botão discreto "Enquadrar rede" para voltar ao enquadramento que mostra
todos os postos.

## Detalhes técnicos

- Busca dos lugares via connector do Google Maps (Places API New, `places:searchText`
  pelo gateway), executada por mim durante a implementação — não em runtime.
- `src/data/postos-localizacao.ts`: dados estáticos, sem chamadas de rede.
- `src/lib/redeflex-mapa.ts`: mescla Postgres → arquivo estático por IBM normalizado.
- `src/components/redeflex/NetworkMap.tsx`: `center` fixo em BH (-19.9167, -43.9345),
  `zoom: 11`, sem `fitBounds` na carga; ação opcional de enquadrar.
- Observação: a chave gerenciada do Google Maps só autoriza `*.lovable.app`; no domínio
  próprio (`posto.mgdados.com.br`) o mapa exige uma chave sua com o domínio liberado.
