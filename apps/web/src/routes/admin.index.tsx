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
      <h1 className="page-title">Events</h1>
      {!data.hasBaseUrl ? (
        <p className="warn">
          Set the public base URL in <a href="/admin/settings">Settings</a> before printing QR codes, or the stickers
          will point at localhost.
        </p>
      ) : null}

      <div className="cta-row">
        <a className="btn primary" href="/admin/events/new?section=male">
          New male event
        </a>
        <a className="btn primary" href="/admin/events/new?section=female">
          New female event
        </a>
      </div>

      {groups.map(([section, label]) => {
        const rows = data.routes.filter((r) => r.section === section)
        return (
          <section key={section}>
            <h2 className="sec-title">{label}</h2>
            {rows.length === 0 ? (
              <p className="empty">No events yet.</p>
            ) : (
              <div className="list">
                {rows.map((r) => (
                  <div className="card route-card admin-row" key={r.id}>
                    <div className="card-main">
                      <strong>
                        {r.nameAr} {r.nameEn ? <span className="dim">/ {r.nameEn}</span> : null}
                      </strong>
                      <span className="dim small">
                        {r.posters} QR {r.posters === 1 ? 'code' : 'codes'} · draws {r.drawCount} per team · {r.running}{' '}
                        running · {r.finished} finished
                      </span>
                    </div>
                    <div className="row-actions">
                      <a className="btn tiny" href={`/admin/events/${r.id}`}>
                        Edit
                      </a>
                      <a className="btn tiny" href={`/admin/stickers/${r.id}`}>
                        QR sheet
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
