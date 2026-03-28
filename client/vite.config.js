import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load environment variables based on NODE_ENV
// Default to development if NODE_ENV is not set
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
const envPath = path.resolve(__dirname, envFile)

if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath))
  Object.keys(envConfig).forEach(key => {
    process.env[key] = envConfig[key]
  })
}

// isDevelopment is true if NODE_ENV is not set OR explicitly set to development
const isDevelopment = process.env.NODE_ENV !== 'production'

// https://vite.dev/config/
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
    port: 4173,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: isDevelopment ? 'inline' : false,
    minify: isDevelopment ? false : 'terser',
    terserOptions: isDevelopment ? {} : {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      output: {
        comments: false,
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
  optimize: {
    exclude: ['node_modules'],
  },
  esbuild: {
    drop: isDevelopment ? [] : ['console', 'debugger'],
  },
})
