# Plano: Botão "Confirmar" no filtro de postos

## Objetivo
Hoje o `MultiStoreFilter` aplica cada clique imediatamente (`onChange`) e só fecha ao clicar fora. O usuário quer um botão **Confirmar** à esquerda de "Selecionar todos" que, ao ser clicado, aplica a seleção e fecha o popover.

## Mudança (arquivo único: `src/components/redeflex/MultiStoreFilter.tsx`)

1. **Buffer local de seleção**: adicionar um estado `rascunho: string[]` que espelha `value` quando o popover abre (`onOpenChange` → `true` sincroniza `rascunho = value`).
2. **Toggles atualizam o rascunho**: `alternar`, "Selecionar todos" e "Limpar" passam a alterar `rascunho` em vez de chamar `onChange` direto. Assim o usuário pode montar a seleção sem disparar recálculos a cada clique.
3. **Botão "Confirmar"**: novo botão dourado (`bg-gold`) posicionado **à esquerda** de "Selecionar todos". Ao clicar:
   - `onChange(rascunho)` — aplica a seleção ao dashboard.
   - `setAberto(false)` — fecha o popover.
4. **Indicador de contagem**: o rodapé já mostra "`X de N`"; atualizar para refletir `rascunho.length` em vez de `value.length`.

## Sem alterações
- Backend, mapa, lógica de agregação e demais componentes permanecem intactos.
- O comportamento da opção "Rede (todos os postos)" se mantém (limpa o rascunho).
