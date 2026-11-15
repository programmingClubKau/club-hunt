import type { RouteModule } from '../src/types/globals'
import { prisma } from '@club/db'

const route: RouteModule = {
  method: 'GET',
  path: '/admin/routes/:id/export.csv',
  auth: 'admin',
  async handler(req, reply) {
    const routeId = Number((req.params as { id: string }).id)
    const sessions = await prisma.huntSession.findMany({
      where: { routeId },
      orderBy: { startedAt: 'asc' },
    })
    const csv = [
      'name,mode,status,section,started_at,finished_at,duration_seconds,is_test,join_code',
      ...sessions.map((s) =>
        [
          `"${s.name.replaceAll('"', '""')}"`,
          s.mode,
          s.status,
          s.section,
          s.startedAt.toISOString(),
          s.finishedAt ? s.finishedAt.toISOString() : '',
          s.durationMs ? (s.durationMs / 1000).toFixed(1) : '',
          s.isTest,
          s.joinCode,
        ].join(','),
      ),
    ].join('\n')

    return reply
      .type('text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="route-${routeId}-results.csv"`)
      .send(csv)
  },
}

export default route
