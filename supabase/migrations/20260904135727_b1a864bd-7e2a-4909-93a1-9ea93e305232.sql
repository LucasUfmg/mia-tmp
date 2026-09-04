CREATE TABLE IF NOT EXISTS public.fzap_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at timestamptz NOT NULL DEFAULT now(),
  event_type text,
  instance_id text,
  phone text,
  message_id text,
  from_me boolean NOT NULL DEFAULT false,
  result text NOT NULL DEFAULT 'received',
  error text,
  payload jsonb
);
GRANT SELECT ON public.fzap_eventos TO authenticated;
GRANT ALL ON public.fzap_eventos TO service_role;
ALTER TABLE public.fzap_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fzap_eventos read authenticated" ON public.fzap_eventos FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.fzap_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_url text,
  instance_id text,
  instance_name text,
  last_test_at timestamptz,
  last_test_result text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.fzap_config TO authenticated;
GRANT ALL ON public.fzap_config TO service_role;
ALTER TABLE public.fzap_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fzap_config read authenticated" ON public.fzap_config FOR SELECT TO authenticated USING (true);

CREATE UNIQUE INDEX IF NOT EXISTS fzap_eventos_message_id_key ON public.fzap_eventos (message_id) WHERE message_id IS NOT NULL;