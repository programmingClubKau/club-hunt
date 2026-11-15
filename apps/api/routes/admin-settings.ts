import type { RouteModule } from '../src/types/globals'
import { prisma } from '@club/db'

const route: RouteModule = {
  method: ['GET', 'PUT'],
  path: '/admin/settings',
  auth: 'admin',
  async handler(req) {
    if (req.method === 'PUT') {
      const body = (req.body ?? {}) as { baseUrl?: string }
      const value = String(body.baseUrl ?? '').trim().replace(/\/$/, '')
      await prisma.setting.upsert({
        where: { key: 'base_url' },
        create: { key: 'base_url', value },
        update: { value },
      })
    }
    const baseUrl = await prisma.setting.findUnique({ where: { key: 'base_url' } })
    return { ok: true, baseUrl: baseUrl?.value ?? '' }
  },
}

export default route
