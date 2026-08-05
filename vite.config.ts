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

export default defineConfig({
  plugins: [punycodeShim()],
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
