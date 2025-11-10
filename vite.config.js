import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app'),
    },
  },
  optimizeDeps: {
    include: ['lucide-react'],
    exclude: [],
  },
  server: {
    port: 3000,
    open: true,
    host: true, // Set to true to expose on network (or use --host flag)
    strictPort: false, // Try next available port if 3000 is taken
    hmr: {
      overlay: true, // Show error overlay in browser
    },
    watch: {
      // Improve file watching for CSS changes
      ignored: ['**/node_modules/**', '**/.git/**'],
    },
  },
  css: {
    devSourcemap: true,
  },
  preview: {
    port: 4173,
    host: false,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    // Disable sourcemaps in production (security + size)
    sourcemap: process.env.NODE_ENV === 'development',
    // Using esbuild (default) for faster builds
    minify: 'esbuild',
    // Reduced chunk size warning threshold
    chunkSizeWarningLimit: 500,
    // Enable compressed size reporting
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        // Better chunk naming for cache busting
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        // Enhanced manual chunking strategy
        manualChunks: (id) => {
          // React ecosystem
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router')) {
            return 'react-vendor'
          }
          
          // Supabase
          if (id.includes('node_modules/@supabase')) {
            return 'supabase-vendor'
          }
          
          // Lucide icons (large library)
          if (id.includes('node_modules/lucide-react')) {
            return 'icons-vendor'
          }
          
          // Charts (if using recharts)
          if (id.includes('node_modules/recharts')) {
            return 'charts-vendor'
          }
          
          // Admin page - split into separate chunk (HUGE - 7,476 lines)
          if (id.includes('admin/page.jsx')) {
            return 'admin-page'
          }
          
          // Large media components
          if (id.includes('components/MediaGallery') || 
              id.includes('components/CreatePostModal')) {
            return 'media-components'
          }
        },
      },
    },
    // Enable tree shaking
    treeshake: {
      moduleSideEffects: false,
    },
  },
  define: {
    global: 'globalThis',
  },
  // Clear console output on start
  clearScreen: true,
})

