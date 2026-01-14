import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor libraries into separate chunks
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge'],
            'vendor-icons': ['lucide-react'],
          }
        }
      }
    },
    // API keys are now handled server-side in Cloudflare Functions
    // No secrets should be bundled into the client
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
