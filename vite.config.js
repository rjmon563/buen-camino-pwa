import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuración para permitir el acceso desde el móvil (Network)
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Esto hace que Vite escuche en todas las direcciones de red local
    port: 5173,
  }
})