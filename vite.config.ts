import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: './',
  build: {
    cssCodeSplit: true,
    emptyOutDir: true,
    minify: mode === 'production' ? 'oxc' : false,
    outDir: 'dist',
    rollupOptions: {
      input: {
        cart: 'src/css/cart.css',
        checkout: 'src/css/checkout.css',
        main: 'src/ts/main.ts',
      },
      output: {
        assetFileNames: (assetInfo) =>
          assetInfo.names.some((name) => name.endsWith('.css'))
            ? 'assets/[name][extname]'
            : 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name].js',
      },
    },
    sourcemap: mode === 'development',
    target: 'es2022',
  },
}));
