import { resolve} from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
    extensions: ['.ts']
  },
  build: {
    outDir: 'dist',
    copyPublicDir: false,
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          if (!assetInfo.names?.[0]) return ''

          const name = assetInfo.names[0].split('/').pop()

          if (name && name.endsWith('.css')) {
            return `css/${name}`
          }

          return '[name][extname]'
        }
      }
    }
  },
  server: {
    port: 3000
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['legacy-js-api']
      }
    }
  }
})
