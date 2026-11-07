import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { Avatar, Button, PageHeader, cx } from '../components/ui'
import { DEAL_STAGES } from '../lib/constants'
import { compactMoney, humanDate, isoDate, money } from '../lib/format'
import { TEAM } from '../lib/seed'
import DealModal from './DealModal'

const teamById = Object.fromEntries(TEAM.map((t) => [t.id, t]))

function DealCard({ deal, color, currency, onDelete, onDragStart, onDragEnd, dragging }) {
  const owner = teamById[deal.owner] || TEAM[0]
  const overdue = deal.stage !== 'won' && deal.closeDate < isoDate(new Date())
  return (
    <motion.div
      layout
      layoutId={deal.id}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: dragging ? 0.4 : 1, scale: dragging ? 0.97 : 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 34 }}
      whileHover={{ y: -2 }}
    >
      {/* Native HTML5 drag lives on a plain div: motion.* reserves onDragStart for its own gestures. */}
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className="group relative cursor-grab rounded-2xl bg-white/[0.08] p-3 ring-1 ring-white/10 transition-shadow hover:shadow-[0_12px_30px_-14px_rgba(0,0,0,0.7)] active:cursor-grabbing"
      >
      <span className="absolute left-0 top-3 h-6 w-[3px] rounded-r-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium leading-snug">{deal.title}</p>
        <button
          onClick={onDelete}
          className="-mr-1 -mt-1 rounded-full p-1 text-white/30 opacity-0 transition-all hover:bg-red-500/20 hover:text-red-300 group-hover:opacity-100"
          aria-label="Удалить сделку"
        >
          <Trash2 size={12} />
        </button>
      </div>
      <p className="mt-0.5 truncate text-[11px] text-white/45">{deal.company}</p>
      <p className="mt-2.5 font-display text-lg leading-none tabular">{money(deal.value, currency)}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className={cx('flex items-center gap-1 text-[10.5px]', overdue ? 'text-red-300' : 'text-white/45')}>
          <CalendarDays size={11} />
          {humanDate(deal.closeDate)}
        </span>
        <Avatar name={owner.name} color={owner.color} size={20} />
      </div>
      </div>
    </motion.div>
  )
}

export default function Deals() {
  const { deals, prefs, moveDeal, deleteDeal, toast } = useStore()
  const [dragId, setDragId] = useState(null)
  const [over, setOver] = useState(null)
  const [modal, setModal] = useState(null)
  const cur = prefs.currency
  const openSum = deals.filter((d) => d.stage !== 'won').reduce((s, d) => s + d.value, 0)
  const weighted = deals.reduce((s, d) => s + d.value * ((DEAL_STAGES.find((x) => x.id === d.stage)?.probability || 0) / 100), 0)

  const drop = (stage) => {
    if (dragId) {
      const deal = deals.find((d) => d.id === dragId)
      moveDeal(dragId, stage)
      if (deal && deal.stage !== stage && stage === 'won') toast(`Сделка «${deal.title}» закрыта успешно!`, 'success')
    }
    setDragId(null)
    setOver(null)
  }

  return (
    <>
      <PageHeader title="Сделки" subtitle={`В работе ${compactMoney(openSum, cur)} · взвешенный прогноз ${compactMoney(weighted, cur)}`}>
        <Button icon={Plus} onClick={() => setModal('new')}>
          Новая сделка
        </Button>
      </PageHeader>

      <div className="grid min-h-[calc(100%-80px)] grid-cols-5 gap-3">
        {DEAL_STAGES.map((stage, si) => {
          const items = deals.filter((d) => d.stage === stage.id)
          const sum = items.reduce((s, d) => s + d.value, 0)
          const isOver = over === stage.id
          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.06, duration: 0.45 }}
              onDragOver={(e) => {
                e.preventDefault()
                if (over !== stage.id) setOver(stage.id)
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setOver(null)
              }}
              onDrop={() => drop(stage.id)}
              className={cx(
                'flex min-w-0 flex-col rounded-2xl p-2 transition-all duration-200',
                isOver ? 'bg-white/12 ring-2' : 'bg-black/10 ring-1 ring-white/[0.06]',
              )}
              style={isOver ? { '--tw-ring-color': `${stage.color}aa`, boxShadow: `0 0 30px -10px ${stage.color}` } : undefined}
            >
              <div className="mb-2 flex items-center justify-between px-1.5 pt-1">
                <span className="flex items-center gap-2 text-xs font-medium">
                  <span className="h-2 w-2 rounded-full" style={{ background: stage.color, boxShadow: `0 0 8px ${stage.color}` }} />
                  {stage.label}
                  <span className="rounded-full bg-white/10 px-1.5 text-[10px] text-white/60">{items.length}</span>
                </span>
                <button onClick={() => setModal(stage.id)} className="rounded-full p-1 text-white/40 hover:bg-white/10 hover:text-white" aria-label="Добавить сделку на этап">
                  <Plus size={13} />
                </button>
              </div>
              <p className="mb-2 px-1.5 text-[11px] tabular text-white/40">{compactMoney(sum, cur)}</p>
              <div className="flex flex-1 flex-col gap-2">
                <AnimatePresence>
                  {items.map((d) => (
                    <DealCard
                      key={d.id}
                      deal={d}
                      color={stage.color}
                      currency={cur}
                      dragging={dragId === d.id}
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move'
                        setDragId(d.id)
                      }}
                      onDragEnd={() => {
                        setDragId(null)
                        setOver(null)
                      }}
                      onDelete={() => deleteDeal(d.id)}
                    />
                  ))}
                </AnimatePresence>
                {items.length === 0 && (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/10 py-8 text-[11px] text-white/30">
                    Перетащите сюда
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      <DealModal open={!!modal} stage={modal === 'new' ? 'new' : modal} onClose={() => setModal(null)} />
    </>
  )
}
