import { createFileRoute, redirect } from '@tanstack/react-router'
import { api } from '../lib/api'

export const Route = createFileRoute('/admin/stickers/$id')({
  loader: async ({ params }) => {
    const [detail, settings] = await Promise.all([api.adminRoute(Number(params.id)), api.adminSettings()])
    if (!detail.ok || !detail.route) throw redirect({ to: '/admin' })
    return {
      route: detail.route,
      posters: (detail.posters ?? []).filter((p) => p.active),
      baseUrl: settings.baseUrl,
    }
  },
  component: Stickers,
})

function Stickers() {
  const { route, posters, baseUrl } = Route.useLoaderData()
  const host = baseUrl || 'http://MISSING-BASE-URL'
  const warn = !baseUrl || /localhost|127\.0\.0\.1/.test(baseUrl)

  return (
    <div className="sheet-wrap">
      <div className="sheet-head no-print">
        <a className="crumb" href={`/admin/events/${route.id}`}>
          ← {route.nameAr}
        </a>
        <p>
          {posters.length} stickers · {route.section} · codes encode {host}/s/&lt;token&gt;
        </p>
        {warn ? (
          <p className="warn">
            Base URL points at localhost. Phones will not resolve it. Fix it in Settings and reprint.
          </p>
        ) : null}
        <button className="btn primary" type="button" onClick={() => window.print()}>
          Print
        </button>
      </div>

      <div className="sheet-grid">
        {posters.map((p, i) => (
          <div className="sticker" key={p.id}>
            <div className="st-num">{String(i + 1).padStart(2, '0')}</div>
            <div className="st-qr">
              <img
                src={`/api/admin/posters/${p.id}/qr.svg?base=${encodeURIComponent(host)}`}
                alt={`QR ${p.token}`}
                width={150}
                height={150}
              />
            </div>
            <div className="st-meta">
              <div className="st-place">{p.nameAr}</div>
              <div className="st-url mono">{p.token}</div>
              <div className="st-human">or type {p.humanCode}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
