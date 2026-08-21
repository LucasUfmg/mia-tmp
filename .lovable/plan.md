# Mia BI na landing page de vendas

Adicionar uma nova seção **Mia BI** na página `/agente`, logo abaixo do bloco do mockup de WhatsApp, apresentando o painel de dados em tempo real como produto separado por **R$ 297/mês**.

## O que o visitante vai ver

1. **Selo e título** — "Mia BI · Painel em tempo real", com copy explicando que o mesmo dado que a Mia lê no WhatsApp também vira um painel visual exclusivo do cliente.
2. **Mockup do painel** (demonstração visual, números fictícios de referência, igual ao mockup de conversa já usado na página):
   - Barra superior imitando o painel: nome da rede, filtro de postos e selo "on-time".
   - Dois cartões Big Number: **Rede Combustíveis** (RB, M/LT, LB, TMC, TMV) e **Rede Produtos** (RB, TMP).
   - Um gráfico de rosca de distribuição de combustíveis com legenda e destaque no hover.
   - Rodapé do mockup com aviso de que é uma demonstração.
3. **Lista de benefícios do BI**: dados on-time direto da base, comparativo com semana anterior, projeção do mês, ranking de postos, mapa da rede, seleção múltipla de postos, acesso pelo navegador em qualquer dispositivo.
4. **Cartão de preço**: **R$ 297 / mês** pelo BI, com nota de que pode ser contratado junto da Mia no WhatsApp (R$ 49,90 por telefone) e CTA para o WhatsApp (31) 99293-2316 com mensagem pré-preenchida sobre o Mia BI.

Tudo em preto e dourado, usando o mesmo tema visual (`mia-landing`) e os mesmos cartões/tipografia da landing, para ficar consistente com o restante da página.

## Detalhes técnicos

- Novo componente `src/components/flexia/BiMockup.tsx` — mockup estático, autocontido, dentro do tema `mia-landing` (tokens `--brand`, `--card`, `--muted-foreground`, `gold-text`), sem chamadas de rede e sem dependência dos server functions do painel real (mantém a landing leve e prerenderizável).
- Novos dados de demonstração em `src/data/flexia.ts`: `biKpis`, `biDistribuicao`, `biBeneficios`.
- `src/routes/agente.tsx`: nova `<section id="bi">` inserida imediatamente após a seção do hero/mockup de WhatsApp, reaproveitando as classes `card-elevated`, `brand-rail` e o componente de CTA existente; nova constante de link WhatsApp para o Mia BI.
- Rosca desenhada em SVG inline no próprio mockup (mesma técnica do `DistributionCard`), com cores derivadas do dourado — sem reaproveitar o componente do painel, que depende dos tokens claros do BI.
- Atualização leve do `head()` de `/agente` (title/description) para mencionar o painel em tempo real.
- Sem mudanças no painel real, no banco de dados ou na Mia do WhatsApp.
