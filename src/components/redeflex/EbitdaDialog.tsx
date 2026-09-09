import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { salvarEbitda } from "@/lib/contabil.functions";
import { getReceitaCusto } from "@/lib/redeflex.functions";
import { IBM_REDE, mesesDoAno, rotuloMes } from "@/lib/contabil";
import {
  calcularEbitda,
  linhasEbitda,
  totaisApos,
  type Ebitda,
  type LinhaEbitdaChave,
} from "@/lib/ebitda";
import { baseDrePorPosto, type BaseDreChave } from "@/data/dre-base";

import type { Loja } from "@/lib/redeflex-dashboard";

/** Linhas que vêm dos dados de venda e não podem ser editadas. */
const travadas: LinhaEbitdaChave[] = ["receitaVendas", "custo"];


type Props = {
  aberto: boolean;
  onAberto: (v: boolean) => void;
  lojas: Loja[];
  calculos: Ebitda[];
  ano: string;
  mesInicial: string;
  ibmInicial?: string;
  /** Chamado depois de salvar, para abrir o lançamento contábil do mesmo posto/mês. */
  onUsarNoLancamento: (alvo: { ibm: string; mes: string }) => void;
};

type Form = Record<LinhaEbitdaChave, string>;

const vazio = Object.fromEntries(linhasEbitda.map((l) => [l.chave, ""])) as Form;

/** Aceita "1.234.567,89" e "1234567.89". */
function paraNumero(valor: string): number {
  const limpo = valor.trim().replace(/\s|R\$/g, "");
  if (!limpo) return 0;
  const normalizado = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : 0;
}

function paraForm(c: Ebitda | undefined): Form {
  if (!c) return { ...vazio };
  return Object.fromEntries(
    linhasEbitda.map((l) => {
      const v = Math.abs(c[l.chave] ?? 0);
      return [l.chave, v === 0 ? "" : String(v).replace(".", ",")];
    }),
  ) as Form;
}

const moeda = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function EbitdaDialog({
  aberto,
  onAberto,
  lojas,
  calculos,
  ano,
  mesInicial,
  ibmInicial,
  onUsarNoLancamento,
}: Props) {
  const [ibm, setIbm] = useState(ibmInicial ?? lojas[0]?.ibm ?? "");
  const [mes, setMes] = useState(mesInicial);
  const [form, setForm] = useState<Form>({ ...vazio });
  const queryClient = useQueryClient();
  const salvar = useServerFn(salvarEbitda);

  const meses = useMemo(() => mesesDoAno(ano), [ano]);

  useEffect(() => {
    if (!aberto) return;
    setIbm(ibmInicial ?? lojas[0]?.ibm ?? "");
    setMes(mesInicial);
  }, [aberto, ibmInicial, mesInicial, lojas]);

  useEffect(() => {
    setForm(paraForm(calculos.find((c) => c.ibm === ibm && c.mes === mes)));
  }, [ibm, mes, calculos]);

  // Receita de vendas e custo vêm dos dados de venda do posto (não editáveis).
  const { data: doPainel, isPending: carregandoPainel } = useQuery({
    queryKey: ["contabil", "ebitda-bi", ibm, mes],
    queryFn: () =>
      getReceitaCusto({ data: { mes, ...(ibm && ibm !== IBM_REDE ? { ibm } : {}) } }),
    enabled: aberto && !!ibm,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const numeros = useMemo(() => {
    const base = Object.fromEntries(
      linhasEbitda.map((l) => [l.chave, paraNumero(form[l.chave])]),
    ) as Record<LinhaEbitdaChave, number>;
    base.receitaVendas = doPainel?.receita ?? 0;
    base.custo = doPainel?.custo ?? 0;
    return base;
  }, [form, doPainel]);
  const resultado = useMemo(() => calcularEbitda(numeros), [numeros]);

  const semVendas = !carregandoPainel && (doPainel?.receita ?? 0) === 0;
  const origem = carregandoPainel
    ? "Carregando dados de venda…"
    : doPainel
      ? doPainel.parcial
        ? `Do painel — acumulado até ${doPainel.ate.slice(8, 10)}/${doPainel.ate.slice(5, 7)}`
        : "Do painel — mês fechado"
      : "Do painel";


  const mutation = useMutation({
    mutationFn: async () => await salvar({ data: { ibm, mes, ...numeros } }),
    onSuccess: async (_dados, _v, _c) => {
      await queryClient.invalidateQueries({ queryKey: ["contabil"] });
      return { ibm, mes };
    },
    onError: (erro: Error) =>
      toast.error("Não foi possível salvar o cálculo", { description: erro.message }),
  });

  const nome = ibm === IBM_REDE ? "Rede (consolidado)" : (lojas.find((l) => l.ibm === ibm)?.nome ?? ibm);

  const concluir = (usarNoLancamento: boolean) => {
    mutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Cálculo de EBITDA salvo", {
          description: `${nome} · ${rotuloMes(mes)} · EBITDA ${moeda(resultado.ebitda)}`,
        });
        onAberto(false);
        if (usarNoLancamento) onUsarNoLancamento({ ibm, mes });
      },
    });
  };

  return (
    <Dialog open={aberto} onOpenChange={onAberto}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Calcular EBITDA</DialogTitle>
          <DialogDescription>
            Receita de vendas e custo vêm dos dados de venda do posto e não podem ser alterados.
            Preencha as demais linhas: os totais são calculados automaticamente e podem ser levados
            para o lançamento contábil.
          </DialogDescription>
        </DialogHeader>

        {semVendas && (
          <p className="rounded-xl bg-surface-muted px-4 py-3 text-xs text-muted-foreground">
            Sem vendas registradas neste período para o posto/mês selecionado.
          </p>
        )}


        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Posto</Label>
            <Select value={ibm} onValueChange={setIbm}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o posto" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value={IBM_REDE}>Rede (consolidado)</SelectItem>
                {lojas.map((l) => (
                  <SelectItem key={l.ibm} value={l.ibm}>
                    {l.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Mês</Label>
            <Select value={mes} onValueChange={setMes}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {meses.map((m) => (
                  <SelectItem key={m} value={m}>
                    {rotuloMes(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-3">
          {linhasEbitda.map((l) => {
            const total = totaisApos[l.chave];
            const travada = travadas.includes(l.chave);
            return (
              <div key={l.chave} className="grid gap-3">
                <div className="grid gap-1.5 sm:grid-cols-[1fr_180px] sm:items-center sm:gap-3">
                  <Label htmlFor={`ebitda-${l.chave}`} className="text-xs sm:text-sm">
                    {l.label}
                    {travada && (
                      <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {origem}
                      </span>
                    )}
                  </Label>
                  {travada ? (
                    <Input
                      id={`ebitda-${l.chave}`}
                      readOnly
                      tabIndex={-1}
                      aria-readonly="true"
                      className="cursor-not-allowed bg-surface-muted font-semibold text-muted-foreground"
                      value={
                        carregandoPainel && !doPainel
                          ? "carregando…"
                          : moeda(Math.abs(numeros[l.chave]))
                      }
                    />
                  ) : (
                    <Input
                      id={`ebitda-${l.chave}`}
                      inputMode="decimal"
                      placeholder="0,00"
                      value={form[l.chave]}
                      onChange={(e) => setForm((f) => ({ ...f, [l.chave]: e.target.value }))}
                    />
                  )}
                </div>

                {total && (
                  <div
                    className={`flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm font-bold ${
                      total.destaque
                        ? "bg-gold/15 text-foreground"
                        : "bg-surface-muted text-muted-foreground"
                    }`}
                  >
                    <span>{total.label}</span>
                    <span
                      className={
                        resultado[total.campo] < 0 ? "text-destructive" : "text-foreground"
                      }
                    >
                      {moeda(resultado[total.campo])}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onAberto(false)}>
            Cancelar
          </Button>
          <Button
            variant="outline"
            onClick={() => concluir(false)}
            disabled={!ibm || mutation.isPending}
          >
            {mutation.isPending ? "Salvando…" : "Salvar cálculo"}
          </Button>
          <Button
            onClick={() => concluir(true)}
            disabled={!ibm || mutation.isPending}
            className="bg-gold text-gold-foreground hover:bg-gold/90"
          >
            Usar no lançamento contábil
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
