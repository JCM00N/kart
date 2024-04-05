import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig(({command}) => {
  const isDev = command === 'serve';
  
  return {
    mode: isDev ? 'development' : 'production',
    plugins: [
      nodePolyfills({include: ['buffer']}),
      svelte({
        compilerOptions: {
          dev: isDev,
        }
      }),
    ],
    server: {
      watch: {
        ignored: ['!**/node_modules/chainweb/**']
      },    
      port: 8111
    },
    optimizeDeps: {
      exclude: ['chainweb.js'],
    }
  }
});