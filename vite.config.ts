// admin-panel-frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { // <--- Tambahkan atau modifikasi bagian server ini
    proxy: {
      // Semua permintaan dari frontend ke path yang dimulai '/api'
      // akan diteruskan ke target di bawah ini.
      '/api': {
         target: 'http://37.44.244.93:3000', // <-- URL Backend API Anda di VPS (termasuk port)
         changeOrigin: true, // <-- Penting, ubah header 'Host' ke target URL
         secure: false,      // <-- Biarkan false jika targetnya HTTP biasa
        // 'rewrite' biasanya tidak diperlukan jika path '/api' sudah benar di target
        // rewrite: (path) => path.replace(/^\/api/, '/api')
      }
      // Anda bisa menambahkan aturan proxy lain di sini jika perlu
    }
  }
})