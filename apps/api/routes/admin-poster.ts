import type { RouteModule } from '../src/types/globals'
import { prisma } from '@club/db'

const route: RouteModule = {
  method: ['GET', 'PATCH', 'DELETE'],
  path: '/admin/posters/:id',
  auth: 'admin',
  async handler(req, reply) {
    const id = Number((req.params as { id: string }).id)
    if (!Number.isInteger(id)) return reply.code(400).send({ ok: false, error: 'bad_id' })

    if (req.method === 'GET') {
      const poster = await prisma.poster.findUnique({ where: { id } })
      if (!poster) return reply.code(404).send({ ok: false, error: 'not_found' })
      const route = await prisma.route.findUnique({ where: { id: poster.routeId } })
      return { ok: true, poster, route: route && { id: route.id, nameAr: route.nameAr, section: route.section } }
    }

    if (req.method === 'DELETE') {
      await prisma.poster.delete({ where: { id } })
      return { ok: true }
    }

    const b = (req.body ?? {}) as Record<string, unknown>
    const poster = await prisma.poster.update({
      where: { id },
      data: {
        nameAr: b.nameAr !== undefined ? String(b.nameAr).trim() : undefined,
        nameEn: b.nameEn !== undefined ? String(b.nameEn).trim() : undefined,
        riddleAr: b.riddleAr !== undefined ? String(b.riddleAr).trim() : undefined,
        riddleEn: b.riddleEn !== undefined ? String(b.riddleEn).trim() : undefined,
        active: b.active !== undefined ? Boolean(b.active) : undefined,
        lat: b.lat === '' || b.lat === null ? null : b.lat === undefined ? undefined : Number(b.lat),
        lng: b.lng === '' || b.lng === null ? null : b.lng === undefined ? undefined : Number(b.lng),
      },
    })
    return { ok: true, poster }
  },
}

export default route
