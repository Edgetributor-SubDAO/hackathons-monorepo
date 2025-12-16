// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  vite: {
    define: {
      'global': 'globalThis',
    },
    resolve: {
      alias: {
        buffer: 'buffer',
        process: 'process/browser',
      }
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis'
        }
      }
    }
  }
});
