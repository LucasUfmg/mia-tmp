CREATE TABLE public.dre_snapshots (
  chave text PRIMARY KEY,
  dados jsonb NOT NULL,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.dre_snapshots TO service_role;
ALTER TABLE public.dre_snapshots ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.dre_snapshots IS 'Consolidado da DRE Gerencial (mesmo cálculo da aba Contábil) para a Mia ler sem reagregar o BI.';