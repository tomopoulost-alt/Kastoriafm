import { defineConfig } from 'vite'

const streamTarget = 'http://eco.onestreaming.com:8107'

export default defineConfig({
  server: {
    host: true,
    proxy: {
      '/stream': {
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
      '/stream': {
        target: streamTarget,
        changeOrigin: true,
        rewrite: () => '/stream',
      },
    },
  },
})
