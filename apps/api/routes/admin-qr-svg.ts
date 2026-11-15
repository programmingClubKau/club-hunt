import type { RouteModule } from '../src/types/globals'
import { prisma } from '@club/db'
import QRCode from 'qrcode'

const route: RouteModule = {
  method: 'GET',
  path: '/admin/posters/:id/qr.svg',
  auth: 'admin',
  async handler(req, reply) {
    const id = Number((req.params as { id: string }).id)
    const poster = await prisma.poster.findUnique({ where: { id } })
    if (!poster) return reply.code(404).send({ ok: false, error: 'not_found' })

    const base = String((req.query as { base?: string })?.base ?? '').replace(/\/$/, '')
    const setting = await prisma.setting.findUnique({ where: { key: 'base_url' } })
    const origin = base || setting?.value || ''
    const target = `${origin}/s/${poster.token}`

    const svg = await QRCode.toString(target, {
      type: 'svg',
      margin: 1,
      width: 320,
      errorCorrectionLevel: 'M',
      color: { dark: '#0b0c0f', light: '#ffffff' },
    })
    return reply.type('image/svg+xml').send(svg)
  },
}

export default route
