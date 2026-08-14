# Atualizar FAQ da Mia: setup R$ 1.599 (configuração e treinamento inclusos)

Ajustar o FAQ da landing page `/agente` para comunicar o novo plano comercial: **setup único de R$ 1.599** (configuração e treinamento inclusos) + **R$ 19,90 por posto por mês**.

## O que será alterado

1. **FAQ (`src/data/flexia.ts`)**
   - Atualizar a pergunta "R$ 19,90 é por posto?" para refletir o setup de R$ 1.599.
   - Resposta deve deixar claro: setup único de R$ 1.599 (configuração e treinamento inclusos) + R$ 19,90 por posto/mês.

2. **Benefícios (`src/data/flexia.ts`)**
   - Substituir o item "Sem taxa de instalação, sem fidelidade — cancela quando quiser" por algo que mencione o setup.
   - Exemplo: "Setup único de R$ 1.599 — configuração e treinamento inclusos" e manter "sem fidelidade — cancela quando quiser".

3. **Card de preço (`src/routes/agente.tsx`)**
   - Adicionar linha de setup logo abaixo do preço mensal: "Setup único: R$ 1.599".
   - Ajustar o subtexto de "Preço único por posto. Sem taxa de setup, sem contrato de fidelidade." para "Setup único de R$ 1.599 (configuração e treinamento inclusos). Sem contrato de fidelidade.".

## Fora de escopo
- Nenhuma mudança no hero, SEO, seção de economias ou CTA final.
- Nenhuma alteração no dashboard principal (`/`), cores, layout ou mockup do WhatsApp.
- Nenhuma mudança em backend, pagamentos ou webhook da Mia.
