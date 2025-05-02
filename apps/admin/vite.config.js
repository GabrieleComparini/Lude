import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'url';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    server: {
      port: 3002, // Different from your backend port
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    // Define build options
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
    // Forward environment variables to client
    define: {
      // Pass environment variables here if needed for compile-time values
    },
  };
}); 