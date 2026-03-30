import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load environment variables based on NODE_ENV
// .env files are only used for local development
// For Azure Web Apps: set environment variables in CI/CD pipeline before build
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
const envPath = path.resolve(__dirname, envFile)

if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath))
  Object.keys(envConfig).forEach(key => {
    process.env[key] = envConfig[key]
  })
} else if (process.env.NODE_ENV !== 'production') {
  console.warn(
    `⚠️  Environment file not found: ${envFile}. Using process.env variables.`
  )
}

// Validate required environment variables for build
const requiredEnvVars = process.env.NODE_ENV === 'production' 
  ? ['VITE_API_URL', 'VITE_BACKEND_URL', 'VITE_STRIPE_PUBLIC_KEY']
  : []

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])
if (missingEnvVars.length > 0 && process.env.NODE_ENV === 'production') {
  console.warn(
    `⚠️  Missing environment variables for production build: ${missingEnvVars.join(', ')}`
  )
}

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
