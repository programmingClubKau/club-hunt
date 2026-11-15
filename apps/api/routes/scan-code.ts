import type { RouteModule } from '../src/types/globals'
import { resolveScan, sessionByDeviceToken } from '../src/lib/game'
import { readDeviceToken } from '../src/lib/cookies'

const route: RouteModule = {
  method: 'GET',
  path: '/scan/:code',
  async handler(req) {
    const code = (req.params as { code: string }).code
    const ua = req.headers['user-agent'] ?? ''
    const session = await sessionByDeviceToken(readDeviceToken(req))
    const result = await resolveScan(session, code, ua)
    return { ok: true, result }
  },
}

export default route
