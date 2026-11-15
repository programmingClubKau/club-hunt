import type { RouteModule } from '../src/types/globals'
import QRCode from 'qrcode'

/** Renders any short text as a QR, used for the winner badge verification link. */
const route: RouteModule = {
  method: 'GET',
  path: '/qr.svg',
  async handler(req, reply) {
    const text = String((req.query as { text?: string })?.text ?? '').slice(0, 300)
    if (!text) return reply.code(400).send({ ok: false, error: 'text_required' })
    const svg = await QRCode.toString(text, {
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
