import type { RouteModule } from '../src/types/globals'
import { prisma, randomCode, randomToken } from '@club/db'

const route: RouteModule = {
  method: 'POST',
  path: '/admin/posters/:id/token',
  auth: 'admin',
  async handler(req) {
    const id = Number((req.params as { id: string }).id)
    const poster = await prisma.poster.update({
      where: { id },
      data: { token: randomToken(), humanCode: randomCode(6) },
    })
    return { ok: true, poster }
  },
}

export default route
