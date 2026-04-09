import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  ssr: false,
  modules: ['@tresjs/nuxt'],
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-01-01',
  vite: {
    optimizeDeps: {
      include: ['llamaindex', '@llamaindex/openai', 'openai', 'wink-bm25-text-search']
    }
  }
})
