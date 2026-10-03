import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react({ exclude: [/node_modules/, /ResumeDocument\.tsx$/] }), tailwindcss()],
  server: { port: 5173 },
  build: { chunkSizeWarningLimit: 2000 },
});
