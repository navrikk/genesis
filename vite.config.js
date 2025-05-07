// vite.config.js
export default {
  root: './',
  publicDir: 'assets',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0, // Don't inline any assets as base64
    rollupOptions: {
      output: {
        manualChunks: undefined, // Ensure proper code splitting
        assetFileNames: 'assets/[name].[hash][extname]'
      }
    },
    // Ensure assets are copied to the correct directory
    copyPublicDir: true
  },
  // Ensure proper asset handling
  assetsInclude: ['**/*.jpg', '**/*.png', '**/*.mp3']
};
