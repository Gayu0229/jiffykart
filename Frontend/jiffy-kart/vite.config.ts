import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3002,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      global: 'window',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor: React core
            'vendor-react': ['react', 'react-dom'],
            // Vendor: Networking & utilities
            'vendor-utils': ['axios', '@stomp/stompjs', 'sockjs-client'],
            // Vendor: Icons
            'vendor-icons': ['lucide-react'],
          }
        }
      },
      // Increase the chunk warning limit (optional)
      chunkSizeWarningLimit: 600,
    }
  };
});
