import { defineConfig } from 'vite';

export default defineConfig({
  base: '/elitewebsiteview/',

  server: {
    port: 3000,
    open: true,
    host: true
  },

  build: {
    outDir: 'dist',
    minify: 'terser',
    assetsInlineLimit: 0
  }
});