import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  
  return {
    plugins: [
      react(),
      tailwindcss(),
      // Image optimization for production builds
      isProduction && ViteImageOptimizer({
        jpg: {
          quality: 80,
        },
        jpeg: {
          quality: 80,
        },
        png: {
          quality: 80,
        },
        webp: {
          lossless: false,
          quality: 80,
        },
        svg: {
          multipass: true,
          plugins: [
            { name: 'preset-default' },
          ],
        },
      }),
      // Gzip compression for assets
      isProduction && viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024, // Only compress files > 1kb
      }),
      // Brotli compression (better than gzip)
      isProduction && viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024,
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          // Remove console statements in production build
          drop_console: isProduction,
          drop_debugger: isProduction,
          // Additional optimizations
          passes: 2,
        },
        mangle: {
          safari10: true,
        },
        format: {
          comments: false,
        },
      },
      // Code splitting - let Vite handle it automatically to preserve dependency order
      rollupOptions: {
        output: {
          // Remove manualChunks to let Vite handle chunking automatically
          // This prevents module initialization order issues
        },
      },
      // Target modern browsers for smaller bundle
      target: 'es2020',
      // Enable CSS code splitting
      cssCodeSplit: true,
      // Chunk size warning limit (increased since we have proper code splitting)
      chunkSizeWarningLimit: 600,
      // Disable source maps in production
      sourcemap: isProduction ? false : true,
      // Report compressed size for analysis
      reportCompressedSize: true,
    },
    // Optimize dependencies pre-bundling
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'react-redux'],
      exclude: ['@vite/client', '@vite/env'],
    },
    // Enable gzip compression hints
    server: {
      headers: {
        'Cache-Control': 'public, max-age=31536000',
      },
    },
  }
})
