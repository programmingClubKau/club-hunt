import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import { loadRoutes } from '../tools/loadRoutes'

const PORT = Number(process.env.PORT ?? 8794)
const HOST = process.env.HOST ?? '0.0.0.0'

export async function buildServer() {
  const app = Fastify({
    logger:
      process.env.NODE_ENV === 'test'
        ? false
        : {
            level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
          },
    trustProxy: true,
  })

  await app.register(cookie, { secret: process.env.COOKIE_SECRET ?? 'dev-only-change-me' })
  await app.register(cors, {
    origin: true,
    credentials: true,
  })

  // Admin routes are declared with auth: 'admin' and checked here, not in each handler.
  app.addHook('preHandler', async (req, reply) => {
    if (req.routeOptions.config?.auth !== 'admin') return
    const raw = req.cookies.adm
    const unsigned = raw ? req.unsignCookie(raw) : null
    if (!unsigned?.valid || unsigned.value !== 'ok') {
      return reply.code(401).send({ ok: false, error: 'unauthorized' })
    }
  })

  app.get('/health', async () => ({ ok: true, service: 'club-hunt-api' }))

  const registered = await loadRoutes(app)
  app.log.info({ routes: registered.length }, 'routes loaded')

  app.setErrorHandler((err: { statusCode?: number; message?: string }, _req, reply) => {
    app.log.error(err)
    const status = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500
    reply.code(status).send({ ok: false, error: status === 500 ? 'internal_error' : err.message })
  })

  return app
}

if (import.meta.main) {
  const app = await buildServer()
  app.listen({ port: PORT, host: HOST }).then(() => {
    console.log(`api on http://${HOST}:${PORT}`)
  })
}
