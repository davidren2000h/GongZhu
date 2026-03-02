import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/GongZhu/',
  plugins: [react()],
  root: '.',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
  },
});
