export default {
  root: './',
  publicDir: 'assets',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        assetFileNames: 'assets/[name].[hash][extname]'
      }
    },
    copyPublicDir: true
  },
  assetsInclude: ['**/*.jpg', '**/*.png', '**/*.mp3']
};
