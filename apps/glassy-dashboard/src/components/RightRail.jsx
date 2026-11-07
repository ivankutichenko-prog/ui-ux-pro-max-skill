import { useMemo, useState } from 'react'
import { Reorder, motion, useDragControls } from 'framer-motion'
import { GripVertical, Plus, Wallet } from 'lucide-react'
import { useStore } from '../lib/store'
import { AreaChart, PillBars } from './charts'
import { Button, Change, CountUp, Modal, Tabs, cx } from './ui'
import { MONTHS_GEN, MONTHS_LETTER, MONTHS_PREP, addDays, money, num } from '../lib/format'

function Grip({ controls }) {
  return (
    <button
      onPointerDown={(e) => controls.start(e)}
      className="cursor-grab touch-none rounded p-0.5 text-white/35 hover:text-white/80 active:cursor-grabbing"
      aria-label="Перетащить виджет"
      title="Перетащите, чтобы поменять порядок"
    >
      <GripVertical size={14} />
    </button>
  )
}

function ContactsWidget({ controls }) {
  const history = useStore((s) => s.stats.contacts)
  const total = history.reduce((a, b) => a + b, 0)
  const prev = history[history.length - 2] || 0
  const last = history[history.length - 1] || 0
  const change = prev ? ((last - prev) / prev) * 100 : 0
  const month = new Date().getMonth()
  const labels = history.map((_, i) => MONTHS_LETTER[(month - (history.length - 1 - i) + 12) % 12])

  return (
    <div
      className="glass relative overflow-hidden rounded-[24px] p-4"
      style={{
        background:
          'linear-gradient(165deg, rgba(147,197,253,0.55) 0%, rgba(59,130,246,0.38) 45%, rgba(30,64,175,0.42) 100%)',
        borderColor: 'rgba(191,219,254,0.35)',
      }}
    >
      <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/25 blur-2xl" />
      <div className="relative flex items-start justify-between">
        <p className="text-xs font-medium text-white/85">Контакты</p>
        <Grip controls={controls} />
      </div>
      <CountUp value={total} format={num} className="relative mt-1 block font-display text-[30px] leading-none" />
      <div className="relative mt-1.5 flex items-center gap-2 text-[11px] text-white/75">
        +{num(last)} в {MONTHS_PREP[month]}
        <Change value={change} className="!bg-white/20 !text-white" />
      </div>
      <PillBars data={history} labels={labels} height={108} className="relative mt-4" format={num} />
    </div>
  )
}

function CreditsWidget({ controls }) {
  const { credits, creditsUsed } = useStore((s) => s.stats)
  const currency = useStore((s) => s.prefs.currency)
  const addCredits = useStore((s) => s.addCredits)
  const toast = useStore((s) => s.toast)
  const [open, setOpen] = useState(false)
  const balance = credits - creditsUsed

  return (
    <div className="glass rounded-[24px] p-4">
      <div className="flex items-start justify-between">
        <p className="flex items-center gap-1.5 text-xs font-medium text-white/80">
          <Wallet size={13} /> Баланс рассылок
        </p>
        <Grip controls={controls} />
      </div>
      <div className="mt-1 flex items-end justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <CountUp value={balance} format={(v) => money(v, currency)} className="font-display text-[26px] leading-none" />
          <span className="text-[10px] text-white/45">{money(creditsUsed, currency)} израсходовано</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.12, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setOpen(true)}
          aria-label="Пополнить баланс"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black shadow-[0_6px_18px_-6px_rgba(255,255,255,0.8)]"
        >
          <Plus size={16} strokeWidth={2.5} />
        </motion.button>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Пополнить баланс" subtitle="Средства используются для SMS и мессенджер-рассылок">
        <div className="grid grid-cols-3 gap-2">
          {[1000, 5000, 10000, 25000, 50000, 100000].map((a, i) => (
            <motion.button
              key={a}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                addCredits(a)
                setOpen(false)
                toast(`Баланс пополнен на ${money(a, currency)}`, 'success')
              }}
              className="glass-input rounded-xl py-3 text-sm font-semibold tabular"
            >
              {money(a, currency)}
            </motion.button>
          ))}
        </div>
      </Modal>
    </div>
  )
}

const PERIODS = [
  { value: 7, label: '7 дн' },
  { value: 30, label: '30 дн' },
  { value: 90, label: '90 дн' },
]

function MessagesWidget({ controls }) {
  const daily = useStore((s) => s.stats.messagesDaily)
  const [period, setPeriod] = useState(30)
  const data = daily.slice(-period)
  const total = data.reduce((a, b) => a + b, 0)
  const today = daily[daily.length - 1] || 0
  const prevTotal = daily.slice(-period * 2, -period).reduce((a, b) => a + b, 0)
  const change = prevTotal ? ((total - prevTotal) / prevTotal) * 100 : 0

  const { labels, axis } = useMemo(() => {
    const now = new Date()
    const labels = data.map((_, i) => {
      const d = addDays(now, -(data.length - 1 - i))
      return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`
    })
    const idx = [0, Math.floor(data.length / 3), Math.floor((2 * data.length) / 3), data.length - 1]
    return { labels, axis: idx.map((i) => labels[i]?.replace(/ (\S{3})\S*/, ' $1')) }
  }, [data])

  return (
    <div className="glass flex flex-col rounded-[24px] p-4 pb-7">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-white/80">Отправлено сообщений</p>
        <Grip controls={controls} />
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <CountUp value={total} format={num} className="block font-display text-[26px] leading-none" />
        <Tabs tabs={PERIODS} value={period} onChange={setPeriod} size="sm" />
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-white/55">
        {num(today)} сегодня <Change value={change} />
      </div>
      <AreaChart
        key={period}
        data={data}
        labels={labels}
        axisLabels={axis}
        height={112}
        className="mt-4"
        format={(v) => `${num(v)} сообщ.`}
      />
    </div>
  )
}

const WIDGETS = { contacts: ContactsWidget, credits: CreditsWidget, messages: MessagesWidget }

function RailItem({ id }) {
  const controls = useDragControls()
  const Widget = WIDGETS[id]
  return (
    <Reorder.Item
      value={id}
      dragListener={false}
      dragControls={controls}
      className="list-none"
      whileDrag={{ scale: 1.03, zIndex: 20, filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.45))' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <Widget controls={controls} />
    </Reorder.Item>
  )
}

export default function RightRail({ className }) {
  const order = useStore((s) => s.prefs.rightRail)
  const setPrefs = useStore((s) => s.setPrefs)
  const ids = order.filter((id) => WIDGETS[id])

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 24, delay: 0.14 }}
      className={cx('scroll-area -mr-1 w-[292px] shrink-0 pr-1', className)}
    >
      <Reorder.Group axis="y" values={ids} onReorder={(rightRail) => setPrefs({ rightRail })} className="flex flex-col gap-3.5">
        {ids.map((id) => (
          <RailItem key={id} id={id} />
        ))}
      </Reorder.Group>
    </motion.div>
  )
}
