export type Lang = 'ar' | 'en'

const dict = {
  appName: ['مطاردة الكنز', 'Treasure Hunt'],
  appKicker: ['نادي البرمجة', 'Programming Club'],
  tagline: ['اختاروا قسمكم ويلا نبدأ', 'Pick your section and start the hunt'],
  sectionTitle: ['وين بتلعبون؟', 'Where are you playing?'],
  male: ['بنين', 'Male'],
  female: ['بنات', 'Female'],
  sectionMaleSub: ['مسار البنين', 'Male section trail'],
  sectionFemaleSub: ['مسار البنات', 'Female section trail'],
  noRoutes: ['ما فيه مسار مفتوح الحين. كلّموا المشرف.', 'No trail is open right now. Ask an organizer.'],
  chooseEvent: ['أي فعالية تلعبون؟', 'Which event are you in?'],
  noEvents: ['ما فيه فعالية مفتوحة الحين. كلّموا المشرف.', 'No event is open right now. Ask an organizer.'],
  drawShort: ['تسحبون {n}', 'you draw {n}'],
  setup: ['جهّزوا فريقكم', 'Set up your team'],
  solo: ['لحالي', 'Solo'],
  team: ['فريق', 'Team'],
  teamName: ['اسم الفريق', 'Team name'],
  soloName: ['اسمك', 'Your name'],
  start: ['يلا نبدأ', 'Start'],
  back: ['رجوع', 'Back'],
  clue: ['اللغز', 'Clue'],
  stopOf: ['المحطة', 'Stop'],
  of: ['من', 'of'],
  scanHint: ['روحوا للمكان وامسحوا رمز QR اللي هناك.', 'Go to the place and scan the QR posted there.'],
  noCamera: ['ما قدرتو تمسحون؟', 'Cannot scan?'],
  enterCode: ['اكتبوا الرمز', 'Enter the code'],
  code: ['الرمز', 'Code'],
  submit: ['تأكيد', 'Submit'],
  teamCode: ['كود الفريق', 'Team code'],
  teamCodeHint: ['أي جوال ثاني يدخل بنفس الكود ويكمّل معكم.', 'Any other phone can join with this code and continue with you.'],
  copy: ['نسخ', 'Copy'],
  copied: ['تم النسخ', 'Copied'],
  resultGood: ['صح عليكم', 'Correct'],
  nextClue: ['اللغز التالي', 'Next clue'],
  resultRepeat: ['هالمحطة مخلّصة', 'Already done'],
  resultRepeatHint: ['كمّلوا من اللغز اللي عندكم.', 'Continue from the current clue.'],
  resultNotYet: ['مو محطتكم', 'Not your stop yet'],
  resultNotYetHint: ['هذي مو محطتكم الحالية، كمّلوا من اللغز اللي عندكم.', 'This is not your current stop. Follow the clue you have.'],
  resultOther: ['المحطة مو من مساركم', 'Not part of your trail'],
  resultOtherHint: ['هذي المحطة تابعة لمسار ثاني.', 'This stop belongs to another trail.'],
  resultInvalid: ['الرمز مو صحيح', 'Invalid code'],
  resultInvalidHint: ['تأكدوا من الرمز أو امسحوا الـ QR مرة ثانية.', 'Check the code or scan the QR again.'],
  resultNoSession: ['ما لقينا لكم جلسة', 'No session'],
  resultNoSessionHint: ['ارجعوا للبداية وابدأوا من جديد.', 'Go back and start again.'],
  finished: ['وصلتوا!', 'You made it'],
  finishedSub: ['مبروك، خلصتوا المطاردة', 'Congrats, you finished the hunt'],
  yourTime: ['وقتكم', 'Your time'],
  yourRank: ['ترتيبكم', 'Your rank'],
  board: ['المتصدرون', 'Leaderboard'],
  boardEmpty: ['ما أحد خلّص للحين.', 'Nobody has finished yet.'],
  playAgain: ['ابدأوا من جديد', 'Start again'],
  runner: ['مشارك', 'Runner'],
  teamLabel: ['فريق', 'Team'],
  joinTitle: ['انضم لفريق', 'Join a team'],
  joinHint: ['اكتبوا كود الفريق اللي بدأ من جوال ثاني.', 'Enter the code from the phone that started the team.'],
  join: ['انضم', 'Join'],
  joinFail: ['ما لقينا فريق نشط بهذا الكود.', 'No active team with that code.'],
  notFound: ['ما لقيناه', 'Not found'],
  notFoundHint: ['الرابط مو صحيح.', 'That link is not valid.'],
  openTrail: ['افتح المسار', 'Open trail'],
  lang: ['EN', 'ع'],
  step1: ['اختاروا قسمكم', 'Pick your section'],
  step2: ['ابدأوا المطاردة', 'Start the hunt'],
  step3: ['امسحوا رمز QR عند كل محطة', 'Scan the QR at each stop'],
  assigned: ['الفعالية', 'Your event'],
  assignedNote: [
    'محطاتكم بتنحسب عشوائيا من هذي الفعالية. اتبعوها من أول محطة لآخر محطة.',
    'Your stops are drawn at random from this event. Follow them from the first stop to the last.',
  ],
  drawNote: ['عندكم {n} محطات من أصل {m}، بترتيب عشوائي.', 'Your {n} stops out of {m}, in a random order.'],
  winner: ['فزتوا', 'You won'],
  winnerSub: ['مبروك، خلصتوا المطاردة', 'Congrats, you finished the hunt'],
  showAtBooth: ['أظهروا هالبطاقة في نقطة الجوائز واستلموا جائزتكم', 'Show this card at the prize desk to collect your prize'],
  claimCode: ['رمز الفوز', 'Claim code'],
  badgeNote: ['المشرف يتأكد من الرمز قبل ما يسلّم الجائزة.', 'Staff verify the code before handing over the prize'],
  verifyTitle: ['تأكيد الفوز', 'Win check'],
  verifyValid: ['الفوز مؤكد', 'Valid win'],
  verifyUsed: ['تم استلام الجائزة', 'Prize already collected'],
  verifyInvalid: ['ما فيه فوز بهذا الرمز', 'No win for this code'],
  verifyTest: ['هذي جلسة تجريبية، مو فوز', 'Test run, not a win'],
  redeem: ['تسليم الجائزة', 'Mark as collected'],
  unredeem: ['تراجع عن التسليم', 'Undo collected'],
  redeemedAt: ['تم التسليم', 'Collected'],
  devices: ['أجهزة', 'devices'],
  teamCodeJoin: ['انضم بجوال ثاني', 'Join from another phone'],
} as const

export type Key = keyof typeof dict

export function t(lang: Lang, key: Key): string {
  const pair = dict[key]
  return lang === 'ar' ? pair[0] : pair[1]
}

export function pick(lang: Lang, ar: string, en: string): string {
  if (lang === 'en' && en.trim()) return en
  return ar.trim() || en
}

export const dir = (lang: Lang) => (lang === 'ar' ? 'rtl' : 'ltr')

/** Arabic counts do not take a plain number plus plural, so spell them out. */
export function stopsCount(lang: Lang, n: number): string {
  if (lang === 'en') return `${n} ${n === 1 ? 'stop' : 'stops'}`
  if (n === 1) return 'محطة وحدة'
  if (n === 2) return 'محطتين'
  return `${n} محطات`
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return ''
  const total = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}
