import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Prefer IPv4 loopback so the proxy never fails when localhost resolves to ::1.
  const apiUrl = env.VITE_API_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3000';

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/uploads': {
          target: apiUrl,
          changeOrigin: true,
        },
      },
    },
  };
})
