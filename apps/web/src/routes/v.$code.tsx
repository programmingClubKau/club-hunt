import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '../lib/api'
import { useLang } from '../lib/lang'
import { formatDuration, t } from '../lib/i18n'

export const Route = createFileRoute('/v/$code')({
  loader: async ({ params }) => api.verify(params.code),
  component: Verify,
})

function Verify() {
  const lang = useLang()
  const data = Route.useLoaderData()
  const router = useRouter()
  const [message, setMessage] = useState('')

  if (!data.valid) {
    return (
      <div className="result bad">
        <span className="result-mark">?</span>
        <h1>{data.used ? t(lang, 'verifyUsed') : t(lang, 'verifyInvalid')}</h1>
        <p className="hint">{data.claimCode ?? ''}</p>
      </div>
    )
  }

  async function redeem() {
    if (!data.sessionId) return
    const res = await api.adminSessionAction(data.sessionId, data.used ? 'unredeem' : 'redeem')
    if (!res.ok) {
      setMessage(
        res.error === 'unauthorized'
          ? lang === 'ar'
            ? 'سجّلوا دخول من /admin/login عشان تسلّمون الجائزة'
            : 'Sign in at /admin/login to redeem'
          : (res.error ?? 'Failed'),
      )
      return
    }
    setMessage('')
    await router.invalidate()
  }

  return (
    <>
      <div className={`result ${data.used ? 'warn' : 'good'}`}>
        <span className="result-mark">{data.used ? '•' : '✓'}</span>
        <h1>{data.used ? t(lang, 'verifyUsed') : t(lang, 'verifyValid')}</h1>
        <p className="hint">{t(lang, 'verifyTitle')}</p>
      </div>

      <div className="verify-card">
        <div className="verify-row">
          <span className="label">{t(lang, 'teamLabel')}</span>
          <strong>{data.name}</strong>
        </div>
        <div className="verify-row">
          <span className="label">{t(lang, 'assigned')}</span>
          <strong>{data.route}</strong>
        </div>
        <div className="verify-row">
          <span className="label">{t(lang, 'yourTime')}</span>
          <strong>{formatDuration(data.durationMs)}</strong>
        </div>
        <div className="verify-row">
          <span className="label">{t(lang, 'yourRank')}</span>
          <strong>#{data.rank}</strong>
        </div>
        <div className="verify-row">
          <span className="label">{t(lang, 'claimCode')}</span>
          <code>{data.claimCode}</code>
        </div>
        {data.isTest ? <p className="warn">{t(lang, 'verifyTest')}</p> : null}
      </div>

      <div className="cta-row">
        <button className={`btn ${data.used ? 'ghost' : 'primary'} big`} type="button" onClick={redeem}>
          {data.used ? t(lang, 'unredeem') : t(lang, 'redeem')}
        </button>
      </div>
      {message ? <p className="err">{message}</p> : null}
    </>
  )
}
