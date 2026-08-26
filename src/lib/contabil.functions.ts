import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Lancamento } from "./contabil";

const mesRegex = /^\d{4}-\d{2}-01$/;

const listarSchema = z.object({
  ano: z.string().regex(/^\d{4}$/),
});

const salvarSchema = z.object({
  ibm: z.string().min(1),
  mes: z.string().regex(mesRegex),
  receitaLiquida: z.number().finite(),
  lucroLiquido: z.number().finite(),
  ebitda: z.number().finite(),
  ebit: z.number().finite(),
  aliquotaEfetiva: z.number().finite(),
  plInicial: z.number().finite(),
  plFinal: z.number().finite(),
  dividaFinanceira: z.number().finite(),
  caixa: z.number().finite(),
  wacc: z.number().finite(),
});

type Linha = {
  id: string;
  ibm: string;
  mes: string;
  receita_liquida: number | string;
  lucro_liquido: number | string;
  ebitda: number | string;
  ebit: number | string;
  aliquota_efetiva: number | string;
  pl_inicial: number | string;
  pl_final: number | string;
  divida_financeira: number | string;
  caixa: number | string;
  wacc: number | string;
};

function paraLancamento(linha: Linha): Lancamento {
  const n = (v: number | string) => Number(v) || 0;
  return {
    id: linha.id,
    ibm: linha.ibm,
    mes: String(linha.mes).slice(0, 10),
    receitaLiquida: n(linha.receita_liquida),
    lucroLiquido: n(linha.lucro_liquido),
    ebitda: n(linha.ebitda),
    ebit: n(linha.ebit),
    aliquotaEfetiva: n(linha.aliquota_efetiva),
    plInicial: n(linha.pl_inicial),
    plFinal: n(linha.pl_final),
    dividaFinanceira: n(linha.divida_financeira),
    caixa: n(linha.caixa),
    wacc: n(linha.wacc),
  };
}

/** Lançamentos contábeis de um ano (todos os postos). */
export const listarLancamentos = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => listarSchema.parse(input))
  .handler(async ({ data }): Promise<Lancamento[]> => {
    const { clienteContabil } = await import("./contabil.server");
    const supabase = clienteContabil();
    const { data: linhas, error } = await supabase
      .from("contabil_lancamentos")
      .select(
        "id, ibm, mes, receita_liquida, lucro_liquido, ebitda, ebit, aliquota_efetiva, pl_inicial, pl_final, divida_financeira, caixa, wacc",
      )
      .gte("mes", `${data.ano}-01-01`)
      .lte("mes", `${data.ano}-12-01`)
      .order("mes", { ascending: true });
    if (error) throw new Error(error.message);
    return (linhas ?? []).map((l) => paraLancamento(l as unknown as Linha));
  });

/** Cria ou atualiza o lançamento de um posto em um mês. */
export const salvarLancamento = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => salvarSchema.parse(input))
  .handler(async ({ data }) => {
    const { clienteContabil } = await import("./contabil.server");
    const supabase = clienteContabil();
    const { error } = await supabase.from("contabil_lancamentos").upsert(
      {
        ibm: data.ibm,
        mes: data.mes,
        receita_liquida: data.receitaLiquida,
        lucro_liquido: data.lucroLiquido,
        ebitda: data.ebitda,
        ebit: data.ebit,
        aliquota_efetiva: data.aliquotaEfetiva,
        pl_inicial: data.plInicial,
        pl_final: data.plFinal,
        divida_financeira: data.dividaFinanceira,
        caixa: data.caixa,
        wacc: data.wacc,
      },
      { onConflict: "ibm,mes" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Remove um lançamento pelo id. */
export const excluirLancamento = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { clienteContabil } = await import("./contabil.server");
    const supabase = clienteContabil();
    const { error } = await supabase.from("contabil_lancamentos").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
