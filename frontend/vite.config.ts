import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import basicSsl from "@vitejs/plugin-basic-ssl";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const devPort = Number(env.VITE_DEV_SERVER_PORT || 8080);
  const apiPrefix = env.VITE_API_PREFIX || "/api";
  const healthPath = env.VITE_HEALTH_PATH || "/health";
  const proxyTarget = env.VITE_API_PROXY_TARGET || "http://localhost:3001";
  const devHttps = (env.VITE_DEV_HTTPS || "false").toLowerCase() === "true";

  return {
    server: {
      host: "::",
      port: Number.isFinite(devPort) ? devPort : 8080,
      https: devHttps,
      proxy: {
        [apiPrefix]: proxyTarget,
        [healthPath]: proxyTarget,
      },
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), devHttps && basicSsl(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
