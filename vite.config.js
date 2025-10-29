import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    host: false, // Set to true to expose on network (or use --host flag)
    strictPort: false, // Try next available port if 3000 is taken
    hmr: {
      overlay: true, // Show error overlay in browser
    },
  },
  preview: {
    port: 4173,
    host: false,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Using esbuild (default) for faster builds
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js', '@supabase/auth-ui-react'],
        },
      },
    },
  },
  define: {
    global: 'globalThis',
  },
  // Clear console output on start
  clearScreen: true,
})

