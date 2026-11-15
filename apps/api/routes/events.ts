import type { RouteModule } from '../src/types/globals'
import { prisma } from '@club/db'

const route: RouteModule = {
  method: 'GET',
  path: '/events/:section',
  async handler(req, reply) {
    const section = (req.params as { section: string }).section
    if (section !== 'male' && section !== 'female') {
      return reply.code(400).send({ ok: false, error: 'bad_section' })
    }
    const rows = await prisma.route.findMany({
      where: { section, status: 'open', posters: { some: { active: true } } },
      orderBy: { id: 'desc' },
      include: { _count: { select: { posters: { where: { active: true } } } } },
    })
    return {
      ok: true,
      events: rows.map((r) => ({
        id: r.id,
        nameAr: r.nameAr,
        nameEn: r.nameEn,
        drawCount: r.drawCount,
        stops: r._count.posters,
      })),
    }
  },
}

export default route
