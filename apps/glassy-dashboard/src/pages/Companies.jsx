import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Building2, Globe, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { Button, Empty, Field, Modal, PageHeader, inputCls } from '../components/ui'
import { Bar } from '../components/charts'
import { compactMoney, initials } from '../lib/format'

const GRADS = [
  ['#fbbf24', '#f97316'],
  ['#34d399', '#0d9488'],
  ['#60a5fa', '#4f46e5'],
  ['#f472b6', '#db2777'],
  ['#a78bfa', '#7c3aed'],
  ['#38bdf8', '#0284c7'],
]

function CompanyModal({ open, onClose }) {
  const { addCompany, toast } = useStore()
  const blank = { name: '', industry: '', size: '', website: '' }
  const [f, setF] = useState(blank)
  useEffect(() => {
    if (open) setF(blank)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const submit = (e) => {
    e.preventDefault()
    if (!f.name.trim()) return
    addCompany({ ...f, name: f.name.trim(), size: Number(f.size) || 0, website: f.website.replace(/^https?:\/\//, '') })
    toast('Компания добавлена', 'success')
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Новая компания">
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <Field label="Название">
          <input autoFocus className={inputCls} value={f.name} onChange={set('name')} placeholder="ООО «Ромашка»" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Отрасль">
            <input className={inputCls} value={f.industry} onChange={set('industry')} placeholder="Ритейл" />
          </Field>
          <Field label="Сотрудников">
            <input className={inputCls} type="number" min="0" value={f.size} onChange={set('size')} />
          </Field>
        </div>
        <Field label="Сайт">
          <input className={inputCls} value={f.website} onChange={set('website')} placeholder="romashka.ru" />
        </Field>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit">Сохранить</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function Companies() {
  const { companies, deals, contacts, prefs, deleteCompany } = useStore()
  const [open, setOpen] = useState(false)
  const rows = companies.map((c) => {
    const cd = deals.filter((d) => d.company === c.name)
    return {
      ...c,
      pipeline: cd.filter((d) => d.stage !== 'won').reduce((s, d) => s + d.value, 0),
      won: cd.filter((d) => d.stage === 'won').reduce((s, d) => s + d.value, 0),
      dealCount: cd.length,
      people: contacts.filter((p) => p.company === c.name).length,
    }
  })
  const max = Math.max(...rows.map((r) => r.pipeline + r.won), 1)

  return (
    <>
      <PageHeader title="Компании" subtitle="Клиенты и партнёры, с которыми вы работаете">
        <Button icon={Plus} onClick={() => setOpen(true)}>
          Компания
        </Button>
      </PageHeader>

      <div className="glass-inset overflow-hidden rounded-2xl">
        <div className="grid grid-cols-[2fr_1fr_0.8fr_0.8fr_1.6fr_40px] gap-3 border-b border-white/8 px-4 py-2.5 text-[10.5px] uppercase tracking-wider text-white/40">
          <span>Компания</span>
          <span>Отрасль</span>
          <span>Контакты</span>
          <span>Сделки</span>
          <span>Объём (в работе + закрыто)</span>
          <span />
        </div>
        {rows.length === 0 && <Empty icon={Building2} title="Компаний пока нет" action={<Button size="sm" icon={Plus} onClick={() => setOpen(true)}>Добавить</Button>} />}
        <AnimatePresence initial={false}>
          {rows.map((c, i) => {
            const g = GRADS[i % GRADS.length]
            return (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
                exit={{ opacity: 0, x: 30 }}
                className="group grid grid-cols-[2fr_1fr_0.8fr_0.8fr_1.6fr_40px] items-center gap-3 border-b border-white/[0.05] px-4 py-3 last:border-0 hover:bg-white/[0.05]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
                    style={{ background: `linear-gradient(140deg, ${g[0]}, ${g[1]})` }}
                  >
                    {initials(c.name.replace(/[«»"]/g, ''))}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">{c.name}</p>
                    {c.website && (
                      <a href={`https://${c.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] text-white/45 hover:text-white">
                        <Globe size={10} /> {c.website}
                      </a>
                    )}
                  </div>
                </div>
                <span className="text-xs text-white/70">
                  {c.industry || '—'}
                  {c.size ? <span className="block text-[10.5px] text-white/40">{c.size} сотрудников</span> : null}
                </span>
                <span className="text-[13px] tabular text-white/80">{c.people}</span>
                <span className="text-[13px] tabular text-white/80">{c.dealCount}</span>
                <div className="flex items-center gap-3">
                  <Bar value={c.pipeline + c.won} max={max} color={g[0]} height={5} delay={0.1 + i * 0.04} />
                  <span className="w-16 shrink-0 text-right text-xs tabular">{compactMoney(c.pipeline + c.won, prefs.currency)}</span>
                </div>
                <button
                  onClick={() => deleteCompany(c.id)}
                  className="rounded-full p-1.5 text-white/30 opacity-0 transition-all hover:bg-red-500/20 hover:text-red-300 group-hover:opacity-100"
                  aria-label="Удалить компанию"
                >
                  <Trash2 size={13} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
      <CompanyModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
