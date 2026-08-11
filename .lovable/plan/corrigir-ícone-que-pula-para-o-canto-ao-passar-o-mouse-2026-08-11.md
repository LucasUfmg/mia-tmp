# Corrigir ícone que pula para o canto ao passar o mouse

## O problema

O efeito de aumentar o ícone no hover está sendo aplicado no próprio elemento do marcador. Esse elemento é o que o mapa usa para posicionar o posto na tela, então ao aplicar o efeito a posição é sobrescrita e o ícone salta para o canto superior esquerdo.

## A correção

- Envolver o desenho do posto em um elemento interno e aplicar o efeito de hover nesse elemento interno, deixando o elemento externo livre para o mapa posicionar.
- Resultado: o ícone continua crescendo suavemente ao passar o mouse, mas permanece exatamente sobre o posto.

## Detalhes técnicos

Em `src/components/redeflex/NetworkMap.tsx`: criar um `<div>` interno com o SVG e mover `transition`/`transform` (e os listeners de `mouseenter`/`mouseleave`) para ele; o elemento raiz passado ao `Marker` fica sem `transform` inline. Nada mais muda.
