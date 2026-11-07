export const CURRENCIES = {
  RUB: { code: 'RUB', label: '₽ Рубль' },
  USD: { code: 'USD', label: '$ Доллар' },
  EUR: { code: 'EUR', label: '€ Евро' },
}

const moneyCache = new Map()
export function money(value, currency = 'RUB', opts = {}) {
  const key = currency + JSON.stringify(opts)
  if (!moneyCache.has(key)) {
    moneyCache.set(
      key,
      new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        ...opts,
      }),
    )
  }
  return moneyCache.get(key).format(Number.isFinite(value) ? value : 0)
}

export function compactMoney(value, currency = 'RUB') {
  return money(value, currency, { notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: 1 })
}

const numberFmt = new Intl.NumberFormat('ru-RU')
export const num = (v) => numberFmt.format(Number.isFinite(v) ? Math.round(v) : 0)

export const pct = (v, digits = 0) => `${(Number.isFinite(v) ? v : 0).toFixed(digits).replace('.', ',')}%`

export const MONTHS_SHORT = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
export const MONTHS_LETTER = ['Я', 'Ф', 'М', 'А', 'М', 'И', 'И', 'А', 'С', 'О', 'Н', 'Д']
export const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
export const MONTHS_PREP = ['январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре']
export const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export const pad = (n) => String(n).padStart(2, '0')
export const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parseIso = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
export const startOfWeek = (d) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = (x.getDay() + 6) % 7 // Monday = 0
  return addDays(x, -day)
}
export const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

export const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function humanDate(iso) {
  const d = parseIso(iso)
  const today = new Date()
  if (sameDay(d, today)) return 'Сегодня'
  if (sameDay(d, addDays(today, 1))) return 'Завтра'
  if (sameDay(d, addDays(today, -1))) return 'Вчера'
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`
}

export function relativeTime(ts) {
  const diff = (Date.now() - ts) / 1000
  if (diff < 60) return 'только что'
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`
  const days = Math.floor(diff / 86400)
  if (days === 1) return 'вчера'
  if (days < 7) return `${days} дн назад`
  const d = new Date(ts)
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`
}

export function greeting(date = new Date()) {
  const h = date.getHours()
  if (h < 5) return 'Доброй ночи'
  if (h < 12) return 'Доброе утро'
  if (h < 18) return 'Добрый день'
  return 'Добрый вечер'
}

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

/** Russian plural: plural(5, ['сделка', 'сделки', 'сделок']) → 'сделок' */
export function plural(n, [one, few, many]) {
  const a = Math.abs(n) % 100
  const b = a % 10
  if (a > 10 && a < 20) return many
  if (b > 1 && b < 5) return few
  if (b === 1) return one
  return many
}

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
