import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
import {
  IBM_REDE,
  formatarBR,
  mascaraBR,
  mesesDoAno,
  paraNumero,
  rotuloMes,
} from "@/lib/contabil";
import { gruposLancamentoDre, linhasEbitda, rotuloComSinal, type Ebitda, type LinhaEbitdaChave } from "@/lib/ebitda";

import type { Loja } from "@/lib/redeflex-dashboard";

type Props = {
  aberto: boolean;
  onAberto: (v: boolean) => void;
  lojas: Loja[];
  calculos: Ebitda[];
  ano: string;
  mesInicial: string;
  ibmInicial?: string;
};

type Form = Record<LinhaEbitdaChave, string>;

const vazio = Object.fromEntries(linhasEbitda.map((l) => [l.chave, ""])) as Form;

const texto = (v: number) => formatarBR(Math.abs(v));

function paraForm(c: Ebitda | undefined): Form {
  if (!c) return { ...vazio };
  return Object.fromEntries(
    linhasEbitda.map((l) => [l.chave, texto(c[l.chave] ?? 0)]),
  ) as Form;
}

export function EbitdaDialog({
  aberto,
  onAberto,
  lojas,
  calculos,
  ano,
  mesInicial,
  ibmInicial,
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
    const salvo = calculos.find((c) => c.ibm === ibm && c.mes === mes);
    setForm(paraForm(salvo));
  }, [ibm, mes, calculos]);

  const editar = (chave: LinhaEbitdaChave, valor: string) => {
    setForm((f) => ({ ...f, [chave]: mascaraBR(valor) }));
  };

  const limpar = () => {
    setForm({ ...vazio });
  };

  const numeros = useMemo(() => {
    const base = Object.fromEntries(
      linhasEbitda.map((l) => [l.chave, paraNumero(form[l.chave])]),
    ) as Record<LinhaEbitdaChave, number>;
    base.receitaVendas = 0;
    base.custo = 0;
    return base;
  }, [form]);

  const mutation = useMutation({
    mutationFn: async () => await salvar({ data: { ibm, mes, ...numeros } }),
    onSuccess: async (_dados, _v, _c) => {
      await queryClient.invalidateQueries({ queryKey: ["contabil"] });
      return { ibm, mes };
    },
    onError: (erro: Error) =>
      toast.error("Não foi possível salvar os valores", { description: erro.message }),
  });

  const nome = ibm === IBM_REDE ? "Rede (consolidado)" : (lojas.find((l) => l.ibm === ibm)?.nome ?? ibm);

  const concluir = () => {
    mutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Valores salvos no lançamento contábil", {
          description: `${nome} · ${rotuloMes(mes)}`,
        });
        onAberto(false);
      },
    });
  };

  return (
    <Dialog open={aberto} onOpenChange={onAberto}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Lançar valores da DRE</DialogTitle>
          <DialogDescription>
            Preencha as rubricas manuais do posto e do mês. Métricas do BI e totais permanecem automáticos.
          </DialogDescription>
        </DialogHeader>

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

        <div className="space-y-4">
          {gruposLancamentoDre.map((grupo) => (
            <section key={grupo.titulo} className="overflow-hidden rounded-md border border-border">
              <header className="border-b border-border bg-surface-muted px-4 py-2.5">
                <h3 className="text-sm font-bold text-foreground">{grupo.titulo}</h3>
              </header>
              <div className="grid gap-x-4 gap-y-3 p-4 sm:grid-cols-2">
                {grupo.chaves.map((chave) => {
                  const linha = linhasEbitda.find((item) => item.chave === chave);
                  if (!linha) return null;
                  return (
                    <div key={chave} className="grid min-w-0 gap-1.5">
                      <Label htmlFor={`ebitda-${chave}`} className="text-xs sm:text-sm">
                        {rotuloComSinal(chave, linha.label)}
                      </Label>
                      <Input
                        id={`ebitda-${chave}`}
                        inputMode="decimal"
                        placeholder="0,00"
                        value={form[chave]}
                        onChange={(e) => editar(chave, e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onAberto(false)}>
            Cancelar
          </Button>
          <Button variant="ghost" onClick={limpar}>
            Limpar campos
          </Button>
          <Button
            onClick={() => concluir()}
            disabled={!ibm || mutation.isPending}
            className="bg-gold text-gold-foreground hover:bg-gold/90"
          >
            {mutation.isPending ? "Salvando…" : "Salvar valores"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
