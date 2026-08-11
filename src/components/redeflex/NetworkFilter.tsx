import { Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REDE_ID } from "@/lib/redeflex-transform";
import type { Loja } from "@/lib/redeflex-dashboard";

type Props = {
  value: string;
  onChange: (value: string) => void;
  lojas: Loja[];
};

export function NetworkFilter({ value, onChange, lojas }: Props) {
  return (
    <label className="flex w-full min-w-0 flex-col gap-1.5 text-sm sm:w-auto sm:flex-row sm:items-center sm:gap-2">
      <span className="flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <Building2 className="h-4 w-4" />
        Visualizar
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-card font-semibold sm:w-[300px]">
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent className="max-w-[calc(100vw-2rem)]">
          <SelectItem value={REDE_ID}>Rede (todos os postos)</SelectItem>
          {lojas.map((loja) => (
            <SelectItem key={loja.ibm} value={loja.ibm}>
              {loja.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
