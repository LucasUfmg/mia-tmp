ALTER TABLE public.contabil_ebitda
  ADD COLUMN IF NOT EXISTS acrescimos numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS impostos_faturamento_postos numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS impostos_faturamento_distribuidora numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS impostos_faturamento_satelites numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS impostos_faturamento_patrimonial numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS impostos_faturamento_logistica numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS receita_liquida_distribuidora numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS despesas_gestao numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS despesa_distribuidora numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS over_aluguel numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS receitas_financeiras numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS receitas_diversas numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS receita_financeira_distribuidora numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS despesa_financeira_distribuidora numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS irpj_csll_distribuidora numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS irpj_csll_gestao numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS irpj_csll_patrimonial numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS irpj_csll_logistica numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS socios numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS distribuicao_lucros numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS investimentos numeric NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.contabil_ebitda.deducoes IS 'Descontos da DRE Gerencial';
COMMENT ON COLUMN public.contabil_ebitda.irpj_csll IS 'Provisão IRPJ e CSLL Postos';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contabil_ebitda TO anon, authenticated;
GRANT ALL ON public.contabil_ebitda TO service_role;