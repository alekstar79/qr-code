import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: resolve(__dirname, 'src/demo'),
  build: {
    outDir: '../../dist/demo',
    emptyOutDir: true
  }
})
