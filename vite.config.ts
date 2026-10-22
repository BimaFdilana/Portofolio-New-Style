import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Untuk pengembangan panel admin: jalankan API PHP di port 8099
    // (php -S localhost:8099 -t dist server/api.php setelah build), atau abaikan —
    // situs publik tetap tampil dengan data bawaan.
    proxy: { '/api': 'http://localhost:8099' },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
