import { createFileRoute, redirect } from '@tanstack/react-router'
import { api, type ScanResult } from '../lib/api'
import { useLang } from '../lib/lang'
import { pick, t } from '../lib/i18n'

export const Route = createFileRoute('/s/$code')({
  loader: async ({ params }) => {
    const res = await api.scan(params.code)
    const result = res.result
    // A finished hunt belongs on the finish screen, which owns the time, the rank and the board.
    if (result.kind === 'finished' || (result.kind === 'advance' && result.finished)) {
      throw redirect({ to: '/h' })
    }
    return { result }
  },
  component: ScanResultPage,
})

function ScanResultPage() {
  const lang = useLang()
  const { result } = Route.useLoaderData() as { result: ScanResult }

  if (result.kind === 'advance' && !result.finished && result.next) {
    return (
      <div className="result good">
        <span className="result-mark">✓</span>
        <h1>
          {t(lang, 'resultGood')} · {pick(lang, result.posterName.ar, result.posterName.en)}
        </h1>
        <article className="clue-card compact">
          <span className="mono">{t(lang, 'nextClue')}</span>
          <p className="riddle">{pick(lang, result.next.ar, result.next.en)}</p>
        </article>
        <p className="hint">{t(lang, 'scanHint')}</p>
        <a className="btn primary big" href="/h">
          {t(lang, 'openTrail')}
        </a>
      </div>
    )
  }

  const copy = (() => {
    switch (result.kind) {
      case 'advance':
      case 'finished':
        return { title: t(lang, 'finished'), hint: t(lang, 'finishedSub'), good: true }
      case 'repeat':
        return { title: t(lang, 'resultRepeat'), hint: t(lang, 'resultRepeatHint'), good: false }
      case 'not_yet':
        return { title: t(lang, 'resultNotYet'), hint: t(lang, 'resultNotYetHint'), good: false }
      case 'other_route':
        return { title: t(lang, 'resultOther'), hint: t(lang, 'resultOtherHint'), good: false }
      case 'no_session':
        return { title: t(lang, 'resultNoSession'), hint: t(lang, 'resultNoSessionHint'), good: false }
      default:
        return { title: t(lang, 'resultInvalid'), hint: t(lang, 'resultInvalidHint'), good: false }
    }
  })()

  return (
    <div className={`result ${copy.good ? 'good' : 'bad'}`}>
      <span className="result-mark">{copy.good ? '✓' : '!'}</span>
      <h1>{copy.title}</h1>
      <p className="hint">{copy.hint}</p>
      <a className="btn primary big" href={result.kind === 'no_session' ? '/' : '/h'}>
        {result.kind === 'no_session' ? t(lang, 'start') : t(lang, 'openTrail')}
      </a>
    </div>
  )
}
