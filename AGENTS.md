<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project architecture

- Keep all DRE line definitions and formulas centralized in `src/lib/ebitda.ts` so the editor, dashboard, and Mia never diverge.
- Keep the store comparison demonstrative and deterministic; simulated values must never be persisted or mixed into accounting records.
- Keep the public product surface limited to the BI dashboard (`/bi`), accounting, manual, and the front-only Mia portal at `/` (`/acesso` redirects to `/`); Mia itself remains a WhatsApp service.
- Keep the Mia portal branded only as "Portal da Mia" (no RedeFlex mention or logo); users always start at `/` and the flow ends by redirecting to `/bi`; why: the portal is the entry point of the product.
- Never persist ERP credentials from the access portal until a secure backend exists; why: they are third-party secrets.
- Contábil busca Receita/CMV do BI com uma consulta curta por posto/mês (mesmo formato da Visão Geral), em fila limitada; agregações anuais únicas estouram o tempo limite.
- O fechamento da DRE calcula IRPJ/CSLL automaticamente em 34% do saldo positivo após o resultado não operacional; retiradas vêm depois do resultado líquido.
