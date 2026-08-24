import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_BASE_URL?.trim();

  return {
    plugins: [react(), tailwindcss()],
    server: apiTarget ? {
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
      },
    } : undefined,
  };
});
