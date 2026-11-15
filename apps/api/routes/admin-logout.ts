import type { RouteModule } from '../src/types/globals'
import { clearAdminCookie } from '../src/lib/cookies'

const route: RouteModule = {
  method: 'POST',
  path: '/admin/logout',
  async handler(_req, reply) {
    clearAdminCookie(reply)
    return { ok: true }
  },
}

export default route
