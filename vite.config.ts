// vite.config.ts
import path from "path"; // Pastikan path diimpor
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: { 
    proxy: {
      '/api': {
         // Pastikan ini adalah URL backend API Anda yang benar
         target: 'https://akademik.online/api', 
         changeOrigin: true,
      }
    }
  },
  resolve: { 
    alias: {
      // Alias @ menunjuk ke direktori src
      // Menggunakan process.cwd() untuk path absolut yang lebih robust daripada __dirname
      "@": path.resolve(process.cwd(), "./src"), 
    },
  },
})