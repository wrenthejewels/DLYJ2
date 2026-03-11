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
    lib: {
      entry: path.resolve(__dirname, 'src/role-graph-editor/main.tsx'),
      formats: ['es'],
      fileName: () => 'role-graph-editor',
      cssFileName: 'role-graph-editor',
    },
    rollupOptions: {
      output: {
        // Vite lib mode ES format produces .mjs by default;
        // rename to .js after build or run esbuild --minify on the output.
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
