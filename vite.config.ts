import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Deepseek / OpenRouter proxy: forwards client `/api/deepseek` to OpenRouter's
      // chat completions endpoint and injects a server-side Authorization header
      // using the OPENROUTER_API_KEY environment variable (set this locally).
      '/api/deepseek': {
        target: 'https://openrouter.ai/api/v1/chat/completions',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/deepseek/, ''),
        headers: {
          // The dev server will insert this header when proxying.
          // Set OPENROUTER_API_KEY in your environment before starting the dev server.
          Authorization: `Bearer ${env.OPENROUTER_API_KEY || ''}`,
        },
      },
    },
  },

  plugins: [
    // Staff/CRM portal's file-based routes (src/staff/routes/**) — generates
    // src/staff/routeTree.gen.ts. Scoped away from the default src/routes so
    // it only ever looks at the staff subtree, never the main app's pages.
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "src/staff/routes",
      generatedRouteTree: "src/staff/routeTree.gen.ts",
    }),
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Staff/CRM portal's own first-party modules — kept on a separate
      // alias (not "@") so its ~100 files don't collide with the main
      // app's own src/components/ui, src/lib, etc. of the same names.
      "@staff": path.resolve(__dirname, "./src/staff"),
    },
  },
  });
});
