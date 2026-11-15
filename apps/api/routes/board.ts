import type { RouteModule } from '../src/types/globals'
import { prisma } from '@club/db'
import { leaderboard } from '../src/lib/game'

const route: RouteModule = {
  method: 'GET',
  path: '/board',
  async handler() {
    const routes = await prisma.route.findMany({
      where: { status: 'open' },
      orderBy: [{ section: 'asc' }, { id: 'desc' }],
    })
    const boards = await Promise.all(
      routes.map(async (r) => ({
        route: { id: r.id, nameAr: r.nameAr, nameEn: r.nameEn, section: r.section },
        rows: await leaderboard(r.id, 20),
      })),
    )
    return { ok: true, boards }
  },
}

export default route
