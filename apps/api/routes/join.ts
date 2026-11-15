import type { RouteModule } from '../src/types/globals'
import { createDevice, joinSession } from '../src/lib/game'
import { setDeviceCookie } from '../src/lib/cookies'

const route: RouteModule = {
  method: 'POST',
  path: '/join',
  async handler(req, reply) {
    const body = (req.body ?? {}) as { code?: string }
    const session = await joinSession(String(body.code ?? ''))
    if (!session) return reply.code(404).send({ ok: false, error: 'join_code_not_found' })

    // A second phone gets its own device token; revoking one never touches the other.
    const device = await createDevice(session.id, req.headers['user-agent'] ?? '')
    setDeviceCookie(reply, device.token)
    return { ok: true, code: session.code }
  },
}

export default route
