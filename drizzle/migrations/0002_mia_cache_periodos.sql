CREATE TABLE public.mia_cache_periodos (
  chave text PRIMARY KEY,
  dados jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.mia_cache_periodos TO service_role;
ALTER TABLE public.mia_cache_periodos ENABLE ROW LEVEL SECURITY;