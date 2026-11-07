import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Clock3, Plus, Search, Sparkles, Target, Trash2, UserCheck, Users } from 'lucide-react'
import { useStore } from '../lib/store'
import { Avatar, Button, Chip, Empty, Field, KpiCard, Modal, PageHeader, Tabs, inputCls, stagger } from '../components/ui'
import { Bar } from '../components/charts'
import { LEAD_SOURCES, LEAD_STATUSES } from '../lib/constants'
import { money, pct, relativeTime } from '../lib/format'
import { TEAM } from '../lib/seed'

const teamById = Object.fromEntries(TEAM.map((t) => [t.id, t]))
const scoreColor = (s) => (s >= 75 ? '#34d399' : s >= 55 ? '#fbbf24' : '#f87171')
const STATUS_ORDER = ['new', 'contacted', 'qualified', 'unqualified']

function LeadModal({ open, onClose }) {
  const addLead = useStore((s) => s.addLead)
  const toast = useStore((s) => s.toast)
  const blank = { name: '', company: '', source: 'site', value: '', owner: 'me', score: 60 }
  const [f, setF] = useState(blank)
  useEffect(() => {
    if (open) setF(blank)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const submit = (e) => {
    e.preventDefault()
    if (!f.name.trim()) return
    addLead({ ...f, name: f.name.trim(), value: Number(f.value) || 0, score: Number(f.score) })
    toast('Лид добавлен', 'success')
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Новый лид" subtitle="Потенциальный клиент попадёт в список со статусом «Новый»">
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Имя">
            <input autoFocus className={inputCls} value={f.name} onChange={set('name')} placeholder="Анна Иванова" />
          </Field>
          <Field label="Компания">
            <input className={inputCls} value={f.company} onChange={set('company')} placeholder="Студия «Север»" />
          </Field>
          <Field label="Источник">
            <select className={inputCls} value={f.source} onChange={set('source')}>
              {Object.entries(LEAD_SOURCES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Потенциальная сумма">
            <input className={inputCls} type="number" min="0" value={f.value} onChange={set('value')} placeholder="50000" />
          </Field>
          <Field label="Ответственный">
            <select className={inputCls} value={f.owner} onChange={set('owner')}>
              {TEAM.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`Оценка лида: ${f.score}`}>
            <input type="range" min="0" max="100" value={f.score} onChange={set('score')} className="mt-3 accent-blue-500" />
          </Field>
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit">Добавить лид</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function Leads() {
  const { leads, prefs, updateLead, deleteLead, convertLead, toast, setPage } = useStore()
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const cur = prefs.currency

  const weekAgo = Date.now() - 7 * 86400000
  const openLeads = leads.filter((l) => l.status !== 'unqualified')
  const newThisWeek = leads.filter((l) => l.createdAt > weekAgo).length
  const qualifiedRate = leads.length ? (leads.filter((l) => l.status === 'qualified').length / leads.length) * 100 : 0

  const tabs = [
    { value: 'all', label: 'Все', count: leads.length },
    ...STATUS_ORDER.map((s) => ({ value: s, label: LEAD_STATUSES[s].label, count: leads.filter((l) => l.status === s).length })),
  ]

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return leads
      .filter((l) => filter === 'all' || l.status === filter)
      .filter((l) => !s || l.name.toLowerCase().includes(s) || (l.company || '').toLowerCase().includes(s))
      .sort((a, b) => b.score - a.score)
  }, [leads, filter, q])

  const cycleStatus = (l) => {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(l.status) + 1) % STATUS_ORDER.length]
    updateLead(l.id, { status: next })
  }

  return (
    <>
      <PageHeader title="Лиды" subtitle="Оценивайте, квалифицируйте и превращайте потенциальных клиентов в сделки">
        <div className="glass-input flex h-9 w-56 items-center gap-2 rounded-full px-3">
          <Search size={14} className="text-white/45" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск лидов" className="w-full bg-transparent text-xs outline-none placeholder:text-white/40" />
        </div>
        <Button icon={Plus} onClick={() => setOpen(true)}>
          Добавить лид
        </Button>
      </PageHeader>

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-4 gap-3.5">
        <KpiCard icon={Users} label="Открытые лиды" value={openLeads.length} change={18} />
        <KpiCard icon={Sparkles} label="Новые за неделю" value={newThisWeek} change={12} />
        <KpiCard icon={UserCheck} label="Доля квалифицированных" value={qualifiedRate} format={(v) => pct(v)} change={3.4} />
        <KpiCard icon={Clock3} label="Среднее время ответа" value={72} format={(v) => `${Math.floor(v / 60)} ч ${Math.round(v % 60)} м`} change={-9} />
      </motion.div>

      <div className="mt-5 flex items-center justify-between">
        <Tabs tabs={tabs} value={filter} onChange={setFilter} />
        <button onClick={() => setPage('deals')} className="flex items-center gap-1 text-xs text-white/55 hover:text-white">
          Воронка сделок <ArrowRight size={13} />
        </button>
      </div>

      <div className="glass-inset mt-3 overflow-hidden rounded-2xl">
        <div className="grid grid-cols-[2.2fr_1.1fr_1.3fr_1.2fr_1fr_1fr_112px] gap-3 border-b border-white/8 px-4 py-2.5 text-[10.5px] uppercase tracking-wider text-white/40">
          <span>Лид</span>
          <span>Источник</span>
          <span>Оценка</span>
          <span>Статус</span>
          <span>Менеджер</span>
          <span className="text-right">Сумма</span>
          <span />
        </div>
        {rows.length === 0 && (
          <Empty icon={Target} title="Лидов не найдено" text="Измените фильтр или добавьте первого лида" action={<Button size="sm" icon={Plus} onClick={() => setOpen(true)}>Добавить</Button>} />
        )}
        <AnimatePresence initial={false}>
          {rows.map((l, i) => {
            const owner = teamById[l.owner] || TEAM[0]
            const src = LEAD_SOURCES[l.source] || LEAD_SOURCES.site
            const st = LEAD_STATUSES[l.status]
            return (
              <motion.div
                key={l.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 12) * 0.035 } }}
                exit={{ opacity: 0, x: 30, transition: { duration: 0.2 } }}
                className="group grid grid-cols-[2.2fr_1.1fr_1.3fr_1.2fr_1fr_1fr_112px] items-center gap-3 border-b border-white/[0.05] px-4 py-2.5 transition-colors last:border-0 hover:bg-white/[0.05]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={l.name} color={src.color} size={30} />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">{l.name}</p>
                    <p className="truncate text-[11px] text-white/45">
                      {l.company} · {relativeTime(l.createdAt)}
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-2 text-xs text-white/75">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: src.color }} />
                  {src.label}
                </span>
                <div className="flex items-center gap-2.5">
                  <Bar value={l.score} color={scoreColor(l.score)} height={4} className="max-w-[90px]" delay={0.1 + i * 0.03} />
                  <span className="w-6 text-xs tabular text-white/70">{l.score}</span>
                </div>
                <div>
                  <Chip color={st.color} onClick={() => cycleStatus(l)}>
                    {st.label}
                  </Chip>
                </div>
                <span className="flex items-center gap-2 text-xs text-white/75">
                  <Avatar name={owner.name} color={owner.color} size={22} />
                  {owner.short}
                </span>
                <span className="text-right text-[13px] tabular">{money(l.value, cur)}</span>
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => deleteLead(l.id)}
                    className="rounded-full p-1.5 text-white/40 opacity-0 transition-all hover:bg-red-500/20 hover:text-red-300 group-hover:opacity-100"
                    aria-label="Удалить лид"
                  >
                    <Trash2 size={13} />
                  </button>
                  {l.converted ? (
                    <span className="px-2 text-[11px] text-emerald-300/80">в сделке</span>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => {
                        convertLead(l.id)
                        toast(`«${l.name}» → новая сделка`, 'success')
                      }}
                      className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium ring-1 ring-white/12 hover:bg-white/20"
                    >
                      В сделку
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
      <p className="mt-2 text-[11px] text-white/35">Подсказка: кликните по статусу, чтобы переключить его.</p>

      <LeadModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
