const react = require('@vitejs/plugin-react')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  base: '/marsa-medya/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
