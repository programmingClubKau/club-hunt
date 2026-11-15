import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '../lib/api'
import { useLang } from '../lib/lang'
import { pick, t } from '../lib/i18n'

export const Route = createFileRoute('/start/$routeId')({
  loader: async ({ params }) => {
    const id = Number(params.routeId)
    const res = await api.routePublic(id)
    if (!res.ok || !res.route) throw redirect({ to: '/' })
    return { route: res.route, stops: res.stops ?? 0, drawCount: res.drawCount ?? res.route.drawCount ?? 3 }
  },
  component: Setup,
})

function Setup() {
  const lang = useLang()
  const { route, stops, drawCount } = Route.useLoaderData()
  const router = useRouter()
  const [mode, setMode] = useState<'team' | 'solo'>('team')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy || !name.trim()) return
    setBusy(true)
    setError('')
    const res = await api.startSession({ routeId: route.id, mode, name: name.trim() })
    if (!res.ok) {
      setBusy(false)
      setError(res.error === 'empty_route' ? 'This trail has no stops yet.' : 'Could not start. Try again.')
      return
    }
    await router.navigate({ to: '/h' })
  }

  return (
    <>
      <a className="crumb" href="/">
        {t(lang, 'back')}
      </a>
      <span className="kicker">{t(lang, 'assigned')}</span>
      <h1 className="page-title">{pick(lang, route.nameAr, route.nameEn)}</h1>
      <p className="dim">{t(lang, 'assignedNote')}</p>
      <p className="dim small">
        {t(lang, 'drawNote').replace('{n}', String(drawCount)).replace('{m}', String(stops))}
      </p>

      <form className="form" onSubmit={submit}>
        <fieldset className="seg" role="radiogroup">
          <label className="seg-item">
            <input
              type="radio"
              name="mode"
              value="team"
              checked={mode === 'team'}
              onChange={() => setMode('team')}
            />
            <span>{t(lang, 'team')}</span>
          </label>
          <label className="seg-item">
            <input
              type="radio"
              name="mode"
              value="solo"
              checked={mode === 'solo'}
              onChange={() => setMode('solo')}
            />
            <span>{t(lang, 'solo')}</span>
          </label>
        </fieldset>

        <label className="field">
          <span className="label">{mode === 'solo' ? t(lang, 'soloName') : t(lang, 'teamName')}</span>
          <input
            className="input"
            type="text"
            name="name"
            maxLength={40}
            required
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={mode === 'solo' ? t(lang, 'soloName') : t(lang, 'teamName')}
          />
        </label>

        {error ? <p className="err">{error}</p> : null}

        <button className="btn primary big" type="submit" disabled={busy}>
          {t(lang, 'start')}
        </button>
      </form>
    </>
  )
}
