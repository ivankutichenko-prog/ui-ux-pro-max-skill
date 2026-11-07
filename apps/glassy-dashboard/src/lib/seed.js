import { addDays, isoDate, startOfWeek, uid } from './format'

export const TEAM = [
  { id: 'me', name: 'Иван Громов', short: 'Иван', color: '#f59e0b' },
  { id: 'maria', name: 'Мария Белова', short: 'Мария', color: '#34d399' },
  { id: 'oleg', name: 'Олег Ким', short: 'Олег', color: '#60a5fa' },
  { id: 'liza', name: 'Лиза Орлова', short: 'Лиза', color: '#f472b6' },
]

// Deterministic pseudo-random so the demo looks the same on every machine.
function rng(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const HOUR = 3600 * 1000
const DAY = 24 * HOUR

export function emptyData() {
  return {
    leads: [],
    deals: [],
    contacts: [],
    companies: [],
    tasks: [],
    events: [],
    messages: [],
    activity: [],
    integrations: {},
    stats: {
      revenue: Array(12).fill(0),
      contacts: Array(7).fill(0),
      messagesDaily: Array(90).fill(0),
      credits: 0,
      creditsUsed: 0,
    },
  }
}

export function demoData() {
  const now = Date.now()
  const today = new Date()
  const week = startOfWeek(today)
  const day = (n) => isoDate(addDays(week, n))
  const r = rng(42)

  const companies = [
    ['Студия «Север»', 'Дизайн', 24, 'sever.studio'],
    ['Кофейня «Зерно»', 'HoReCa', 48, 'zerno.cafe'],
    ['ТехноПарк', 'IT', 310, 'technopark.ru'],
    ['Логистика Плюс', 'Логистика', 120, 'logplus.ru'],
    ['Клиника «Гармония»', 'Медицина', 85, 'garmonia-clinic.ru'],
    ['Фитнес «Волна»', 'Спорт', 36, 'volna.fit'],
    ['Агентство «Квадрат»', 'Маркетинг', 18, 'kvadrat.agency'],
    ['ЭкоФерма', 'Агро', 64, 'ecoferma.ru'],
  ].map(([name, industry, size, website]) => ({ id: uid(), name, industry, size, website, createdAt: now - r() * 200 * DAY }))
  const co = (i) => companies[i].name

  const contacts = [
    ['Анна Смирнова', 'Директор', 0, '+7 912 345-67-01', ['VIP']],
    ['Дмитрий Волков', 'Совладелец', 1, '+7 903 222-14-55', ['Партнёр']],
    ['Екатерина Лебедева', 'Руководитель закупок', 2, '+7 916 784-90-12', ['Тендер']],
    ['Сергей Новиков', 'Операционный директор', 3, '+7 925 101-33-47', []],
    ['Ольга Морозова', 'Главный врач', 4, '+7 999 456-21-08', ['VIP']],
    ['Артём Павлов', 'Основатель', 5, '+7 901 650-77-19', []],
    ['Полина Соколова', 'Арт-директор', 6, '+7 917 330-62-40', ['Партнёр']],
    ['Николай Фёдоров', 'Коммерческий директор', 7, '+7 905 888-12-36', []],
    ['Виктория Алексеева', 'Маркетолог', 2, '+7 926 544-09-73', []],
    ['Максим Егоров', 'Менеджер проектов', 3, '+7 915 207-58-64', ['Новый']],
  ].map(([name, role, ci, phone, tags], i) => ({
    id: uid(),
    name,
    role,
    company: co(ci),
    email: `${['anna', 'dmitry', 'ekaterina', 'sergey', 'olga', 'artem', 'polina', 'nikolay', 'victoria', 'maxim'][i]}@${companies[ci].website}`,
    phone,
    tags,
    createdAt: now - (i + 1) * 4 * DAY,
  }))

  const leadRows = [
    ['Анна Смирнова', 0, 'site', 92, 'qualified', 'me', 184000, 2],
    ['Дмитрий Волков', 1, 'referral', 84, 'contacted', 'oleg', 92000, 5],
    ['Хана Сато', 2, 'telegram', 77, 'new', 'maria', 65000, 20],
    ['Тимур Беков', 3, 'events', 71, 'contacted', 'liza', 48000, 26],
    ['Амина Окафор', 4, 'site', 66, 'new', 'me', 73000, 50],
    ['Ирина Морган', 5, 'ads', 58, 'new', 'maria', 110000, 70],
    ['Равиль Менделеев', 6, 'referral', 49, 'contacted', 'oleg', 39000, 75],
    ['Кристина Дюбуа', 7, 'instagram', 44, 'new', 'liza', 27000, 96],
    ['Глеб Захаров', 2, 'ads', 31, 'unqualified', 'oleg', 15000, 140],
    ['Марина Ветрова', 1, 'instagram', 63, 'contacted', 'me', 54000, 160],
  ]
  const leads = leadRows.map(([name, ci, source, score, status, owner, value, hoursAgo]) => ({
    id: uid(),
    name,
    company: co(ci),
    source,
    score,
    status,
    owner,
    value,
    createdAt: now - hoursAgo * HOUR,
  }))

  const dealRows = [
    ['Редизайн сайта', 0, 'proposal', 'me', 184000, 9],
    ['Поставка зерна на год', 1, 'negotiation', 'oleg', 420000, 6],
    ['CRM-внедрение', 2, 'qualified', 'maria', 650000, 21],
    ['Автоматизация склада', 3, 'new', 'liza', 290000, 30],
    ['Онлайн-запись пациентов', 4, 'proposal', 'me', 215000, 12],
    ['Годовой абонемент B2B', 5, 'won', 'maria', 96000, -3],
    ['Рекламная кампания', 6, 'negotiation', 'liza', 138000, 4],
    ['Мобильное приложение', 7, 'new', 'oleg', 540000, 40],
    ['SMM-сопровождение', 6, 'won', 'me', 72000, -8],
    ['Брендинг упаковки', 7, 'qualified', 'maria', 160000, 18],
  ]
  const deals = dealRows.map(([title, ci, stage, owner, value, closeIn]) => ({
    id: uid(),
    title,
    company: co(ci),
    stage,
    owner,
    value,
    closeDate: isoDate(addDays(today, closeIn)),
    createdAt: now - r() * 40 * DAY,
  }))

  const tasks = [
    ['Отправить КП «Гармонии»', 0, 'high', false],
    ['Созвон с ТехноПарк по CRM', 0, 'high', false],
    ['Подготовить отчёт за месяц', 1, 'medium', false],
    ['Обновить прайс-лист', 2, 'low', false],
    ['Проверить оплату от «Волны»', -1, 'medium', true],
    ['Написать Дмитрию про поставку', 0, 'medium', true],
    ['Запланировать встречу команды', 3, 'low', false],
  ].map(([title, dueIn, priority, done]) => ({
    id: uid(),
    title,
    due: isoDate(addDays(today, dueIn)),
    priority,
    done,
    createdAt: now - r() * 6 * DAY,
  }))

  const events = [
    ['Обзор воронки', 0, '09:30', '10:30', 'Команда продаж', 'blue'],
    ['QBR с ТехноПарк', 1, '10:00', '11:30', 'Екатерина Лебедева', 'blue'],
    ['Фокус-время: КП', 2, '09:00', '11:00', 'Только я', 'amber'],
    ['Демо «Логистика Плюс»', 3, '11:00', '12:00', 'Сергей Новиков', 'violet'],
    ['Звонок: Анна Смирнова', 4, '10:30', '11:00', 'Студия «Север»', 'green'],
    ['Онбординг «Волна»', 0, '13:00', '14:00', 'Артём Павлов', 'green'],
    ['Цены и тарифы', 2, '14:00', '15:00', 'Олег, Мария', 'green'],
    ['Демо продукта', 1, '15:00', '16:00', 'Ольга Морозова', 'violet'],
    ['Демо «ЭкоФерма»', 4, '13:00', '14:00', 'Николай Фёдоров', 'violet'],
    ['1:1 с Лизой', 3, '16:00', '16:45', 'Лиза Орлова', 'violet'],
    ['Переговоры «Квадрат»', 4, '15:30', '16:30', 'Полина Соколова', 'rose'],
  ].map(([title, d, start, end, withWho, color]) => ({
    id: uid(),
    title,
    date: day(d),
    start,
    end,
    with: withWho,
    color,
  }))
  // Next week, so there is always something upcoming.
  events.push(
    { id: uid(), title: 'Планёрка команды', date: day(7), start: '09:30', end: '10:15', with: 'Вся команда', color: 'blue' },
    { id: uid(), title: 'Звонок: Дмитрий Волков', date: day(7), start: '12:00', end: '12:30', with: 'Кофейня «Зерно»', color: 'green' },
    { id: uid(), title: 'Презентация КП', date: day(8), start: '11:00', end: '12:30', with: 'ТехноПарк', color: 'violet' },
    { id: uid(), title: 'Подписание договора', date: day(9), start: '15:00', end: '16:00', with: 'Клиника «Гармония»', color: 'rose' },
  )
  // Make sure "today" always has something on it, whatever weekday it is.
  const todayIso = isoDate(today)
  if (!events.some((e) => e.date === todayIso)) {
    events.push(
      { id: uid(), title: 'Звонок: Анна Смирнова', date: todayIso, start: '10:30', end: '11:00', with: 'Студия «Север»', color: 'green' },
      { id: uid(), title: 'Демо «ЭкоФерма»', date: todayIso, start: '13:00', end: '14:00', with: 'Николай Фёдоров', color: 'violet' },
      { id: uid(), title: 'Переговоры «Квадрат»', date: todayIso, start: '15:30', end: '16:30', with: 'Полина Соколова', color: 'rose' },
    )
  }

  const messages = [
    ['Анна Смирнова', 'email', 'Re: Коммерческое предложение', 'Иван, добрый день! Посмотрели КП — в целом всё нравится. Можем обсудить сроки и этапы оплаты? Удобно завтра после обеда.', 0.4, false],
    ['Дмитрий Волков', 'telegram', 'Поставка', 'Привет! По объёмам на следующий квартал — готовы увеличить на 20%, если зафиксируем цену.', 2, false],
    ['Екатерина Лебедева', 'email', 'Документы для тендера', 'Направляю список документов для участия в тендере. Дедлайн подачи — пятница.', 5, false],
    ['Артём Павлов', 'whatsapp', 'Оплата прошла', 'Оплатили счёт за абонемент, спасибо за быструю работу 🙌', 20, true],
    ['Полина Соколова', 'telegram', 'Макеты', 'Скинула финальные макеты в общий чат, глянь, пожалуйста.', 28, true],
    ['Николай Фёдоров', 'email', 'Встреча в пятницу', 'Подтверждаю демо в пятницу в 13:00. Будем втроём.', 50, true],
  ].map(([from, channel, subject, body, hoursAgo, read]) => ({
    id: uid(),
    from,
    channel,
    subject,
    body,
    at: now - hoursAgo * HOUR,
    read,
    replies: [],
  }))

  const activity = [
    ['deal', 'Сделка «Годовой абонемент B2B» успешно закрыта', 3],
    ['lead', 'Новый лид: Хана Сато из Telegram', 20],
    ['task', 'Задача «Проверить оплату от «Волны»» выполнена', 26],
    ['message', 'Дмитрий Волков написал в Telegram', 2],
    ['deal', 'Сделка «Поставка зерна на год» → Переговоры', 30],
  ]
    .map(([type, text, hoursAgo]) => ({ id: uid(), type, text, at: now - hoursAgo * HOUR }))
    .sort((a, b) => b.at - a.at)

  const revenue = [410, 380, 455, 520, 490, 610, 580, 640, 705, 690, 760, 820].map((v) => v * 1000)
  const contactsHistory = [182, 236, 141, 268, 174, 245, 192]
  const messagesDaily = Array.from({ length: 90 }, (_, i) => {
    // A dip in the middle then a strong recovery — similar curve to the reference.
    const t = i / 89
    const base = 1500 - 1100 * Math.sin(Math.PI * Math.min(1, t * 1.12)) + 600 * t
    return Math.max(80, Math.round(base + (r() - 0.5) * 220))
  })

  return {
    leads,
    deals,
    contacts,
    companies,
    tasks,
    events,
    messages,
    activity,
    integrations: { telegram: true, email: true, calendar: true, whatsapp: false, payments: true },
    stats: {
      revenue,
      contacts: contactsHistory,
      messagesDaily,
      credits: 245000,
      creditsUsed: 35000,
    },
  }
}
