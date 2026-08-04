import { Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REDE_ID, formatPostoLabel } from "@/lib/redeflex-transform";

type Props = {
  value: string;
  onChange: (value: string) => void;
  postos: string[];
};

export function NetworkFilter({ value, onChange, postos }: Props) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <Building2 className="h-4 w-4" />
        Visualizar
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[240px] bg-card font-semibold">
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={REDE_ID}>Rede (todos os postos)</SelectItem>
          {postos.map((posto) => (
            <SelectItem key={posto} value={posto}>
              {formatPostoLabel(posto)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
