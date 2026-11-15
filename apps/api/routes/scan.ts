import type { RouteModule } from '../src/types/globals'
import { resolveScan, sessionByDeviceToken } from '../src/lib/game'
import { readDeviceToken } from '../src/lib/cookies'

const route: RouteModule = {
  method: 'POST',
  path: '/scan',
  async handler(req) {
    const body = (req.body ?? {}) as { code?: string }
    const ua = req.headers['user-agent'] ?? ''
    const session = await sessionByDeviceToken(readDeviceToken(req))
    const result = await resolveScan(session, String(body.code ?? ''), ua)
    return { ok: true, result }
  },
}

export default route
