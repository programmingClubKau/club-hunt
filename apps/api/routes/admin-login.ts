import type { RouteModule } from '../src/types/globals'
import { setAdminCookie } from '../src/lib/cookies'

const route: RouteModule = {
  method: 'POST',
  path: '/admin/login',
  async handler(req, reply) {
    const body = (req.body ?? {}) as { password?: string }
    const expected = process.env.ADMIN_PASSWORD ?? 'progg-hunt'
    if (String(body.password ?? '') !== expected) {
      return reply.code(401).send({ ok: false, error: 'wrong_password' })
    }
    setAdminCookie(reply)
    return { ok: true }
  },
}

export default route
