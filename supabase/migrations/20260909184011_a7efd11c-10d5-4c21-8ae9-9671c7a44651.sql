CREATE TABLE public.contabil_ebitda (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ibm text NOT NULL,
  mes date NOT NULL,
  receita_vendas numeric NOT NULL DEFAULT 0,
  deducoes numeric NOT NULL DEFAULT 0,
  ajuste_energy numeric NOT NULL DEFAULT 0,
  custo numeric NOT NULL DEFAULT 0,
  ajuste_transporte numeric NOT NULL DEFAULT 0,
  ajuste_gestao numeric NOT NULL DEFAULT 0,
  despesas_pessoal numeric NOT NULL DEFAULT 0,
  administrativas numeric NOT NULL DEFAULT 0,
  despesas_tributarias numeric NOT NULL DEFAULT 0,
  furtos_roubos numeric NOT NULL DEFAULT 0,
  apropriacao_contratos numeric NOT NULL DEFAULT 0,
  participacoes_empregados numeric NOT NULL DEFAULT 0,
  depreciacao numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (ibm, mes)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contabil_ebitda TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contabil_ebitda TO authenticated;
GRANT ALL ON public.contabil_ebitda TO service_role;

ALTER TABLE public.contabil_ebitda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública dos cálculos de EBITDA" ON public.contabil_ebitda FOR SELECT USING (true);
CREATE POLICY "Escrita pública dos cálculos de EBITDA" ON public.contabil_ebitda FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização pública dos cálculos de EBITDA" ON public.contabil_ebitda FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Remoção pública dos cálculos de EBITDA" ON public.contabil_ebitda FOR DELETE USING (true);

CREATE TRIGGER update_contabil_ebitda_updated_at BEFORE UPDATE ON public.contabil_ebitda FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();