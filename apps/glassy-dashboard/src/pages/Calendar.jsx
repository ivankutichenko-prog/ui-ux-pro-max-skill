import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Clock, Phone, Plus, Trash2, User, Video } from 'lucide-react'
import { useStore } from '../lib/store'
import { Button, Field, IconButton, Modal, PageHeader, cx, inputCls } from '../components/ui'
import { EVENT_COLORS } from '../lib/constants'
import { MONTHS_GEN, WEEKDAYS_SHORT, addDays, humanDate, isoDate, pad, sameDay, startOfWeek, toMinutes } from '../lib/format'

const START_H = 8
const END_H = 19
const ROW = 54

const fromMinutes = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`

function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])
  return now
}

/** Greedy lane assignment so overlapping events sit side by side. */
function layoutDay(events) {
  const sorted = [...events].sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
  const lanes = []
  const placed = sorted.map((e) => {
    const s = toMinutes(e.start)
    let lane = lanes.findIndex((end) => end <= s)
    if (lane === -1) {
      lane = lanes.length
      lanes.push(0)
    }
    lanes[lane] = toMinutes(e.end)
    return { ...e, lane }
  })
  return placed.map((e) => ({ ...e, lanes: lanes.length }))
}

function EventModal({ open, onClose, preset }) {
  const { addEvent, toast } = useStore()
  const [f, setF] = useState({})
  useEffect(() => {
    if (open) setF({ title: '', with: '', color: 'blue', date: isoDate(new Date()), start: '10:00', end: '11:00', ...preset })
  }, [open, preset])
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const submit = (e) => {
    e.preventDefault()
    if (!f.title?.trim()) return
    if (toMinutes(f.end) <= toMinutes(f.start)) return toast('Окончание должно быть позже начала', 'error')
    addEvent({ ...f, title: f.title.trim() })
    toast('Событие добавлено', 'success')
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Новое событие">
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <Field label="Название">
          <input autoFocus className={inputCls} value={f.title || ''} onChange={set('title')} placeholder="Встреча с клиентом" />
        </Field>
        <Field label="С кем">
          <input className={inputCls} value={f.with || ''} onChange={set('with')} placeholder="Имя или компания" />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Дата">
            <input className={inputCls} type="date" value={f.date || ''} onChange={set('date')} />
          </Field>
          <Field label="Начало">
            <input className={inputCls} type="time" step="900" value={f.start || ''} onChange={set('start')} />
          </Field>
          <Field label="Конец">
            <input className={inputCls} type="time" step="900" value={f.end || ''} onChange={set('end')} />
          </Field>
        </div>
        <Field label="Цвет">
          <div className="flex gap-2">
            {Object.entries(EVENT_COLORS).map(([k, c]) => (
              <motion.button
                type="button"
                key={k}
                whileTap={{ scale: 0.85 }}
                onClick={() => setF((s) => ({ ...s, color: k }))}
                className={cx('h-7 w-7 rounded-full ring-2 transition-all', f.color === k ? 'ring-white' : 'ring-transparent')}
                style={{ background: c.dot }}
                aria-label={k}
              />
            ))}
          </div>
        </Field>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit">Добавить</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function CalendarPage() {
  const { events, prefs, setPrefs, deleteEvent, toast } = useStore()
  const now = useNow()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [dir, setDir] = useState(0)
  const [modal, setModal] = useState(null)
  const [detail, setDetail] = useState(null)

  // On a weekend, the current week is shown in full so "today" is never hidden.
  const weekendToday = [0, 6].includes(now.getDay()) && sameDay(weekStart, startOfWeek(now))
  const dayCount = prefs.showWeekend || weekendToday ? 7 : 5
  const days = Array.from({ length: dayCount }, (_, i) => addDays(weekStart, i))
  const weekEvents = events.filter((e) => days.some((d) => isoDate(d) === e.date))
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const hours = Array.from({ length: END_H - START_H }, (_, i) => START_H + i)

  const byDay = useMemo(
    () => Object.fromEntries(days.map((d) => [isoDate(d), layoutDay(events.filter((e) => e.date === isoDate(d)))])),
    [events, weekStart, dayCount], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const todayIso = isoDate(now)
  const todays = events.filter((e) => e.date === todayIso).sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
  const upcoming = events
    .filter((e) => e.date > todayIso || (e.date === todayIso && toMinutes(e.end) >= nowMin))
    .sort((a, b) => a.date.localeCompare(b.date) || toMinutes(a.start) - toMinutes(b.start))
  const next = upcoming[0]
  const nextLive = next && next.date === todayIso && toMinutes(next.start) <= nowMin

  const shift = (n) => {
    setDir(n)
    setWeekStart((w) => addDays(w, 7 * n))
  }

  const onGridClick = (e, day) => {
    if (e.target !== e.currentTarget) return
    const rect = e.currentTarget.getBoundingClientRect()
    const mins = START_H * 60 + Math.floor(((e.clientY - rect.top) / ROW) * 2) * 30
    const start = Math.min(mins, (END_H - 1) * 60)
    setModal({ date: isoDate(day), start: fromMinutes(start), end: fromMinutes(start + 60) })
  }

  const monthLabel = `${weekStart.getDate()} ${MONTHS_GEN[weekStart.getMonth()]} – ${days[days.length - 1].getDate()} ${MONTHS_GEN[days[days.length - 1].getMonth()]}`

  return (
    <>
      <PageHeader title="Календарь" subtitle={`${monthLabel} · ${weekEvents.length} встреч`}>
        <div className="flex items-center gap-1 rounded-full bg-black/15 p-1 ring-1 ring-white/8">
          <IconButton icon={ChevronLeft} size={28} label="Предыдущая неделя" onClick={() => shift(-1)} />
          <button
            onClick={() => {
              setDir(0)
              setWeekStart(startOfWeek(new Date()))
            }}
            className="rounded-full px-3 py-1 text-xs text-white/75 hover:bg-white/10 hover:text-white"
          >
            Сегодня
          </button>
          <IconButton icon={ChevronRight} size={28} label="Следующая неделя" onClick={() => shift(1)} />
        </div>
        {!weekendToday && (
          <Button variant="glass" size="md" onClick={() => setPrefs({ showWeekend: !prefs.showWeekend })}>
            {prefs.showWeekend ? '5 дней' : '7 дней'}
          </Button>
        )}
        <Button icon={Plus} onClick={() => setModal({})}>
          Новое событие
        </Button>
      </PageHeader>

      <div className="flex gap-3.5">
        <div className="glass-inset min-w-0 flex-1 overflow-hidden rounded-2xl p-3">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={isoDate(weekStart) + dayCount}
              custom={dir}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.28 }}
            >
              <div className="grid gap-1.5" style={{ gridTemplateColumns: `44px repeat(${dayCount}, minmax(0, 1fr))` }}>
                <div />
                {days.map((d) => {
                  const today = sameDay(d, now)
                  return (
                    <div key={d.toISOString()} className="flex justify-center pb-2">
                      <span
                        className={cx(
                          'rounded-full px-3 py-1 text-xs',
                          today ? 'bg-white/20 font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] ring-1 ring-white/20' : 'text-white/60',
                        )}
                      >
                        {WEEKDAYS_SHORT[(d.getDay() + 6) % 7]} <span className="tabular">{d.getDate()}</span>
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="relative grid gap-1.5" style={{ gridTemplateColumns: `44px repeat(${dayCount}, minmax(0, 1fr))` }}>
                <div className="relative" style={{ height: hours.length * ROW }}>
                  {hours.map((h, i) => (
                    <span key={h} className="absolute right-1 -translate-y-1/2 text-[10px] tabular text-white/35" style={{ top: i * ROW }}>
                      {pad(h)}:00
                    </span>
                  ))}
                </div>
                {days.map((d, di) => {
                  const iso = isoDate(d)
                  const isToday = sameDay(d, now)
                  return (
                    <div
                      key={iso}
                      onClick={(e) => onGridClick(e, d)}
                      className={cx('relative cursor-copy rounded-xl', isToday ? 'bg-white/[0.06]' : 'bg-white/[0.025]')}
                      style={{
                        height: hours.length * ROW,
                        backgroundImage: `repeating-linear-gradient(180deg, transparent 0 ${ROW - 1}px, rgba(255,255,255,0.06) ${ROW - 1}px ${ROW}px)`,
                      }}
                      title="Кликните, чтобы создать событие"
                    >
                      {byDay[iso]?.map((e, ei) => {
                        const top = ((toMinutes(e.start) - START_H * 60) / 60) * ROW
                        const height = Math.max(22, ((toMinutes(e.end) - toMinutes(e.start)) / 60) * ROW - 3)
                        const c = EVENT_COLORS[e.color] || EVENT_COLORS.blue
                        const past = e.date < todayIso || (e.date === todayIso && toMinutes(e.end) < nowMin)
                        return (
                          <motion.button
                            key={e.id}
                            initial={{ opacity: 0, scale: 0.85, y: 6 }}
                            animate={{ opacity: past ? 0.72 : 1, scale: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.1 + di * 0.05 + ei * 0.04 }}
                            whileHover={{ scale: 1.04, zIndex: 5 }}
                            onClick={() => setDetail(e)}
                            title={`${e.title} · ${e.start}–${e.end}`}
                            className="absolute overflow-hidden rounded-lg px-2 py-1 text-left backdrop-blur-md"
                            style={{
                              top,
                              height,
                              left: `calc(${(e.lane / e.lanes) * 100}% + 3px)`,
                              width: `calc(${100 / e.lanes}% - 6px)`,
                              background: c.bg,
                              boxShadow: `inset 0 0 0 1px ${c.border}, inset 0 1px 0 rgba(255,255,255,0.25), 0 6px 16px -8px rgba(0,0,0,0.5)`,
                            }}
                          >
                            <p className="truncate text-[11px] font-semibold leading-tight">{e.title}</p>
                            {height > 34 && (
                              <p className="truncate text-[10px] text-white/65">
                                {e.start} · {e.with}
                              </p>
                            )}
                          </motion.button>
                        )
                      })}
                      {isToday && nowMin >= START_H * 60 && nowMin <= END_H * 60 && (
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.6, delay: 0.4 }}
                          className="pointer-events-none absolute left-0 right-0 z-10 h-0.5 origin-left bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.9)]"
                          style={{ top: ((nowMin - START_H * 60) / 60) * ROW }}
                        >
                          <span className="absolute -left-1 -top-[3px] h-2 w-2 rounded-full bg-red-400" />
                        </motion.div>
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className={cx('flex shrink-0 flex-col gap-3.5', dayCount === 7 ? 'w-[200px]' : 'w-[230px]')}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-inset rounded-2xl p-4">
            {next ? (
              <>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/25 text-emerald-300 ring-1 ring-emerald-300/30">
                  <Phone size={16} />
                </span>
                <p className="mt-3 text-[11px] uppercase tracking-wider text-white/40">{nextLive ? 'Сейчас' : 'Далее'}</p>
                <p className="mt-0.5 text-sm font-semibold leading-snug">{next.title}</p>
                <p className="mt-1 text-[11px] text-white/50">
                  {humanDate(next.date)} · {next.start}–{next.end}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/50">
                  <User size={10} /> {next.with}
                </p>
                <Button size="sm" icon={Video} className="mt-3" onClick={() => toast(`Подключаемся: ${next.title}`, 'success')}>
                  Присоединиться
                </Button>
              </>
            ) : (
              <p className="py-4 text-center text-xs text-white/45">Ближайших встреч нет</p>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="glass-inset rounded-2xl p-4">
            <p className="mb-3 text-sm font-medium">Сегодня</p>
            {todays.length === 0 && <p className="text-xs text-white/40">Свободный день</p>}
            <div className="flex flex-col gap-1">
              {todays.map((e, i) => {
                const past = toMinutes(e.end) < nowMin
                return (
                  <motion.button
                    key={e.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: past ? 0.45 : 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    onClick={() => setDetail(e)}
                    className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-2 py-1.5 text-left text-[11px] hover:bg-white/10"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: EVENT_COLORS[e.color]?.dot }} />
                    <span className="tabular text-white/45">{e.start}</span>
                    <span className="truncate text-white/85">{e.title}</span>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </div>
      </div>

      <EventModal open={!!modal} preset={modal} onClose={() => setModal(null)} />

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.title || ''} width={380}>
        {detail && (
          <div className="flex flex-col gap-3 text-sm">
            <p className="flex items-center gap-2 text-white/75">
              <Clock size={14} className="text-white/45" />
              {humanDate(detail.date)} · {detail.start}–{detail.end}
            </p>
            {detail.with && (
              <p className="flex items-center gap-2 text-white/75">
                <User size={14} className="text-white/45" /> {detail.with}
              </p>
            )}
            <div className="mt-3 flex justify-end">
              <Button
                variant="danger"
                icon={Trash2}
                onClick={() => {
                  deleteEvent(detail.id)
                  setDetail(null)
                  toast('Событие удалено')
                }}
              >
                Удалить
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
