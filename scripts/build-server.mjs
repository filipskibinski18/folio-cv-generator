import { build } from 'vite';
await build({ configFile: false, build: { ssr: 'server/index.ts', outDir: 'dist-server', rollupOptions: { output: { entryFileNames: 'index.mjs' } } } });
