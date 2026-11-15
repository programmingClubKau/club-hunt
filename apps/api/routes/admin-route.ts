import type { RouteModule } from '../src/types/globals'
import { prisma } from '@club/db'

const route: RouteModule = {
  method: ['GET', 'PATCH'],
  path: '/admin/routes/:id',
  auth: 'admin',
  async handler(req, reply) {
    const id = Number((req.params as { id: string }).id)
    if (!Number.isInteger(id)) return reply.code(400).send({ ok: false, error: 'bad_id' })
    const existing = await prisma.route.findUnique({ where: { id } })
    if (!existing) return reply.code(404).send({ ok: false, error: 'not_found' })

    if (req.method === 'PATCH') {
      const b = (req.body ?? {}) as { nameAr?: string; nameEn?: string; section?: string; drawCount?: number }
      const drawCount =
        b.drawCount === undefined ? undefined : Math.max(1, Math.min(50, Number(b.drawCount) || 1))
      await prisma.route.update({
        where: { id },
        data: {
          nameAr: b.nameAr !== undefined ? String(b.nameAr).trim() : undefined,
          nameEn: b.nameEn !== undefined ? String(b.nameEn).trim() : undefined,
          section: b.section === 'male' || b.section === 'female' ? b.section : undefined,
          drawCount,
        },
      })
    }

    const route = await prisma.route.findUnique({ where: { id } })
    const posters = await prisma.poster.findMany({
      where: { routeId: id },
      orderBy: [{ seq: 'asc' }, { id: 'asc' }],
    })
    return { ok: true, route, posters }
  },
}

export default route
