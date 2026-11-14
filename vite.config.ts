import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';
import {prismMechanizerVitePlugin} from './scripts/prismVitePlugin.ts';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({command}) => {
  const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
  const buildBase =
    process.env.GITHUB_ACTIONS === 'true' && repoName ? `/${repoName}/` : './';

  return {
    base: command === 'build' ? buildBase : '/',
    plugins: [prismMechanizerVitePlugin(projectRoot), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': projectRoot,
      },
    },
    build: {
      chunkSizeWarningLimit: 650,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules/three')) {
              return 'vendor-three';
            }
            if (
              id.includes('node_modules/react') ||
              id.includes('node_modules/scheduler')
            ) {
              return 'vendor-react';
            }
            if (id.includes('generatedPrismConstants')) {
              return 'prism-constants';
            }
            if (id.includes('generatedPrismRuntime')) {
              return 'prism-runtime';
            }
            return undefined;
          },
        },
      },
    },
    server: {
      allowedHosts: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      allowedHosts: true,
    },
  };
});
