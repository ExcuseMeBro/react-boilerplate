import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), ...tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: Number(env.VITE_DEV_PORT ?? 3000),
      strictPort: true,
    },
    preview: {
      host: '0.0.0.0',
      port: Number(env.VITE_PREVIEW_PORT ?? 4173),
    },
    build: {
      sourcemap: mode !== 'production',
      target: 'es2022',
      cssMinify: 'lightningcss',
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'react';
            }
            if (id.includes('node_modules/react-router-dom')) {
              return 'router';
            }
            if (id.includes('node_modules/@tanstack/react-query')) {
              return 'query';
            }
            if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
              return 'i18n';
            }
            if (id.includes('node_modules/motion')) {
              return 'motion';
            }
          },
        },
      },
    },
  };
});
