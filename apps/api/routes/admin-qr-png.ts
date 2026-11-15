import type { RouteModule } from '../src/types/globals'
import { prisma } from '@club/db'
import QRCode from 'qrcode'

const route: RouteModule = {
  method: 'GET',
  path: '/admin/posters/:id/qr.png',
  auth: 'admin',
  async handler(req, reply) {
    const id = Number((req.params as { id: string }).id)
    const poster = await prisma.poster.findUnique({ where: { id } })
    if (!poster) return reply.code(404).send({ ok: false, error: 'not_found' })

    const base = String((req.query as { base?: string })?.base ?? '').replace(/\/$/, '')
    const setting = await prisma.setting.findUnique({ where: { key: 'base_url' } })
    const origin = base || setting?.value || ''
    const target = `${origin}/s/${poster.token}`

    const png = await QRCode.toBuffer(target, {
      type: 'png',
      margin: 2,
      width: 900,
      errorCorrectionLevel: 'M',
      color: { dark: '#0b0c0f', light: '#ffffff' },
    })
    return reply
      .type('image/png')
      .header('Content-Disposition', `attachment; filename="qr-${poster.token}.png"`)
      .send(Buffer.from(png))
  },
}

export default route
