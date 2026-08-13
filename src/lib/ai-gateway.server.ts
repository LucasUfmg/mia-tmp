import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Provider do Lovable AI Gateway (rota de chat/completions).
 * Criado por requisição — nunca como singleton de módulo.
 */
export function createLovableAiGatewayProvider(lovableApiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}
