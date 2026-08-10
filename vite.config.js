import { defineConfig } from 'vite'

const streamTarget = 'http://eco.onestreaming.com:8107'
const base = '/webapp/'

export default defineConfig({
  base,
  server: {
    host: true,
    proxy: {
      [`${base}stream`]: {
        target: streamTarget,
        changeOrigin: true,
        rewrite: () => '/stream',
        headers: {
          'Icy-MetaData': '1',
        },
      },
    },
  },
  preview: {
    host: true,
    proxy: {
      [`${base}stream`]: {
        target: streamTarget,
        changeOrigin: true,
        rewrite: () => '/stream',
      },
    },
  },
})
