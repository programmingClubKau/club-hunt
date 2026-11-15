import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { api } from '../lib/api'
import { formatDuration } from '../lib/i18n'

export const Route = createFileRoute('/admin/sessions/$id')({
  loader: async ({ params }) => {
    const res = await api.adminSessions(Number(params.id))
    if (!res.ok || !res.route) throw redirect({ to: '/admin/login' })
    return { route: res.route, sessions: res.sessions ?? [] }
  },
  component: Live,
})

function Live() {
  const { route, sessions } = Route.useLoaderData()
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => router.invalidate(), 15000)
    return () => clearInterval(timer)
  }, [router])

  return (
    <>
      <a className="crumb" href={`/admin/routes/${route.id}`}>
        ← {route.nameAr}
      </a>
      <h1 className="page-title">Live · {route.nameAr}</h1>
      <p className="dim">{sessions.length} sessions. Refreshes every 15s.</p>

      {sessions.length === 0 ? <p className="empty">No sessions yet.</p> : null}
      <div className="list">
        {sessions.map((s) => (
          <div className="card poster-row" key={s.id}>
            <div className="card-main">
              <strong>
                {s.name}{' '}
                <span className="dim small">
                  {s.mode}
                  {s.isTest ? ' · test' : ''}
                </span>
              </strong>
              <span className="dim small">
                {s.status === 'finished'
                  ? `finished in ${formatDuration(s.durationMs)}`
                  : `running ${formatDuration(s.elapsedMs)}`}{' '}
                · step {s.step} of {s.total} · code {s.joinCode} · {s.devices} devices
              </span>
              {s.claimCode ? (
                <span className="tiny-line">
                  claim {s.claimCode} {s.redeemedAt ? '· collected' : ''}
                </span>
              ) : null}
            </div>
            <div className="row-actions">
              {s.status === 'active' ? (
                <button
                  className="btn tiny"
                  type="button"
                  onClick={async () => {
                    await api.adminSessionAction(s.id, 'advance')
                    await router.invalidate()
                  }}
                >
                  Force step
                </button>
              ) : null}
              {s.status === 'finished' && s.claimCode ? (
                <button
                  className="btn tiny"
                  type="button"
                  onClick={async () => {
                    await api.adminSessionAction(s.id, s.redeemedAt ? 'unredeem' : 'redeem')
                    await router.invalidate()
                  }}
                >
                  {s.redeemedAt ? 'Undo collected' : 'Mark collected'}
                </button>
              ) : null}
              <button
                className="btn tiny"
                type="button"
                onClick={async () => {
                  await api.adminSessionAction(s.id, 'test')
                  await router.invalidate()
                }}
              >
                {s.isTest ? 'Untest' : 'Mark test'}
              </button>
              <button
                className="btn tiny danger"
                type="button"
                onClick={async () => {
                  if (!confirm('Delete this session and its progress?')) return
                  await api.adminSessionAction(s.id, 'reset')
                  await router.invalidate()
                }}
              >
                Reset
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
