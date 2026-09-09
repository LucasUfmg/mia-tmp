# Pré-preencher o cálculo de EBITDA com os valores da planilha

Hoje, ao abrir "Calcular EBITDA", só receita de vendas e custo aparecem preenchidos (vindos do painel). Todos os outros campos começam vazios e precisam ser digitados.

A mudança: usar a planilha BASE DRE como preenchimento inicial dos demais campos, por posto.

## Como vai funcionar

- Ao escolher posto e mês, os campos abaixo já aparecem preenchidos com a média mensal daquele posto na planilha:
  - Deduções da receita bruta
  - Ajuste
  - Ajuste transporte
  - Ajuste gestão
  - Despesas com pessoal
  - Administrativas
  - Despesas tributárias
  - Furtos e roubos
  - Apropriação de contratos
  - Participações de empregados
  - Depreciação/amortização
- Receita de vendas e custo continuam vindo do painel, travados, sem alteração.
- Todos os campos pré-preenchidos continuam editáveis: o usuário ajusta o que quiser antes de salvar.
- Se já existir um cálculo salvo para aquele posto/mês, os valores salvos têm prioridade — a planilha só preenche quando não há nada salvo.
- Aparece uma etiqueta discreta "Base DRE" nos campos preenchidos pela planilha, para o usuário saber a origem.
- Postos sem correspondência na planilha (e a visão "Rede consolidado") continuam com os campos em branco, como hoje.
- Um botão "Limpar campos" permite zerar tudo e digitar do zero.

## Detalhes técnicos

- Novo arquivo `src/data/dre-base.ts` com os valores da coluna MÉDIA MENSAL da primeira aba (`BASE DRE`), por nome de posto, mapeados para as chaves de `linhasEbitda`. Valores em módulo (o sinal já é aplicado por `comSinal`).
- Resolução do posto: normalizar o nome da loja (`Loja.nome`, sem acentos/caixa/prefixo "POSTO") e casar com a chave da planilha; sem correspondência, retorna `undefined`.
- `EbitdaDialog.tsx`: no `useEffect` que monta o formulário, se não houver cálculo salvo para `ibm`/`mes`, preencher a partir de `dre-base` (exceto `receitaVendas` e `custo`, que seguem vindo de `getReceitaCusto`). Marcar quais chaves vieram da planilha para exibir a etiqueta, limpando a marca quando o usuário edita o campo.
- Nenhuma alteração em `src/lib/ebitda.ts`, nas funções de servidor, na tabela `contabil_ebitda` ou no lançamento contábil.
