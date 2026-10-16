import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

// Config explícito (antes vinha de @lovable.dev/vite-tanstack-config).
// Na Vercel o Nitro detecta o preset sozinho; localmente roda como Node.
export default defineConfig({
  server: { port: 3000 },
  plugins: [
    tsConfigPaths(),
    // Usa src/server.ts como entrada do servidor (wrapper de erro do SSR).
    tanstackStart({ server: { entry: "server" } }),
    viteReact(),
    tailwindcss(),
    nitro(),
  ],
});
