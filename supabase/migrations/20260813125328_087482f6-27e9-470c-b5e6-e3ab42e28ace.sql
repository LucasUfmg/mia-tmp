CREATE TABLE public.mia_contatos (
  telefone TEXT NOT NULL PRIMARY KEY,
  nome TEXT,
  ibms TEXT[] NOT NULL DEFAULT '{}',
  ativo BOOLEAN NOT NULL DEFAULT true,
  limite_diario INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.mia_contatos TO service_role;
ALTER TABLE public.mia_contatos ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.mia_mensagens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telefone TEXT NOT NULL,
  papel TEXT NOT NULL,
  texto TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX mia_mensagens_telefone_created_at_idx
  ON public.mia_mensagens (telefone, created_at DESC);

GRANT ALL ON public.mia_mensagens TO service_role;
ALTER TABLE public.mia_mensagens ENABLE ROW LEVEL SECURITY;