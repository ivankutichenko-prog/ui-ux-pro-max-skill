import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import { useStore } from '../lib/store'
import { Bar, Columns, Donut } from '../components/charts'
import { Avatar, Button, Card, CountUp, PageHeader, stagger } from '../components/ui'
import { DEAL_STAGES, LEAD_SOURCES } from '../lib/constants'
import { MONTHS_SHORT, compactMoney, money, num, plural } from '../lib/format'
import { TEAM } from '../lib/seed'

export default function Reports() {
  const { stats, leads, deals, prefs, toast } = useStore()
  const cur = prefs.currency
  const month = new Date().getMonth()
  const labels = stats.revenue.map((_, i) => MONTHS_SHORT[(month - (stats.revenue.length - 1 - i) + 24) % 12])
  const yearTotal = stats.revenue.reduce((a, b) => a + b, 0)

  const sources = Object.entries(LEAD_SOURCES)
    .map(([k, v]) => ({ label: v.label, color: v.color, value: leads.filter((l) => l.source === k).length }))
    .filter((s) => s.value > 0)

  // Funnel: leads → qualified → deals in late stages → won
  const funnel = [
    { label: 'Лиды', value: leads.length + deals.length, color: '#60a5fa' },
    { label: 'Квалифицированы', value: leads.filter((l) => l.status === 'qualified').length + deals.length, color: '#a78bfa' },
    { label: 'Предложение', value: deals.filter((d) => ['proposal', 'negotiation', 'won'].includes(d.stage)).length, color: '#fbbf24' },
    { label: 'Переговоры', value: deals.filter((d) => ['negotiation', 'won'].includes(d.stage)).length, color: '#f472b6' },
    { label: 'Успешно', value: deals.filter((d) => d.stage === 'won').length, color: '#34d399' },
  ]
  const fMax = Math.max(funnel[0].value, 1)

  const leaderboard = TEAM.map((p) => ({
    ...p,
    won: deals.filter((d) => d.owner === p.id && d.stage === 'won').reduce((s, d) => s + d.value, 0),
    open: deals.filter((d) => d.owner === p.id && d.stage !== 'won').length,
  })).sort((a, b) => b.won - a.won)
  const lMax = Math.max(...leaderboard.map((l) => l.won), 1)

  const exportCsv = () => {
    const rows = [['Месяц', 'Выручка'], ...stats.revenue.map((v, i) => [labels[i], v]), [], ['Сделка', 'Компания', 'Этап', 'Сумма', 'Дата закрытия']]
    deals.forEach((d) => rows.push([d.title, d.company, DEAL_STAGES.find((s) => s.id === d.stage)?.label, d.value, d.closeDate]))
    const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `glassy-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    toast('Отчёт сохранён в CSV', 'success')
  }

  return (
    <>
      <PageHeader title="Отчёты" subtitle="Аналитика продаж за последние 12 месяцев">
        <Button variant="glass" icon={Download} onClick={exportCsv}>
          Экспорт CSV
        </Button>
      </PageHeader>

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-12 gap-3.5">
        <Card className="col-span-8 p-5" hover={false}>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-white/55">Выручка за год</p>
              <CountUp value={yearTotal} format={(v) => money(v, cur)} className="mt-1 block font-display text-[28px] leading-none" />
            </div>
            <span className="text-[11px] text-white/45">Текущий месяц выделен</span>
          </div>
          <div className="mt-6">
            <Columns data={stats.revenue} labels={labels} height={200} format={(v) => money(v, cur)} />
          </div>
        </Card>

        <Card className="col-span-4 flex flex-col items-center p-5" hover={false}>
          <p className="self-start text-xs text-white/55">Лиды по источникам</p>
          <div className="mt-4">
            <Donut
              segments={sources.length ? sources : [{ label: 'Нет данных', value: 1, color: '#ffffff33' }]}
              center={
                <>
                  <div className="font-display text-3xl tabular">{num(leads.length)}</div>
                  <div className="text-[11px] text-white/50">лидов</div>
                </>
              }
            />
          </div>
          <div className="mt-5 grid w-full grid-cols-2 gap-x-3 gap-y-1.5">
            {sources.map((s) => (
              <span key={s.label} className="flex items-center gap-2 text-[11px] text-white/70">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                <span className="flex-1 truncate">{s.label}</span>
                <span className="tabular text-white/45">{s.value}</span>
              </span>
            ))}
          </div>
        </Card>

        <Card className="col-span-6 p-5" hover={false}>
          <p className="mb-4 text-xs text-white/55">Воронка конверсии</p>
          <div className="flex flex-col items-center gap-1.5">
            {funnel.map((f, i) => {
              const w = 42 + (f.value / fMax) * 58
              const conv = i > 0 && funnel[i - 1].value ? Math.round((f.value / funnel[i - 1].value) * 100) : null
              return (
                <motion.div
                  key={f.label}
                  className="relative flex h-9 items-center justify-between overflow-hidden rounded-xl px-3 text-xs"
                  initial={{ width: '10%', opacity: 0 }}
                  animate={{ width: `${w}%`, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.15 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  style={{ background: `linear-gradient(90deg, ${f.color}55, ${f.color}30)`, boxShadow: `inset 0 0 0 1px ${f.color}55` }}
                >
                  <span className="truncate font-medium">{f.label}</span>
                  <span className="tabular text-white/80">
                    {f.value}
                    {conv != null && <span className="ml-1.5 text-white/45">{conv}%</span>}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </Card>

        <Card className="col-span-6 p-5" hover={false}>
          <p className="mb-4 text-xs text-white/55">Рейтинг команды · закрытые сделки</p>
          <div className="flex flex-col gap-3.5">
            {leaderboard.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.07 }} className="flex items-center gap-3">
                <span className="w-4 text-xs tabular text-white/40">{i + 1}</span>
                <Avatar name={p.name} color={p.color} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between text-xs">
                    <span>{p.name}</span>
                    <span className="tabular text-white/70">{compactMoney(p.won, cur)}</span>
                  </div>
                  <Bar value={p.won} max={lMax} color={p.color} className="mt-1.5" delay={0.3 + i * 0.08} />
                  <p className="mt-1 text-[10.5px] text-white/40">
                    {p.open} {plural(p.open, ['сделка', 'сделки', 'сделок'])} в работе
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>
    </>
  )
}
