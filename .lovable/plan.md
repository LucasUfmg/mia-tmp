# Portal /acesso: layout dividido, sem logo, dourado e verde

## O que muda
1. **Remover o logo**: some a imagem do logo RedeFlex do topo do portal (a tela fica só com "Portal da Mia" como identidade).
2. **Layout dividido (split-screen)**:
   - Metade esquerda: foto de um posto de combustível moderno, em tons claros com detalhes dourados e verdes.
   - Metade direita: fundo claro com o portal de acesso (entrar, cadastro, boas-vindas, ERP, credenciais, pronto) — todo o fluxo atual é mantido.
   - No celular: foto fica como faixa no topo (menor) e o portal abaixo.
3. **Paleta dourado e verde**: o verde entra como cor de destaque junto ao dourado (botões, links, ícones, seleção de ERP). Fundo da tela e do cartão sempre claros.

## Como será feito
- **Nova imagem** `src/assets/posto-acesso.jpg` gerada por IA: posto de combustível moderno ao entardecer/dia claro, arquitetura limpa, tons dourados e verdes, sem texto.
- **Novos tokens de cor** em `src/styles.css`: verde da marca (`--verde`, `--verde-foreground`, `--verde-soft`) + token `--portal-bg` claro, registrados no `@theme` para uso como classes Tailwind.
- **`src/routes/acesso.tsx`**: refeito o wrapper em grade de 2 colunas (`lg:grid-cols-2`); esquerda com a foto em `object-cover` e um leve selo "Portal da Mia" sobreposto; direita com o formulário atual em cartão claro. Botões passam a verde, detalhes/links em dourado, mantendo contraste. Remoção do import e uso do `logoRedeFlex`.
- Nenhuma lógica, etapas, salvamento ou navegação mudam.

## Verificação
- `npx tsgo --noEmit` e build.
- Playwright em desktop (1280) e mobile (390): foto à esquerda / portal à direita, cores dourado+verde, fluxo entrar → boas-vindas → ERP funcionando.
