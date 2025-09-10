import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable compression
    reportCompressedSize: true
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  },
  // Performance optimizations and proxy configuration
  server: {
    hmr: {
      overlay: false
    },
    proxy: {
      '/api': {
        target: 'https://snapstrom-project-1.vercel.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  // Enable tree shaking
  esbuild: {
    treeShaking: true
  }
});

