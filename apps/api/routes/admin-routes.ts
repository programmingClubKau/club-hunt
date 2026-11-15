import type { RouteModule } from '../src/types/globals'
import { prisma } from '@club/db'

const route: RouteModule = {
  method: ['GET', 'POST'],
  path: '/admin/routes',
  auth: 'admin',
  async handler(req, reply) {
    if (req.method === 'GET') {
      const routes = await prisma.route.findMany({
        orderBy: [{ section: 'asc' }, { id: 'desc' }],
        include: { _count: { select: { posters: true } } },
      })
      const grouped = await prisma.huntSession.groupBy({
        by: ['routeId', 'status', 'isTest'],
        _count: { _all: true },
      })
      const rows = routes.map((r) => {
        const running = grouped
          .filter((g) => g.routeId === r.id && g.status === 'active')
          .reduce((n, g) => n + g._count._all, 0)
        const finished = grouped
          .filter((g) => g.routeId === r.id && g.status === 'finished' && !g.isTest)
          .reduce((n, g) => n + g._count._all, 0)
        return {
          id: r.id,
          nameAr: r.nameAr,
          nameEn: r.nameEn,
          section: r.section,
          status: r.status,
          drawCount: r.drawCount,
          posters: r._count.posters,
          running,
          finished,
        }
      })
      return { ok: true, routes: rows, hasBaseUrl: Boolean(await prisma.setting.findUnique({ where: { key: 'base_url' } })) }
    }

    const body = (req.body ?? {}) as { nameAr?: string; nameEn?: string; section?: string; drawCount?: number }
    const section = body.section === 'female' ? 'female' : 'male'
    const nameAr = String(body.nameAr ?? '').trim()
    if (!nameAr) return reply.code(400).send({ ok: false, error: 'name_required' })
    const drawCount = Math.max(1, Math.min(50, Number(body.drawCount) || 3))
    const created = await prisma.route.create({
      data: { nameAr, nameEn: String(body.nameEn ?? '').trim(), section, status: 'draft', drawCount },
    })
    return { ok: true, route: { id: created.id } }
  },
}

export default route
