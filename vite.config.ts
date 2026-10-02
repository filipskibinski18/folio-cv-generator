import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Fast Refresh requires window; the PDF document also runs in a Web Worker.
  plugins: [react({ exclude: /ResumeDocument\.tsx$/ }), tailwindcss()],
  server: { port: 5173 },
  build: { chunkSizeWarningLimit: 2000 },
});
