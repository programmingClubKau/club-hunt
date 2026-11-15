import type { RouteModule } from '../src/types/globals'
import { routePublic } from '../src/lib/game'

const route: RouteModule = {
  method: 'GET',
  path: '/routes/:id/public',
  async handler(req, reply) {
    const id = Number((req.params as { id: string }).id)
    if (!Number.isInteger(id)) return reply.code(400).send({ ok: false, error: 'bad_id' })
    const found = await routePublic(id)
    if (!found) return reply.code(404).send({ ok: false, error: 'route_not_open' })
    return {
      ok: true,
      route: {
        id: found.route.id,
        nameAr: found.route.nameAr,
        nameEn: found.route.nameEn,
        section: found.route.section,
        drawCount: found.drawCount,
      },
      stops: found.stops,
      drawCount: found.drawCount,
    }
  },
}

export default route
