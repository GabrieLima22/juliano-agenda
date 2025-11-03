import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Quando servido em subpasta no Apache (ex.: /juliano-agenda/),
  // precisamos ajustar a base apenas no build.
  // Serviremos o app em /juliano-agenda/ sob o Apache.
  // Portanto, no build os assets usam essa base.
  base: mode === "production" ? "/juliano-agenda/" : "/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
