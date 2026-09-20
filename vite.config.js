import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/tpl-desktop-plugin-demo/',
  plugins: [vue()],
  server: {
    port: 5273,
    cors: true,
    host: '0.0.0.0',
    watch: {
      usePolling: true,
      interval: 1000,
    },
    hmr: {
      overlay: true,
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html'
      },
    },
  },
})
