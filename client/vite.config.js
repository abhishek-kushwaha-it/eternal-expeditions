import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression'

// https://vite.dev/config/
// Vite automatically loads .env and .env.{mode} files
// For production builds: use .env.production
// For development: use .env.development or .env
const isDevelopment = process.env.NODE_ENV !== 'production'

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: 'react',
      babel: {     
        parserOpts: {
          plugins: ['jsx', 'typescript'],
        },
      },
    }),
    compression({
      verbose: !isDevelopment,
      disable: isDevelopment,
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz',
    }),
  ],
  define: { 
    __DEV__: JSON.stringify(isDevelopment),
    __PROD__: JSON.stringify(!isDevelopment), 
  },
  server: {
    port: 5173,
    strictPort: false,
    open: false,
    cors: true,
    hmr: true,
  },
  preview: {
    port: 5173,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: isDevelopment ? 'inline' : false,
    minify: 'terser',
    reportCompressedSize: false,
    terserOptions: {
      compress: {
        drop_console: !isDevelopment,
        drop_debugger: !isDevelopment,
      },
      output: {
        comments: isDevelopment,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          utils: ['axios', '@tanstack/react-query'],
        },
        entryFileNames: isDevelopment ? '[name].js' : '[name].[hash].js',
        chunkFileNames: isDevelopment ? '[name].js' : '[name].[hash].js',
        assetFileNames: isDevelopment ? '[name].[ext]' : '[name].[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: !isDevelopment,
    emptyOutDir: true,
  },
})
