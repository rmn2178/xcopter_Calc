import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('recharts')) return 'charts'
          if (id.includes('react-i18next') || id.includes('i18next')) return 'i18n'
          if (id.includes('react-dom') || id.includes('react')) return 'react'
          return undefined
        },
      },
    },
  },
})
