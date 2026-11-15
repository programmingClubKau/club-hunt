import type { RouteModule } from '../src/types/globals'
import { prisma } from '@club/db'

const route: RouteModule = {
  method: 'POST',
  path: '/admin/routes/:id/status',
  auth: 'admin',
  async handler(req, reply) {
    const id = Number((req.params as { id: string }).id)
    const status = String((req.body as { status?: string })?.status ?? '')
    if (!['draft', 'open', 'closed'].includes(status)) {
      return reply.code(400).send({ ok: false, error: 'bad_status' })
    }
    await prisma.route.update({ where: { id }, data: { status: status as 'draft' | 'open' | 'closed' } })
    return { ok: true }
  },
}

export default route
