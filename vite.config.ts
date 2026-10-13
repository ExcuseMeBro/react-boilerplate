import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, lazyPlugins } from "vite-plus";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    fmt: {},
    lint: {
      jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
      rules: { "vite-plus/prefer-vite-plus-imports": "error" },
      options: { typeAware: true, typeCheck: true },
    },
    test: {
      environment: "node",
      clearMocks: true,
      restoreMocks: true,
      unstubGlobals: true,
      unstubEnvs: true,
    },
    plugins: lazyPlugins(() => [react(), ...tailwindcss()]) ?? [],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      host: env.VITE_DEV_HOST ?? "127.0.0.1",
      port: Number(env.VITE_DEV_PORT ?? 3000),
      strictPort: true,
    },
    preview: {
      host: env.VITE_DEV_HOST ?? "127.0.0.1",
      port: Number(env.VITE_PREVIEW_PORT ?? 4173),
      strictPort: true,
    },
    build: {
      sourcemap: mode !== "production",
      target: "es2022",
      cssMinify: "lightningcss",
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
              return "react";
            }
            if (id.includes("node_modules/react-router-dom")) {
              return "router";
            }
            if (id.includes("node_modules/@tanstack/react-query")) {
              return "query";
            }
            if (id.includes("node_modules/i18next") || id.includes("node_modules/react-i18next")) {
              return "i18n";
            }
            if (id.includes("node_modules/motion")) {
              return "motion";
            }
          },
        },
      },
    },
  };
});
