ALTER TABLE public.contabil_ebitda
  ADD COLUMN IF NOT EXISTS falta_sobra numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS despesas_financeiras numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS despesas_nao_contabeis numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS outras_operacionais numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS outras_receitas_nao_operacionais numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_performance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rateios numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_contrato numeric NOT NULL DEFAULT 0;