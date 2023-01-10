import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { svelteSVG } from "rollup-plugin-svelte-svg";

// https://vitejs.dev/config/
export default defineConfig({
  mode: 'development',
  plugins: [
    svelte({
      compilerOptions: {
        dev: true,
      }
    }),
    svelteSVG({
      enforce: 'pre'
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
})
