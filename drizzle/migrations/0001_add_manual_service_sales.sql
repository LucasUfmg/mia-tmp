ALTER TABLE public.contabil_ebitda
  ADD COLUMN IF NOT EXISTS venda_servicos_manual numeric NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.contabil_ebitda.venda_servicos_manual IS 'Venda de serviços informada manualmente na DRE; não possui origem no BI.';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contabil_ebitda TO authenticated;
GRANT ALL ON public.contabil_ebitda TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contabil_ebitda TO anon;