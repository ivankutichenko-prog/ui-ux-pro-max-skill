import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, Banknote, CalendarClock, Check, CircleDollarSign, Handshake, Percent, Plus, Target, Video } from 'lucide-react'
import { useStore } from '../lib/store'
import { AreaChart, Bar, Sparkline } from '../components/charts'
import { Avatar, Button, Card, Change, KpiCard, Tabs, rise, stagger } from '../components/ui'
import { DEAL_STAGES, EVENT_COLORS } from '../lib/constants'
import { MONTHS_SHORT, compactMoney, greeting, isoDate, money, pct, relativeTime, toMinutes } from '../lib/format'
import { TEAM } from '../lib/seed'
import DealModal from './DealModal'

const ACT_ICON = { deal: Handshake, lead: Target, task: Check, message: Activity, contact: Activity, event: CalendarClock, credits: Banknote, company: Activity }

export default function Overview() {
  const { prefs, deals, leads, stats, events, tasks, activity, toggleTask, setPage } = useStore()
  const [range, setRange] = useState(12)
  const [dealOpen, setDealOpen] = useState(false)
  const cur = prefs.currency

  const m = useMemo(() => {
    const open = deals.filter((d) => d.stage !== 'won')
    const won = deals.filter((d) => d.stage === 'won')
    const rev = stats.revenue
    const thisMonth = rev[rev.length - 1]
    const lastMonth = rev[rev.length - 2] || 0
    const qualified = leads.filter((l) => l.status === 'qualified').length
    const conv = leads.length ? (qualified / leads.length) * 100 : 0
    const avg = won.length ? won.reduce((s, d) => s + d.value, 0) / won.length : 0
    return {
      openCount: open.length,
      openSum: open.reduce((s, d) => s + d.value, 0),
      thisMonth,
      revChange: lastMonth ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0,
      conv,
      avg,
      stageSums: DEAL_STAGES.map((s) => ({ ...s, sum: deals.filter((d) => d.stage === s.id).reduce((a, d) => a + d.value, 0), count: deals.filter((d) => d.stage === s.id).length })),
    }
  }, [deals, leads, stats])

  const month = new Date().getMonth()
  const revData = stats.revenue.slice(-range)
  const revLabels = revData.map((_, i) => MONTHS_SHORT[(month - (revData.length - 1 - i) + 24) % 12])
  const maxStage = Math.max(...m.stageSums.map((s) => s.sum), 1)

  const today = isoDate(new Date())
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
  const todayEvents = events.filter((e) => e.date === today).sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
  const openTasks = tasks.filter((t) => !t.done).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 5)

  return (
    <>
      <div className="mb-5 flex items-end justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-display text-[30px] leading-tight tracking-tight">
            {greeting()}, {prefs.userName}
          </h1>
          <p className="mt-0.5 text-xs text-white/50">Вот что происходит в вашем бизнесе сегодня</p>
        </motion.div>
        <Button icon={Plus} onClick={() => setDealOpen(true)}>
          Новая сделка
        </Button>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-12 gap-3.5">
        <div className="col-span-12 grid grid-cols-4 gap-3.5">
          <KpiCard icon={CircleDollarSign} accent="#fcd34d" label="Выручка за месяц" value={m.thisMonth} format={(v) => money(v, cur)} change={m.revChange}>
            <Sparkline data={stats.revenue.slice(-8)} color="#fcd34d" width={84} />
          </KpiCard>
          <KpiCard icon={Handshake} accent="#93c5fd" label={`Открытые сделки · ${m.openCount}`} value={m.openSum} format={(v) => compactMoney(v, cur)} change={8.2}>
            <Sparkline data={[3, 5, 4, 6, 5, 7, 8, m.openCount]} color="#93c5fd" width={84} />
          </KpiCard>
          <KpiCard icon={Percent} accent="#6ee7b7" label="Конверсия лидов" value={m.conv} format={(v) => pct(v, 1)} change={3.4}>
            <Sparkline data={[18, 22, 21, 26, 24, 28, 27, m.conv]} color="#6ee7b7" width={84} />
          </KpiCard>
          <KpiCard icon={Banknote} accent="#f9a8d4" label="Средний чек" value={m.avg} format={(v) => money(v, cur)} change={-2.1}>
            <Sparkline data={[90, 84, 88, 80, 86, 79, 83, 84]} color="#f9a8d4" width={84} />
          </KpiCard>
        </div>

        <Card className="col-span-8 p-5 pb-8" hover={false}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-white/55">Выручка</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-display text-2xl tabular">{money(revData.reduce((a, b) => a + b, 0), cur)}</span>
                <Change value={m.revChange} />
              </div>
            </div>
            <Tabs
              size="sm"
              value={range}
              onChange={setRange}
              tabs={[
                { value: 3, label: '3 мес' },
                { value: 6, label: '6 мес' },
                { value: 12, label: '12 мес' },
              ]}
            />
          </div>
          <AreaChart
            key={range}
            data={revData}
            labels={revLabels}
            axisLabels={revLabels}
            height={190}
            color="#fcd34d"
            showGrid
            className="mt-5"
            format={(v) => money(v, cur)}
          />
        </Card>

        <Card className="col-span-4 flex flex-col p-5" hover={false}>
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/55">Воронка продаж</p>
            <button onClick={() => setPage('deals')} className="text-[11px] text-white/50 hover:text-white">
              Все сделки →
            </button>
          </div>
          <div className="mt-4 flex flex-1 flex-col justify-between gap-3">
            {m.stageSums.map((s, i) => (
              <div key={s.id}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-white/80">
                    <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                    {s.label}
                    <span className="text-white/35">{s.count}</span>
                  </span>
                  <span className="tabular text-white/70">{compactMoney(s.sum, cur)}</span>
                </div>
                <Bar value={s.sum} max={maxStage} color={s.color} height={6} delay={0.2 + i * 0.08} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="col-span-4 p-5" hover={false}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-white/55">Встречи сегодня</p>
            <button onClick={() => setPage('calendar')} className="text-[11px] text-white/50 hover:text-white">
              Календарь →
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {todayEvents.length === 0 && <p className="py-6 text-center text-xs text-white/40">Встреч на сегодня нет</p>}
            {todayEvents.slice(0, 4).map((e, i) => {
              const live = toMinutes(e.start) <= nowMin && nowMin <= toMinutes(e.end)
              const past = toMinutes(e.end) < nowMin
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: past ? 0.45 : 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                  className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5 ring-1 ring-white/6"
                >
                  <span className="h-8 w-1 rounded-full" style={{ background: EVENT_COLORS[e.color]?.dot }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px]">{e.title}</p>
                    <p className="text-[11px] text-white/45">
                      {e.start}–{e.end} · {e.with}
                    </p>
                  </div>
                  {live && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] text-emerald-300">
                      <Video size={11} /> идёт
                    </span>
                  )}
                </motion.div>
              )
            })}
          </div>
        </Card>

        <Card className="col-span-4 p-5" hover={false}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-white/55">Задачи</p>
            <button onClick={() => setPage('tasks')} className="text-[11px] text-white/50 hover:text-white">
              Все задачи →
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {openTasks.length === 0 && <p className="py-6 text-center text-xs text-white/40">Все задачи выполнены</p>}
            {openTasks.map((t) => (
              <motion.button
                layout
                key={t.id}
                onClick={() => toggleTask(t.id)}
                className="group flex items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-white/6"
              >
                <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md ring-1 ring-white/30 transition-colors group-hover:bg-white/15">
                  <Check size={12} className="opacity-0 transition-opacity group-hover:opacity-60" />
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-white/85">{t.title}</span>
                <span className={`text-[11px] ${t.due < today ? 'text-red-300' : t.due === today ? 'text-amber-300' : 'text-white/40'}`}>
                  {t.due < today ? 'просрочено' : t.due === today ? 'сегодня' : t.due.slice(8) + '.' + t.due.slice(5, 7)}
                </span>
              </motion.button>
            ))}
          </div>
        </Card>

        <Card className="col-span-4 p-5" hover={false}>
          <p className="mb-3 text-xs text-white/55">Последняя активность</p>
          <div className="relative flex flex-col gap-3 before:absolute before:bottom-2 before:left-[13px] before:top-2 before:w-px before:bg-white/10">
            {activity.slice(0, 5).map((a, i) => {
              const Icon = ACT_ICON[a.type] || Activity
              return (
                <motion.div key={a.id} variants={rise} className="relative flex items-start gap-3">
                  <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/12 ring-1 ring-white/15 backdrop-blur">
                    <Icon size={13} className="text-white/75" />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-[12.5px] leading-snug text-white/85">{a.text}</p>
                    <p className="text-[10.5px] text-white/40">{relativeTime(a.at)}</p>
                  </div>
                </motion.div>
              )
            })}
            {activity.length === 0 && <p className="py-6 text-center text-xs text-white/40">Пока пусто</p>}
          </div>
        </Card>

        <Card className="col-span-12 p-5" hover={false}>
          <p className="mb-4 text-xs text-white/55">Команда в этом месяце</p>
          <div className="grid grid-cols-4 gap-4">
            {TEAM.map((p, i) => {
              const won = deals.filter((d) => d.owner === p.id && d.stage === 'won').reduce((s, d) => s + d.value, 0)
              const pipe = deals.filter((d) => d.owner === p.id && d.stage !== 'won').reduce((s, d) => s + d.value, 0)
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <Avatar name={p.name} color={p.color} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between">
                      <span className="truncate text-[13px]">{p.short}</span>
                      <span className="text-[11px] tabular text-white/50">{compactMoney(pipe + won, cur)}</span>
                    </div>
                    <Bar value={pipe + won} max={Math.max(...TEAM.map((t) => deals.filter((d) => d.owner === t.id).reduce((s, d) => s + d.value, 0)), 1)} color={p.color} className="mt-1.5" delay={0.3 + i * 0.08} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </motion.div>

      <DealModal open={dealOpen} onClose={() => setDealOpen(false)} />
    </>
  )
}
