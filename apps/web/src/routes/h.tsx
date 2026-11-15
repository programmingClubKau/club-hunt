import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { api, type BoardRow } from '../lib/api'
import { useLang } from '../lib/lang'
import { formatDuration, pick, t } from '../lib/i18n'

export const Route = createFileRoute('/h')({
  loader: async () => {
    const res = await api.me()
    if (!res.ok || !res.state) throw redirect({ to: '/' })
    return res
  },
  component: Hunt,
})

function Dots({ total, done }: { total: number; done: number }) {
  return (
    <div className="dots" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={done + 1}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`dot-item${i < done ? ' done' : ''}${i === done ? ' current' : ''}`} />
      ))}
    </div>
  )
}

function Board({ rows, lang }: { rows: BoardRow[]; lang: 'ar' | 'en' }) {
  if (rows.length === 0) return <p className="empty">{t(lang, 'boardEmpty')}</p>
  return (
    <div className="board">
      {rows.map((r) => (
        <div className="board-row" key={r.rank}>
          <span className="rank mono">{r.rank}</span>
          <span className="who">{r.name}</span>
          <span className="mono time">{formatDuration(r.durationMs)}</span>
        </div>
      ))}
    </div>
  )
}

function TeamCode({ code, lang }: { code: string; lang: 'ar' | 'en' }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="panel">
      <span className="label">{t(lang, 'teamCode')}</span>
      <div className="code-row">
        <code className="code">{code}</code>
        <button
          className="btn tiny"
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code)
              setCopied(true)
              setTimeout(() => setCopied(false), 1600)
            } catch {
              setCopied(false)
            }
          }}
        >
          {copied ? t(lang, 'copied') : t(lang, 'copy')}
        </button>
      </div>
      <p className="dim small">{t(lang, 'teamCodeHint')}</p>
    </div>
  )
}

function Hunt() {
  const lang = useLang()
  const { state, finish } = Route.useLoaderData()

  if (!state) return null

  if (state.status === 'finished' || !state.current) {
    const claim = finish?.claimCode ?? state.claimCode ?? null
    const claimUrl = finish?.claimUrl ?? null
    const redeemed = Boolean(finish?.redeemedAt ?? state.redeemedAt)
    return (
      <>
        <section className="win">
          <div className="badge">
            <div className="badge-top">
              <img src="/brand/pc-mark-white.svg" alt="" height={26} />
              <span className="badge-kicker">PROGRAMMING CLUB</span>
            </div>

            <h1 className="badge-title">{t(lang, 'winner')}</h1>
            <p className="badge-team">{state.name}</p>

            <div className="badge-grid">
              <div>
                <span className="label">{t(lang, 'yourTime')}</span>
                <strong>{formatDuration(state.durationMs)}</strong>
              </div>
              <div>
                <span className="label">{t(lang, 'yourRank')}</span>
                <strong>#{finish?.rank ?? '?'}</strong>
              </div>
              <div>
                <span className="label">{t(lang, 'assigned')}</span>
                <strong className="badge-route">{pick(lang, state.route.nameAr, state.route.nameEn)}</strong>
              </div>
            </div>

            <div className="badge-claim">
              <div>
                <span className="label">{t(lang, 'claimCode')}</span>
                <code className="badge-code">{claim ?? '-'}</code>
                {redeemed ? <span className="badge-used">{t(lang, 'redeemedAt')}</span> : null}
              </div>
              {claimUrl ? (
                <img
                  className="badge-qr"
                  src={`/api/qr.svg?text=${encodeURIComponent(claimUrl)}`}
                  alt={claimUrl}
                  width={104}
                  height={104}
                />
              ) : null}
            </div>

            <p className="badge-foot">{t(lang, 'showAtBooth')}</p>
            <p className="badge-hint">{t(lang, 'badgeNote')}</p>
          </div>
        </section>

        <div className="cta-row no-print">
          <button className="btn ghost" type="button" onClick={() => window.print()}>
            {lang === 'ar' ? 'طباعة البطاقة' : 'Print badge'}
          </button>
          <a className="btn primary" href="/">
            {t(lang, 'playAgain')}
          </a>
        </div>

        <section className="no-print">
          <h2 className="sec-title">{t(lang, 'board')}</h2>
          <Board rows={finish?.board ?? []} lang={lang} />
        </section>
      </>
    )
  }

  return (
    <>
      <div className="hunt-head">
        <span className="kicker">{pick(lang, state.route.nameAr, state.route.nameEn)}</span>
        <span className="step-count">
          {t(lang, 'stopOf')} {state.current.stepNo} {t(lang, 'of')} {state.total}
        </span>
      </div>
      <Dots total={state.total} done={state.done} />

      <article className="clue-card">
        <span className="mono">{t(lang, 'clue')}</span>
        <p className="riddle">{pick(lang, state.current.riddleAr, state.current.riddleEn)}</p>
      </article>

      <p className="hint">{t(lang, 'scanHint')}</p>

      <details className="manual">
        <summary>{t(lang, 'noCamera')}</summary>
        <form className="inline-form" method="get" action="/c">
          <input
            className="input"
            type="text"
            name="code"
            maxLength={12}
            autoCapitalize="characters"
            placeholder={t(lang, 'code')}
            required
          />
          <button className="btn" type="submit">
            {t(lang, 'submit')}
          </button>
        </form>
        <p className="dim small">
          {t(lang, 'code')}: <code>{state.current.humanCode}</code>
        </p>
      </details>

      {state.mode === 'team' ? <TeamCode code={state.joinCode} lang={lang} /> : null}
    </>
  )
}
