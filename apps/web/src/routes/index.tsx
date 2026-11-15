import { Link, createFileRoute } from '@tanstack/react-router'
import { useLang } from '../lib/lang'
import { t } from '../lib/i18n'

export const Route = createFileRoute('/')({ component: Landing })

function Landing() {
  const lang = useLang()
  return (
    <>
      <section className="hero">
        <span className="kicker">{t(lang, 'appKicker')}</span>
        <h1>{t(lang, 'appName')}</h1>
        <p className="lead">{t(lang, 'tagline')}</p>
      </section>

      <h2 className="sec-title">{t(lang, 'sectionTitle')}</h2>
      <div className="sections">
        <Link className="section-card" to="/t/$section" params={{ section: 'male' }}>
          <strong>{t(lang, 'male')}</strong>
          <span className="dim">{t(lang, 'sectionMaleSub')}</span>
          <span className="card-go" aria-hidden="true">
            {lang === 'ar' ? '←' : '→'}
          </span>
        </Link>
        <Link className="section-card" to="/t/$section" params={{ section: 'female' }}>
          <strong>{t(lang, 'female')}</strong>
          <span className="dim">{t(lang, 'sectionFemaleSub')}</span>
          <span className="card-go" aria-hidden="true">
            {lang === 'ar' ? '←' : '→'}
          </span>
        </Link>
      </div>

      <div className="cta-row">
        <Link className="btn ghost" to="/join">
          {t(lang, 'joinTitle')}
        </Link>
        <Link className="btn ghost" to="/board">
          {t(lang, 'board')}
        </Link>
      </div>

      <ol className="steps">
        <li>
          <span className="mono">01</span>
          <span>{t(lang, 'step1')}</span>
        </li>
        <li>
          <span className="mono">02</span>
          <span>{t(lang, 'step2')}</span>
        </li>
        <li>
          <span className="mono">03</span>
          <span>{t(lang, 'step3')}</span>
        </li>
      </ol>
    </>
  )
}
