import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { salvarLancamento } from "@/lib/contabil.functions";
import { campos, mesesDoAno, rotuloMes, type CampoChave, type Lancamento } from "@/lib/contabil";
import type { Loja } from "@/lib/redeflex-dashboard";

type Props = {
  aberto: boolean;
  onAberto: (v: boolean) => void;
  lojas: Loja[];
  lancamentos: Lancamento[];
  ano: string;
  mesInicial: string;
  ibmInicial?: string;
};

type Form = Record<CampoChave, string>;

const vazio = Object.fromEntries(campos.map((c) => [c.chave, ""])) as Form;

function paraForm(l: Lancamento | undefined): Form {
  if (!l) return { ...vazio };
  return Object.fromEntries(
    campos.map((c) => [c.chave, l[c.chave] === 0 ? "" : String(l[c.chave]).replace(".", ",")]),
  ) as Form;
}

/** Aceita "1.234.567,89" e "1234567.89". */
function paraNumero(valor: string): number {
  const limpo = valor.trim().replace(/\s|R\$|%/g, "");
  if (!limpo) return 0;
  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo;
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : 0;
}

export function LancamentoDialog({
  aberto,
  onAberto,
  lojas,
  lancamentos,
  ano,
  mesInicial,
  ibmInicial,
}: Props) {
  const [ibm, setIbm] = useState(ibmInicial ?? lojas[0]?.ibm ?? "");
  const [mes, setMes] = useState(mesInicial);
  const [form, setForm] = useState<Form>({ ...vazio });
  const queryClient = useQueryClient();
  const salvar = useServerFn(salvarLancamento);

  const meses = useMemo(() => mesesDoAno(ano), [ano]);

  useEffect(() => {
    if (!aberto) return;
    setIbm(ibmInicial ?? lojas[0]?.ibm ?? "");
    setMes(mesInicial);
  }, [aberto, ibmInicial, mesInicial, lojas]);

  // Carrega o lançamento existente do posto/mês selecionado.
  useEffect(() => {
    const existente = lancamentos.find((l) => l.ibm === ibm && l.mes === mes);
    setForm(paraForm(existente));
  }, [ibm, mes, lancamentos]);

  const mutation = useMutation({
    mutationFn: async () => {
      const valores = Object.fromEntries(
        campos.map((c) => [c.chave, paraNumero(form[c.chave])]),
      ) as Record<CampoChave, number>;
      return await salvar({ data: { ibm, mes, ...valores } });
    },
    onSuccess: () => {
      toast.success("Lançamento salvo", {
        description: `${lojas.find((l) => l.ibm === ibm)?.nome ?? ibm} · ${rotuloMes(mes)}`,
      });
      void queryClient.invalidateQueries({ queryKey: ["contabil"] });
      onAberto(false);
    },
    onError: (erro: Error) => toast.error("Não foi possível salvar", { description: erro.message }),
  });

  return (
    <Dialog open={aberto} onOpenChange={onAberto}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Lançar dados contábeis</DialogTitle>
          <DialogDescription>
            Um lançamento por posto e mês. Salvar novamente no mesmo posto/mês atualiza os valores.
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

          {campos.map((c) => (
            <div key={c.chave} className="grid gap-2">
              <Label htmlFor={c.chave}>{c.label}</Label>
              <Input
                id={c.chave}
                inputMode="decimal"
                placeholder={c.tipo === "pct" ? "0,00" : "0,00"}
                value={form[c.chave]}
                onChange={(e) => setForm((f) => ({ ...f, [c.chave]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onAberto(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!ibm || mutation.isPending}
            className="bg-gold text-gold-foreground hover:bg-gold/90"
          >
            {mutation.isPending ? "Salvando…" : "Salvar lançamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
