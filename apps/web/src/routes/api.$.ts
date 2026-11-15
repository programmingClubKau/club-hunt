import { createFileRoute } from '@tanstack/react-router'

const API_URL = process.env.API_URL ?? 'http://127.0.0.1:8794'

/**
 * Same origin passthrough for the things the browser loads directly:
 * sticker QR images and the CSV export. In development Vite proxies /api,
 * in production this route does the same job.
 */
async function proxy({ request }: { request: Request }): Promise<Response> {
  const url = new URL(request.url)
  const target = `${API_URL}${url.pathname.replace(/^\/api/, '')}${url.search}`

  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.delete('content-length')

  const init: RequestInit = { method: request.method, headers, redirect: 'manual' }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer()
  }

  const upstream = await fetch(target, init)

  const out = new Headers()
  for (const [key, value] of upstream.headers) {
    if (key === 'content-encoding' || key === 'content-length' || key === 'transfer-encoding') continue
    if (key === 'set-cookie') continue
    out.append(key, value)
  }
  for (const cookie of upstream.headers.getSetCookie()) out.append('set-cookie', cookie)

  return new Response(upstream.body, { status: upstream.status, headers: out })
}

export const Route = createFileRoute('/api/$')({
  server: { handlers: { ANY: proxy } },
})
