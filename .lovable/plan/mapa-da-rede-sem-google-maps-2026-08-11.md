# Mapa da rede sem Google Maps

Trocar o mapa por **MapLibre GL** com fundo de mapa **CARTO Positron** (estilo claro e minimalista, sem chave de API e sem conta externa). O visual fica clean e cada posto aparece como um ponto com nome, bairro e cidade.

## O que muda na tela

- Fundo de mapa claro e discreto (ruas em cinza claro, poucos rótulos, sem satélite).
- Cada posto é um ponto circular: tamanho pelo volume vendido, cor pelo M/LT frente à rede (verde / amarelo / vermelho / cinza sem movimento) — igual ao comportamento atual.
- Ao passar o mouse ou tocar em um posto: nome do posto, bairro e cidade; abaixo, os indicadores do período (volume, faturamento, resultado bruto, M/LT, TMC) e o botão "Ver no painel".
- O endereço completo com rua, número e CEP sai do balão; fica só bairro e cidade, como pedido.
- Mantidos: contador "41 postos localizados", botão "Enquadrar rede", legenda de cores e o clique para filtrar o painel por posto.
- Zoom, arrastar e um controle discreto de +/−; sem Street View, sem botão de satélite, sem controles extras.

## Dados de bairro e cidade

O arquivo de localização dos postos passa a guardar `bairro` e `cidade` como campos próprios (hoje só existe o endereço completo em uma linha). Vou regravar esse arquivo a partir dos mesmos dados oficiais de CNPJ já usados, sem alterar as coordenadas. Quando o cadastro do Postgres voltar a responder, ele continua com prioridade e também passa a fornecer bairro/cidade.

## Detalhes técnicos

- Instalar `maplibre-gl`; remover `src/lib/google-maps.ts` e o uso da chave do Google no mapa.
- Reescrever `src/components/redeflex/NetworkMap.tsx` com MapLibre: estilo raster CARTO Positron, atribuição enxuta, `NavigationControl` só com zoom, marcadores via `Marker` com elementos DOM (mesma escala/cores de hoje) e `Popup` para o balão.
- Importar o CSS do MapLibre dentro do próprio componente, que já é carregado via `lazy` + `ClientOnly`, mantendo o mapa fora do SSR.
- `src/lib/redeflex-mapa.ts` e o tipo `PostoMapa` passam a expor `bairro` e `cidade`; `src/lib/redeflex-postgres.server.ts` retorna esses campos do cadastro quando disponível.
- "Enquadrar rede" usa `fitBounds` sobre as coordenadas dos postos; centro inicial segue Belo Horizonte, zoom 11.
- Nenhuma mudança nas consultas de indicadores (MongoDB) nem no restante do painel.