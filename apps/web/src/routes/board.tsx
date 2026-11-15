import { createFileRoute } from '@tanstack/react-router'
import { api } from '../lib/api'
import { useLang } from '../lib/lang'
import { formatDuration, pick, t } from '../lib/i18n'

export const Route = createFileRoute('/board')({
  loader: () => api.board(),
  component: BoardPage,
})

function BoardPage() {
  const lang = useLang()
  const { boards } = Route.useLoaderData()

  return (
    <>
      <a className="crumb" href="/">
        {t(lang, 'back')}
      </a>
      <h1 className="page-title">{t(lang, 'board')}</h1>
      {boards.length === 0 ? <p className="empty">{t(lang, 'boardEmpty')}</p> : null}
      {boards.map((b) => (
        <section key={b.route.id}>
          <h2 className="sec-title">{pick(lang, b.route.nameAr, b.route.nameEn)}</h2>
          {b.rows.length === 0 ? (
            <p className="empty">{t(lang, 'boardEmpty')}</p>
          ) : (
            <div className="board">
              {b.rows.map((r) => (
                <div className="board-row" key={r.rank}>
                  <span className="rank mono">{r.rank}</span>
                  <span className="who">{r.name}</span>
                  <span className="mono time">{formatDuration(r.durationMs)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </>
  )
}
