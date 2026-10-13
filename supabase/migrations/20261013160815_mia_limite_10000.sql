ALTER TABLE public.mia_contatos ALTER COLUMN limite_diario SET DEFAULT 10000;
UPDATE public.mia_contatos SET limite_diario = 10000;
