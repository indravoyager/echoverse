import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  build: {
    sourcemap: true,
    rollupOptions: {
      external: ['react-native-fs'],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react', 'clsx', 'tailwind-merge'],
          markdown: ['react-markdown', 'react-syntax-highlighter', 'remark-gfm', 'rehype-katex'],
          media: ['tesseract.js', 'jszip', 'html-to-image'],
          framer: ['framer-motion']
        }
      }
    },
    rolldownOptions: {
      external: ['react-native-fs'],
    }
  }
})
