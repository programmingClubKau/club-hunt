import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '../lib/api'

export const Route = createFileRoute('/admin/login')({ component: Login })

function Login() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    const res = await api.adminLogin(password)
    if (!res.ok) {
      setBusy(false)
      setError('Wrong password.')
      return
    }
    await router.navigate({ to: '/admin' })
  }

  return (
    <>
      <section className="hero">
        <span className="kicker">Organizers</span>
        <h1>Admin</h1>
      </section>
      {error ? <p className="err">{error}</p> : null}
      <form className="form" onSubmit={submit}>
        <label className="field">
          <span className="label">Password</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        <button className="btn primary big" type="submit" disabled={busy}>
          Sign in
        </button>
      </form>
    </>
  )
}
