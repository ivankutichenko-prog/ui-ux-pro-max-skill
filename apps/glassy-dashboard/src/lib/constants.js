export const LEAD_STATUSES = {
  new: { label: 'Новый', color: '#60a5fa' },
  contacted: { label: 'В работе', color: '#fbbf24' },
  qualified: { label: 'Квалифицирован', color: '#34d399' },
  unqualified: { label: 'Отказ', color: '#f87171' },
}

export const LEAD_SOURCES = {
  site: { label: 'Сайт', color: '#60a5fa' },
  referral: { label: 'Рекомендация', color: '#34d399' },
  telegram: { label: 'Telegram', color: '#38bdf8' },
  instagram: { label: 'Instagram', color: '#f472b6' },
  events: { label: 'Мероприятия', color: '#fbbf24' },
  ads: { label: 'Реклама', color: '#a78bfa' },
}

export const DEAL_STAGES = [
  { id: 'new', label: 'Новые', color: '#60a5fa', probability: 10 },
  { id: 'qualified', label: 'Квалификация', color: '#a78bfa', probability: 30 },
  { id: 'proposal', label: 'Предложение', color: '#fbbf24', probability: 55 },
  { id: 'negotiation', label: 'Переговоры', color: '#f472b6', probability: 75 },
  { id: 'won', label: 'Успешно', color: '#34d399', probability: 100 },
]
export const stageById = Object.fromEntries(DEAL_STAGES.map((s) => [s.id, s]))

export const PRIORITIES = {
  high: { label: 'Высокий', color: '#f87171' },
  medium: { label: 'Средний', color: '#fbbf24' },
  low: { label: 'Низкий', color: '#94a3b8' },
}

export const EVENT_COLORS = {
  blue: { bg: 'rgba(96,165,250,0.30)', border: 'rgba(147,197,253,0.55)', dot: '#60a5fa' },
  amber: { bg: 'rgba(251,191,36,0.30)', border: 'rgba(253,224,71,0.55)', dot: '#fbbf24' },
  green: { bg: 'rgba(52,211,153,0.28)', border: 'rgba(110,231,183,0.55)', dot: '#34d399' },
  violet: { bg: 'rgba(167,139,250,0.30)', border: 'rgba(196,181,253,0.55)', dot: '#a78bfa' },
  rose: { bg: 'rgba(244,114,182,0.28)', border: 'rgba(249,168,212,0.55)', dot: '#f472b6' },
}

export const CHANNELS = {
  email: { label: 'Email', color: '#60a5fa' },
  telegram: { label: 'Telegram', color: '#38bdf8' },
  whatsapp: { label: 'WhatsApp', color: '#34d399' },
}

export const WALLPAPERS = {
  lounge: {
    label: 'Лаунж',
    base: '#2a1d14',
    blobs: ['#c08a5b', '#7a4b2f', '#e8cfa8', '#3b2618', '#a0673f'],
  },
  ocean: {
    label: 'Океан',
    base: '#081528',
    blobs: ['#2563eb', '#0ea5e9', '#1e3a8a', '#67e8f9', '#1d4ed8'],
  },
  aurora: {
    label: 'Аврора',
    base: '#110d22',
    blobs: ['#7c3aed', '#db2777', '#14b8a6', '#f59e0b', '#4c1d95'],
  },
  forest: {
    label: 'Лес',
    base: '#0c1712',
    blobs: ['#15803d', '#65a30d', '#0f766e', '#d9f99d', '#14532d'],
  },
  graphite: {
    label: 'Графит',
    base: '#111113',
    blobs: ['#52525b', '#a1a1aa', '#27272a', '#d4d4d8', '#3f3f46'],
  },
}

export const PAGES = [
  { id: 'overview', label: 'Обзор' },
  { id: 'inbox', label: 'Входящие' },
  { id: 'leads', label: 'Лиды' },
  { id: 'deals', label: 'Сделки' },
  { id: 'contacts', label: 'Контакты' },
  { id: 'companies', label: 'Компании' },
  { id: 'tasks', label: 'Задачи' },
  { id: 'calendar', label: 'Календарь' },
  { id: 'reports', label: 'Отчёты' },
  { id: 'integrations', label: 'Интеграции' },
  { id: 'settings', label: 'Настройки' },
  { id: 'support', label: 'Поддержка' },
]
