CREATE TABLE public.contabil_lancamentos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ibm text NOT NULL,
  mes date NOT NULL,
  receita_liquida numeric NOT NULL DEFAULT 0,
  lucro_liquido numeric NOT NULL DEFAULT 0,
  ebitda numeric NOT NULL DEFAULT 0,
  ebit numeric NOT NULL DEFAULT 0,
  aliquota_efetiva numeric NOT NULL DEFAULT 0,
  pl_inicial numeric NOT NULL DEFAULT 0,
  pl_final numeric NOT NULL DEFAULT 0,
  divida_financeira numeric NOT NULL DEFAULT 0,
  caixa numeric NOT NULL DEFAULT 0,
  wacc numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT contabil_lancamentos_ibm_mes_key UNIQUE (ibm, mes)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contabil_lancamentos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contabil_lancamentos TO authenticated;
GRANT ALL ON public.contabil_lancamentos TO service_role;

ALTER TABLE public.contabil_lancamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública dos lançamentos contábeis"
  ON public.contabil_lancamentos FOR SELECT
  USING (true);

CREATE POLICY "Escrita pública dos lançamentos contábeis"
  ON public.contabil_lancamentos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Atualização pública dos lançamentos contábeis"
  ON public.contabil_lancamentos FOR UPDATE
  USING (true) WITH CHECK (true);

CREATE POLICY "Remoção pública dos lançamentos contábeis"
  ON public.contabil_lancamentos FOR DELETE
  USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_contabil_lancamentos_updated_at
  BEFORE UPDATE ON public.contabil_lancamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();