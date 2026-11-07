import { motion } from 'framer-motion'
import {
  BarChart3,
  Building2,
  CalendarDays,
  Handshake,
  Inbox,
  LayoutGrid,
  LifeBuoy,
  ListChecks,
  Plug,
  SlidersHorizontal,
  Target,
  Users,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { cx, spring } from './ui'
import { initials } from '../lib/format'

export const NAV = [
  { id: 'overview', label: 'Обзор', icon: LayoutGrid },
  { id: 'inbox', label: 'Входящие', icon: Inbox },
  { id: 'leads', label: 'Лиды', icon: Target },
  { id: 'deals', label: 'Сделки', icon: Handshake },
  { id: 'contacts', label: 'Контакты', icon: Users },
  { id: 'companies', label: 'Компании', icon: Building2 },
  { id: 'tasks', label: 'Задачи', icon: ListChecks },
  { id: 'calendar', label: 'Календарь', icon: CalendarDays },
  { id: 'reports', label: 'Отчёты', icon: BarChart3 },
  { id: 'integrations', label: 'Интеграции', icon: Plug },
]
const BOTTOM = [
  { id: 'settings', label: 'Настройки', icon: SlidersHorizontal },
  { id: 'support', label: 'Поддержка', icon: LifeBuoy },
]

function NavItem({ item, active, badge, onClick, index }) {
  const Icon = item.icon
  return (
    <motion.button
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15 + index * 0.03, duration: 0.4 }}
      onClick={onClick}
      className={cx(
        'group relative flex h-9 w-full items-center gap-3 rounded-xl px-3 text-[13px] transition-colors',
        active ? 'text-white' : 'text-white/65 hover:text-white',
      )}
      aria-current={active ? 'page' : undefined}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          transition={spring}
          className="absolute inset-0 rounded-xl bg-white/16 shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_8px_20px_-10px_rgba(0,0,0,0.6)] ring-1 ring-white/12"
        />
      )}
      <span className="absolute inset-0 rounded-xl bg-white/0 transition-colors group-hover:bg-white/6" />
      <Icon size={16} strokeWidth={1.9} className="relative" />
      <span className="relative flex-1 text-left font-medium">{item.label}</span>
      {badge > 0 && (
        <motion.span
          key={badge}
          initial={{ scale: 0.4 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          className="relative flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-semibold shadow-[0_0_12px_rgba(59,130,246,0.8)]"
        >
          {badge}
        </motion.span>
      )}
    </motion.button>
  )
}

export default function Sidebar() {
  const page = useStore((s) => s.page)
  const setPage = useStore((s) => s.setPage)
  const prefs = useStore((s) => s.prefs)
  const unread = useStore((s) => s.messages.filter((m) => !m.read).length)

  return (
    <motion.aside
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 26, delay: 0.08 }}
      className="glass flex w-[212px] shrink-0 flex-col rounded-[26px] p-3"
    >
      <button onClick={() => setPage('settings')} className="mb-4 flex items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors hover:bg-white/6">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 text-xs font-bold shadow-[0_6px_16px_-6px_rgba(251,146,60,0.9),inset_0_1px_0_rgba(255,255,255,0.5)]">
          {initials(prefs.userName)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold leading-tight">{prefs.workspace}</span>
          <span className="block truncate text-[11px] text-white/45">{prefs.plan}</span>
        </span>
      </button>

      <nav className="flex flex-col gap-0.5">
        {NAV.map((item, i) => (
          <NavItem
            key={item.id}
            index={i}
            item={item}
            active={page === item.id}
            badge={item.id === 'inbox' ? unread : 0}
            onClick={() => setPage(item.id)}
          />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-0.5 border-t border-white/8 pt-3">
        {BOTTOM.map((item, i) => (
          <NavItem key={item.id} index={NAV.length + i} item={item} active={page === item.id} onClick={() => setPage(item.id)} />
        ))}
      </div>
    </motion.aside>
  )
}
