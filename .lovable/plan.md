# Atualizar preço da Mia: setup R$ 1.599 + R$ 19,90/posto/mês

Ajustar a landing page `/agente` para comunicar o novo plano comercial: **setup único de R$ 1.599** + **assinatura de R$ 19,90 por posto por mês**.

## O que será alterado

1. **SEO (`src/routes/agente.tsx`)**
   - Atualizar `title` e `description` para refletir setup + mensalidade.

2. **Hero**
   - Trocar o selo de "R$ 19,90 por posto / mês" por algo que indique setup + assinatura.
   - Revisar os 3 destaques abaixo do CTA: substituir "R$ 0,66 / por dia, por posto" por um destaque sobre setup (ex.: "Setup R$ 1.599") e manter os demais.

3. **Seção "Quanto o atraso custa"**
   - Atualizar o parágrafo de investimento para: "Setup: R$ 1.599 + R$ 19,90 por posto/mês".
   - Ajustar o exemplo de rede com 10 postos para incluir o setup no cálculo.

4. **Card de preço (`#preco`)**
   - Manter "R$ 19,90 / posto / mês" como preço principal.
   - Adicionar linha com **Setup único: R$ 1.599** logo abaixo do preço.
   - Alterar o subtexto de "Sem taxa de setup" para "Setup único para conexão, treinamento e configuração".

5. **Benefícios e FAQ (`src/data/flexia.ts`)**
   - Remover do `beneficiosPlano` o item "Sem taxa de instalação" e substituir por "Setup único de R$ 1.599 — configuração e treinamento inclusos".
   - Atualizar a FAQ "R$ 19,90 é por posto?" para mencionar o setup de R$ 1.599.

6. **CTA final**
   - Ajustar o texto "R$ 0,66 ao dia" para "A partir de R$ 19,90/posto/mês" ou similar, mantendo o apelo econômico sem esconder o setup.

## Fora de escopo
- Nenhuma mudança no dashboard principal (`/`).
- Nenhuma alteração nas cores, layout ou componentes de mockup do WhatsApp.
- Nenhuma mudança em backend, pagamentos ou webhook da Mia.
