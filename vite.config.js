import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

/**
 * Config Vite.
 *
 * Le proxy de dev (`vite dev` uniquement, pas en build) cible par defaut
 * le backend AdonisJS local sur :3333. Pour pointer ailleurs (ex: prod),
 * definir VITE_PROXY_TARGET dans .env ou la commande :
 *   VITE_PROXY_TARGET=https://api.koumanci.chalenge14.com npm run dev
 *
 * En production le proxy n'est pas utilise — c'est nginx qui route /api
 * et /__transmit vers le backend (cf. nginx.conf).
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:3333'
  const isHttps = proxyTarget.startsWith('https://')

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: isHttps
        },
        '/__transmit': {
          target: proxyTarget,
          changeOrigin: true,
          secure: isHttps
        }
      }
    }
  }
})
