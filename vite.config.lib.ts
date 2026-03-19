import { resolve } from 'path'
import { defineConfig } from 'vite'
import pkg from './package.json'

import dts from 'vite-plugin-dts'

const banner = `/*!
 * ${pkg.name} v${pkg.version}
 * ${new Date().getFullYear()} ${pkg.author.split(' <')[0]}
 * @license ${pkg.license}
 */`

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: 'lib',
      exclude: [
        'tests',
        'src/main.ts'
      ],
      entryRoot: 'src',
      copyDtsFiles: false
    })
  ],
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
    extensions: ['.ts']
  },
  build: {
    outDir: 'lib',
    emptyOutDir: true,
    copyPublicDir: false,
    target: 'es2022',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'QRCodeGenerator',
      fileName: (_, entryName) => `${entryName}.js`,
      formats: ['es']
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          if (!assetInfo.names?.[0]) return ''

          return '[name][extname]'
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      format: {
        comments: false,
        preamble: banner,
      },
    },
    sourcemap: false,
  }
})
