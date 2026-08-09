import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc' // <-- Pastikan namanya sesuai dengan yang di-install
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})