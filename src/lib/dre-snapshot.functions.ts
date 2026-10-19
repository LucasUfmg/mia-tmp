import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Chamado pela aba Contábil: grava o consolidado da DRE para a Mia ler instantaneamente. */
export const atualizarDreSnapshot = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ mes: z.string().regex(/^\d{4}-\d{2}$/), ibms: z.array(z.string()).max(100).optional() }).parse(i),
  )
  .handler(async ({ data }) => {
    const { gravarSnapshot } = await import("./mia/dre-snapshot.server");
    const base = { mes: data.mes, ...(data.ibms?.length ? { ibms: data.ibms } : {}) };
    await Promise.all([gravarSnapshot({ periodo: "mes", ...base }), gravarSnapshot({ periodo: "ano", ...base })]);
    return { ok: true };
  });
