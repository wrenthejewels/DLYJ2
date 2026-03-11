import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, 'assets'),
    emptyOutDir: false,
    sourcemap: false,
    cssCodeSplit: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/role-graph-editor/main.tsx'),
      output: {
        entryFileNames: 'role-graph-editor.js',
        chunkFileNames: 'role-graph-editor-[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'role-graph-editor.css';
          }
          return 'role-graph-editor-[name][extname]';
        }
      }
    }
  }
});
