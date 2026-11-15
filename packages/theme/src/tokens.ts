/**
 * Club brand tokens, single source of truth.
 * Values mirror progg.club/brand. CSS equivalents live in tokens.css.
 */
export const colors = {
  ground: '#0b0c0f',
  panel: '#0f0e14',
  ink: '#ffffff',
  muted: '#bfbfc7',
  dim: '#8c8c96',
  pink: '#e083b8',
  deep: '#ff008f',
  violet: '#c4bbff',
  line: 'rgba(255, 255, 255, 0.09)',
  lineStrong: 'rgba(255, 255, 255, 0.16)',
} as const

export const fonts = {
  display: "'Sen', 'PlexArabic', system-ui, -apple-system, sans-serif",
  body: "'PlexArabic', system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono: "ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, monospace",
} as const

export const radii = { card: '22px', control: '14px', pill: '999px' } as const
export const tapTarget = 48

export const sections = {
  male: { ar: 'بنين', en: 'Male' },
  female: { ar: 'بنات', en: 'Female' },
} as const
