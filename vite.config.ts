import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: './',
  build: {
    cssCodeSplit: true,
    emptyOutDir: true,
    minify: mode === 'production' ? 'oxc' : false,
    outDir: 'dist',
    rollupOptions: {
      input: 'src/ts/main.ts',
      output: {
        assetFileNames: (assetInfo) =>
          assetInfo.names.some((name) => name.endsWith('.css'))
            ? 'assets/main.css'
            : 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/main.js',
      },
    },
    sourcemap: mode === 'development',
    target: 'es2022',
  },
}));
