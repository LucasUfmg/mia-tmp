// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { createRequire } from "node:module";
import type { Plugin } from "vite";

const require_ = createRequire(import.meta.url);

/**
 * O driver do MongoDB (via tr46/whatwg-url) faz require("punycode/"), que o
 * unenv do Worker tenta resolver como diretório e quebra o build. Redireciona
 * para o pacote npm puro-JS.
 */
function punycodeShim(): Plugin {
  const real = require_.resolve("punycode/punycode.js");
  return {
    name: "redeflex-punycode-shim",
    enforce: "pre",
    resolveId(source) {
      if (source === "punycode/" || source === "punycode") {
        return real;
      }
      return null;
    },
    transform(code, id) {
      if (!id.includes("tr46") && !id.includes("whatwg-url")) return null;
      if (!code.includes('"punycode/"') && !code.includes("'punycode/'")) return null;
      return {
        code: code
          .replaceAll('require("punycode/")', `require(${JSON.stringify(real)})`)
          .replaceAll("require('punycode/')", `require(${JSON.stringify(real)})`)
          .replaceAll('from "punycode/"', `from ${JSON.stringify(real)}`),
        map: null,
      };
    },
  };
}

/**
 * O bson (usado pelo driver do MongoDB) gera bytes aleatórios no inicializador
 * estático de `ObjectId`, ou seja, durante a avaliação do módulo. No runtime do
 * Cloudflare isso conta como "escopo global" e derruba a requisição com
 * "Disallowed operation called within global scope". Aqui a inicialização passa
 * a ser tolerante a falha e é refeita sob demanda, já dentro do handler.
 */
function bsonLazyRandomShim(): Plugin {
  return {
    name: "redeflex-bson-lazy-random",
    enforce: "pre",
    transform(code, id) {
      if (!id.includes("bson")) return null;
      if (!code.includes("static resetState")) return null;
      let out = code;
      out = out.replace(
        /static\s*\{\s*this\.resetState\(\);/,
        "static {\n        try { this.resetState(); } catch { /* escopo global: refeito sob demanda */ }",
      );
      out = out.replace(
        /const PROCESS_UNIQUE = this\.PROCESS_UNIQUE;/,
        "if (this.PROCESS_UNIQUE == null) this.resetState();\n        const PROCESS_UNIQUE = this.PROCESS_UNIQUE;",
      );
      if (out === code) return null;
      return { code: out, map: null };
    },
  };
}

export default defineConfig({
  plugins: [punycodeShim(), bsonLazyRandomShim()],
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
