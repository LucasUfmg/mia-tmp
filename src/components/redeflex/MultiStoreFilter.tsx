import { useState } from "react";
import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { Loja } from "@/lib/redeflex-dashboard";

type Props = {
  /** IBMs selecionados; lista vazia = rede inteira. */
  value: string[];
  onChange: (value: string[]) => void;
  lojas: Loja[];
};

export function MultiStoreFilter({ value, onChange, lojas }: Props) {
  const [aberto, setAberto] = useState(false);

  const rede = value.length === 0;
  const rotulo = rede
    ? "Rede (todos os postos)"
    : value.length === 1
      ? (lojas.find((l) => l.ibm === value[0])?.nome ?? `Posto ${value[0]}`)
      : `${value.length} postos selecionados`;

  function alternar(ibm: string) {
    onChange(value.includes(ibm) ? value.filter((id) => id !== ibm) : [...value, ibm]);
  }

  return (
    <label className="flex w-full min-w-0 flex-col gap-1.5 text-sm sm:w-auto sm:flex-row sm:items-center sm:gap-2">
      <span className="flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <Building2 className="h-4 w-4" />
        Visualizar
      </span>
      <Popover open={aberto} onOpenChange={setAberto}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={aberto}
            className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 text-left text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-[300px]"
          >
            <span className="truncate">{rotulo}</span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[min(22rem,calc(100vw-2rem))] p-0"
        >
          <Command>
            <CommandInput placeholder="Buscar posto…" />
            <CommandList className="max-h-72">
              <CommandEmpty>Nenhum posto encontrado.</CommandEmpty>
              <CommandGroup>
                <CommandItem value="__rede" onSelect={() => onChange([])}>
                  <Check className={cn("mr-2 h-4 w-4", rede ? "opacity-100" : "opacity-0")} />
                  <span className="font-semibold">Rede (todos os postos)</span>
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading="Postos">
                {lojas.map((loja) => {
                  const marcado = value.includes(loja.ibm);
                  return (
                    <CommandItem
                      key={loja.ibm}
                      value={`${loja.nome} ${loja.ibm}`}
                      onSelect={() => alternar(loja.ibm)}
                    >
                      <Check
                        className={cn("mr-2 h-4 w-4", marcado ? "opacity-100" : "opacity-0")}
                      />
                      <span className="truncate">{loja.nome}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
            <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2 text-xs">
              <span className="text-muted-foreground">
                {rede ? "Rede inteira" : `${value.length} de ${lojas.length}`}
              </span>
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onChange(lojas.map((l) => l.ibm))}
                  className="rounded-full bg-brand-soft px-3 py-1 font-bold text-brand"
                >
                  Selecionar todos
                </button>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="rounded-full px-3 py-1 font-bold text-muted-foreground hover:text-foreground"
                >
                  Limpar
                </button>
              </span>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </label>
  );
}