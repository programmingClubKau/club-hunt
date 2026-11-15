import type { RouteModule } from '../src/types/globals'
import { prisma } from '@club/db'
import { leaderboard } from '../src/lib/game'

const route: RouteModule = {
  method: 'GET',
  path: '/leaderboard/:routeId',
  async handler(req, reply) {
    const routeId = Number((req.params as { routeId: string }).routeId)
    if (!Number.isInteger(routeId)) return reply.code(400).send({ ok: false, error: 'bad_route' })
    const found = await prisma.route.findUnique({ where: { id: routeId } })
    if (!found) return reply.code(404).send({ ok: false, error: 'not_found' })
    const rows = await leaderboard(routeId, 50)
    return {
      ok: true,
      route: { id: found.id, nameAr: found.nameAr, nameEn: found.nameEn, section: found.section },
      rows,
    }
  },
}

export default route
