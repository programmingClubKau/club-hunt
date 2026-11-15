import type { RouteModule } from '../src/types/globals'
import { prisma, randomCode, randomToken } from '@club/db'

const route: RouteModule = {
  method: 'POST',
  path: '/admin/routes/:id/posters',
  auth: 'admin',
  async handler(req, reply) {
    const routeId = Number((req.params as { id: string }).id)
    const found = await prisma.route.findUnique({ where: { id: routeId } })
    if (!found) return reply.code(404).send({ ok: false, error: 'not_found' })
    const b = (req.body ?? {}) as Record<string, unknown>
    const nameAr = String(b.nameAr ?? '').trim()
    const riddleAr = String(b.riddleAr ?? '').trim()
    if (!nameAr || !riddleAr) return reply.code(400).send({ ok: false, error: 'name_and_riddle_required' })

    const last = await prisma.poster.aggregate({ where: { routeId }, _max: { seq: true } })
    const poster = await prisma.poster.create({
      data: {
        routeId,
        nameAr,
        nameEn: String(b.nameEn ?? '').trim(),
        riddleAr,
        riddleEn: String(b.riddleEn ?? '').trim(),
        token: randomToken(),
        humanCode: randomCode(6),
        seq: (last._max.seq ?? 0) + 1,
        active: b.active === false ? false : true,
        lat: b.lat === '' || b.lat === undefined || b.lat === null ? null : Number(b.lat),
        lng: b.lng === '' || b.lng === undefined || b.lng === null ? null : Number(b.lng),
      },
    })
    return { ok: true, poster }
  },
}

export default route
