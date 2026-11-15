import type { RouteModule } from '../src/types/globals'
import { prisma } from '@club/db'

const route: RouteModule = {
  method: 'POST',
  path: '/admin/posters/:id/move',
  auth: 'admin',
  async handler(req, reply) {
    const id = Number((req.params as { id: string }).id)
    const dir = Number((req.body as { dir?: number })?.dir) === -1 ? -1 : 1
    const poster = await prisma.poster.findUnique({ where: { id } })
    if (!poster) return reply.code(404).send({ ok: false, error: 'not_found' })

    const siblings = await prisma.poster.findMany({
      where: { routeId: poster.routeId },
      orderBy: [{ seq: 'asc' }, { id: 'asc' }],
    })
    const idx = siblings.findIndex((s) => s.id === id)
    const swap = siblings[idx + dir]
    if (!swap) return { ok: true, moved: false }

    // Two updates in one transaction: seq values are not unique but must not collide mid-way.
    await prisma.$transaction([
      prisma.poster.update({ where: { id: poster.id }, data: { seq: swap.seq } }),
      prisma.poster.update({ where: { id: swap.id }, data: { seq: poster.seq } }),
    ])
    return { ok: true, moved: true }
  },
}

export default route
