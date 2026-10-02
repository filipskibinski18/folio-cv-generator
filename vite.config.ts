import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Preserve the default dependency exclusion: Fast Refresh uses window and must
  // never be injected into react-pdf's dependencies or the document worker.
  plugins: [react({ exclude: [/node_modules/, /ResumeDocument\.tsx$/] }), tailwindcss()],
  server: { port: 5173 },
  build: { chunkSizeWarningLimit: 2000 },
});
