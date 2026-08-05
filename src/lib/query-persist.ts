import { dehydrate, hydrate, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

const CHAVE = "redeflex:query-cache";
const MAX_IDADE_MS = 10 * 60_000;

/**
 * Persiste o cache do TanStack Query em `sessionStorage` para que recarregar a
 * página mostre imediatamente a última leitura válida (por aba e intervalo),
 * sem disparar novamente as agregações pesadas.
 */
export function usePersistedQueryCache() {
  const queryClient = useQueryClient();
  const iniciado = useRef(false);

  useEffect(() => {
    if (iniciado.current) return;
    iniciado.current = true;

    try {
      const bruto = sessionStorage.getItem(CHAVE);
      if (bruto) {
        const { salvoEm, estado } = JSON.parse(bruto) as { salvoEm: number; estado: unknown };
        if (Date.now() - salvoEm < MAX_IDADE_MS) {
          hydrate(queryClient, estado);
        } else {
          sessionStorage.removeItem(CHAVE);
        }
      }
    } catch {
      // cache inválido — segue sem hidratar
    }

    const salvar = () => {
      try {
        sessionStorage.setItem(
          CHAVE,
          JSON.stringify({ salvoEm: Date.now(), estado: dehydrate(queryClient) }),
        );
      } catch {
        // storage cheio ou indisponível
      }
    };

    let agendado: ReturnType<typeof setTimeout> | undefined;
    const cancelar = queryClient.getQueryCache().subscribe(() => {
      if (agendado) clearTimeout(agendado);
      agendado = setTimeout(salvar, 1_000);
    });

    return () => {
      if (agendado) clearTimeout(agendado);
      cancelar();
      salvar();
    };
  }, [queryClient]);
}
