import { createFileRoute, redirect } from '@tanstack/react-router'
import { api } from '../lib/api'

export const Route = createFileRoute('/admin/')({
  loader: async () => {
    const res = await api.raw('/admin/routes')
    if (res.status === 401) throw redirect({ to: '/admin/login' })
    return res.json as { ok: boolean; routes: any[]; hasBaseUrl: boolean }
  },
  component: Dashboard,
})

function Dashboard() {
  const data = Route.useLoaderData()
  const groups: Array<['male' | 'female', string]> = [
    ['male', 'Male section'],
    ['female', 'Female section'],
  ]

  return (
    <>
      <h1 className="page-title">Routes</h1>
      {!data.hasBaseUrl ? (
        <p className="warn">
          Set the public base URL in <a href="/admin/settings">Settings</a> before printing stickers, or the QR codes
          will point at localhost.
        </p>
      ) : null}

      <div className="cta-row">
        <a className="btn primary" href="/admin/routes/new?section=male">
          New male route
        </a>
        <a className="btn primary" href="/admin/routes/new?section=female">
          New female route
        </a>
      </div>

      {groups.map(([section, label]) => {
        const rows = data.routes.filter((r) => r.section === section)
        return (
          <section key={section}>
            <h2 className="sec-title">{label}</h2>
            {rows.length === 0 ? (
              <p className="empty">No routes yet.</p>
            ) : (
              <div className="list">
                {rows.map((r) => (
                  <div className="card route-card admin-row" key={r.id}>
                    <div className="card-main">
                      <strong>
                        {r.nameAr} {r.nameEn ? <span className="dim">/ {r.nameEn}</span> : null}
                      </strong>
                      <span className="dim small">
                        {r.posters} spots · draws {r.drawCount} per team · {r.running} running · {r.finished} finished
                      </span>
                    </div>
                    <div className="row-actions">
                      <a className="btn tiny" href={`/admin/routes/${r.id}`}>
                        Edit
                      </a>
                      <a className="btn tiny" href={`/admin/stickers/${r.id}`}>
                        Stickers
                      </a>
                      <a className="btn tiny" href={`/admin/sessions/${r.id}`}>
                        Live
                      </a>
                      <span className={`pill ${r.status}`}>{r.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )
      })}
    </>
  )
}
