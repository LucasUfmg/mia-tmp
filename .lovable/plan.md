# Corrigir o pré-preenchimento do EBITDA (campos vindo em branco)

Os campos vieram vazios porque os nomes usados para casar planilha × painel não são iguais. Na planilha o posto se chama "POSTO ALELUIA", "POSTO ROL", "POSTO SETE BELO"; no painel o cadastro usa a razão social: "AUTO POSTO ALELUIA LTDA", "ROL COM DE DERIVADOS DE PETROLEO LTDA", "GNV SETE BELO LTDA". Como o nome não coincide, o preenchimento é descartado e o formulário abre em branco.

## Como vai funcionar depois do ajuste

- O vínculo passa a ser feito pelo código do posto (IBM), não pelo nome. Assim cada posto da planilha aponta para o posto certo do painel.
- Vínculos (27 postos da planilha): Aeroporto, Aleluia, Buritis, CCA, CELT, Center Norte, Center Posto, Fórmula, Júpiter, Leste, Maquiné, Mauritânia, Minas Shopping, MM, Mustang, Panamera, Parque Jardim, Poeta, Rol, Sete Belo, Sigma, Sto Agostinho, Tatiana, Trovão, Veneto, Vila Chalé, Vila da Serra.
- "Rede (consolidado)" passa a ser preenchida com a coluna TOTAL GERAL da planilha (valores acumulados da rede, não a média mensal). Os campos seguem editáveis.
- Postos do painel que não existem na planilha continuam em branco: Carmênia, Danúbio, Center Sul, Duodrive 2, Gall, Parque Buritis, Portal de Betim, Portal de Contagem, Portal dos Caiçaras, Raja, Via Fernão Dias, RFX Distribuidora e as duas filiais (Aleluia filial e Center Posto filial).
- Receita de vendas e custo continuam vindo do painel e travados; os demais campos seguem editáveis, com a marca "Base DRE", e o botão "Limpar campos" continua funcionando.
- Valores já salvos para o posto/mês continuam tendo prioridade sobre a planilha.

## Detalhes técnicos

- `src/data/dre-base.ts`: reescrever o dicionário indexado por IBM (ex.: `"3101"`, `"53901"`, `"901"`) com as médias mensais da primeira aba (`BASE DRE`), em módulo, mais uma entrada `REDE` com a coluna TOTAL GERAL (col. 82, acumulado).
- Trocar `baseDrePorPosto(nome)` por `baseDrePorIbm(ibm)`, normalizando o IBM (remover zeros à esquerda) para casar com o formato usado em `Loja.ibm` (ex.: `00000000291901`).
- `EbitdaDialog.tsx`: no `useEffect` de montagem, buscar por `ibm` (inclusive `IBM_REDE`) em vez de pelo nome da loja. Nenhuma outra mudança de comportamento.
- Nada muda em `src/lib/ebitda.ts`, nas funções de servidor, na tabela `contabil_ebitda` nem no lançamento contábil.
