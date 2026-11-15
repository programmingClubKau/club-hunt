import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '../lib/api'
import { useLang } from '../lib/lang'
import { t } from '../lib/i18n'

export const Route = createFileRoute('/join')({ component: Join })

function Join() {
  const lang = useLang()
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    const res = await api.join(code.trim())
    if (!res.ok) {
      setBusy(false)
      setError(t(lang, 'joinFail'))
      return
    }
    await router.navigate({ to: '/h' })
  }

  return (
    <>
      <a className="crumb" href="/">
        {t(lang, 'back')}
      </a>
      <h1 className="page-title">{t(lang, 'joinTitle')}</h1>
      <p className="dim">{t(lang, 'joinHint')}</p>
      {error ? <p className="err">{error}</p> : null}
      <form className="form" onSubmit={submit}>
        <label className="field">
          <span className="label">{t(lang, 'teamCode')}</span>
          <input
            className="input code-input"
            type="text"
            name="code"
            maxLength={6}
            autoCapitalize="characters"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="-----"
          />
        </label>
        <button className="btn primary big" type="submit" disabled={busy}>
          {t(lang, 'join')}
        </button>
      </form>
    </>
  )
}
