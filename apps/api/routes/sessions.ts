import type { RouteModule } from '../src/types/globals'
import { startSession } from '../src/lib/game'
import { setDeviceCookie } from '../src/lib/cookies'

const route: RouteModule = {
  method: 'POST',
  path: '/sessions',
  async handler(req, reply) {
    const body = (req.body ?? {}) as { routeId?: number; mode?: string; name?: string }
    const routeId = Number(body.routeId)
    if (!Number.isInteger(routeId)) return reply.code(400).send({ ok: false, error: 'bad_route' })
    const mode = body.mode === 'solo' ? 'solo' : 'team'
    const name = String(body.name ?? '').trim()
    if (!name) return reply.code(400).send({ ok: false, error: 'name_required' })

    try {
      const { session, deviceToken } = await startSession({
        routeId,
        mode,
        name,
        ua: req.headers['user-agent'] ?? '',
      })
      setDeviceCookie(reply, deviceToken)
      return { ok: true, code: session.code, joinCode: session.joinCode }
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode ?? 500
      return reply.code(status).send({ ok: false, error: (err as Error).message })
    }
  },
}

export default route
