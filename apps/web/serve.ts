import { join, normalize, resolve } from 'node:path'
import server from './dist/server/server.js'

const CLIENT_DIR = resolve(import.meta.dir, 'dist/client')
const port = Number(process.env.PORT ?? 3080)

/**
 * The SSR handler only renders pages. Hashed assets, fonts and brand files in
 * dist/client have to be served here, otherwise the page arrives unstyled.
 */
const instance = Bun.serve({
  port,
  hostname: '0.0.0.0',
  idleTimeout: 60,
  async fetch(request) {
    const url = new URL(request.url)

    if (request.method === 'GET' || request.method === 'HEAD') {
      const path = normalize(decodeURIComponent(url.pathname))
      if (path !== '/' && !path.includes('..')) {
        const file = Bun.file(join(CLIENT_DIR, path))
        if (await file.exists()) {
          const immutable = path.startsWith('/assets/')
          return new Response(file, {
            headers: {
              'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
            },
          })
        }
      }
    }

    return server.fetch(request)
  },
})

console.log(`web listening on http://${instance.hostname}:${instance.port}`)
