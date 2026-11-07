import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarClock, CheckCircle2, Info, ListChecks, TriangleAlert } from 'lucide-react'
import { useStore } from './lib/store'
import { isDesktop, prettyHotkey, useNotch } from './lib/notch'
import { isoDate, toMinutes } from './lib/format'
import Wallpaper from './components/Wallpaper'
import Sidebar, { NAV } from './components/Sidebar'
import TopStrip from './components/TopStrip'
import RightRail from './components/RightRail'
import { ease } from './components/ui'
import Overview from './pages/Overview'
import InboxPage from './pages/Inbox'
import Leads from './pages/Leads'
import Deals from './pages/Deals'
import Contacts from './pages/Contacts'
import Companies from './pages/Companies'
import Tasks from './pages/Tasks'
import CalendarPage from './pages/Calendar'
import Reports from './pages/Reports'
import Integrations from './pages/Integrations'
import Settings from './pages/Settings'
import Support from './pages/Support'

const PAGES = {
  overview: Overview,
  inbox: InboxPage,
  leads: Leads,
  deals: Deals,
  contacts: Contacts,
  companies: Companies,
  tasks: Tasks,
  calendar: CalendarPage,
  reports: Reports,
  integrations: Integrations,
  settings: Settings,
  support: Support,
}

// ---------------------------------------------------------------- toasts --
function Toasts() {
  const toasts = useStore((s) => s.toasts)
  const icons = { success: CheckCircle2, error: TriangleAlert, info: Info }
  return (
    <div className="pointer-events-none absolute bottom-6 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.tone] || Info
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.9, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 12, scale: 0.95, filter: 'blur(4px)' }}
              transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              className="glass-dark flex items-center gap-2.5 rounded-full py-2 pl-3 pr-4 text-[13px] shadow-2xl"
            >
              <Icon size={16} className={t.tone === 'error' ? 'text-red-300' : t.tone === 'success' ? 'text-emerald-300' : 'text-blue-300'} />
              {t.text}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

// ------------------------------------------------------------- dashboard --
function Dashboard() {
  const page = useStore((s) => s.page)
  const setPage = useStore((s) => s.setPage)
  const { layout, request } = useNotch()
  const Page = PAGES[page] || Overview
  const showRail = layout.panelWidth >= 1240

  // Esc collapses, Ctrl/⌘ + 1…0 jumps between sections.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !e.defaultPrevented) {
        const tag = document.activeElement?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return document.activeElement.blur()
        request('collapse')
      }
      if ((e.metaKey || e.ctrlKey) && /^[0-9]$/.test(e.key)) {
        const idx = e.key === '0' ? 9 : Number(e.key) - 1
        if (NAV[idx]) {
          e.preventDefault()
          setPage(NAV[idx].id)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [request, setPage])

  return (
    <div className="relative h-full w-full">
      <Wallpaper />
      <div className="relative flex h-full flex-col px-4 pb-4">
        <TopStrip />
        <div className="flex min-h-0 flex-1 gap-3.5">
          <Sidebar />
          <motion.main
            initial={{ opacity: 0, y: 20, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 170, damping: 24, delay: 0.1 }}
            className="glass relative min-w-0 flex-1 overflow-hidden rounded-[28px]"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                className="scroll-area absolute inset-0 px-6 pb-6 pt-5"
                initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
                transition={{ duration: 0.32, ease }}
              >
                <Page />
              </motion.div>
            </AnimatePresence>
          </motion.main>
          {showRail && <RightRail />}
        </div>
      </div>
      <div id="modal-root" className="pointer-events-none absolute inset-0 z-50" />
      <Toasts />
    </div>
  )
}

// ------------------------------------------------------------------ peek --
function Peek() {
  const events = useStore((s) => s.events)
  const tasks = useStore((s) => s.tasks)
  const { settings } = useNotch()
  const now = new Date()
  const today = isoDate(now)
  const mins = now.getHours() * 60 + now.getMinutes()
  const next = events
    .filter((e) => e.date === today && toMinutes(e.end) >= mins)
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))[0]
  const openTasks = tasks.filter((t) => !t.done && t.due <= today).length

  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(6px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)', transition: { delay: 0.12, duration: 0.25 } }}
      exit={{ opacity: 0, filter: 'blur(4px)', transition: { duration: 0.1 } }}
      className="absolute inset-x-0 bottom-0 flex items-center gap-3 px-4 pb-3"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
        <CalendarClock size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium">{next ? next.title : 'Сегодня встреч больше нет'}</span>
        <span className="block truncate text-[11px] text-white/50">
          {next ? `${next.start}–${next.end} · ${next.with}` : 'Можно спокойно поработать'}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/70">
        <ListChecks size={12} /> {openTasks}
      </span>
      <kbd className="shrink-0 rounded-md bg-white/12 px-1.5 py-0.5 font-sans text-[10px] text-white/70">
        {prettyHotkey(settings.activeHotkey || settings.hotkey)}
      </kbd>
    </motion.div>
  )
}

/** Concave corner that melts the notch into the top edge of the screen. */
function Ear({ side, size }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      className="absolute top-0"
      style={{ [side]: -size + 0.5, transform: side === 'right' ? 'scaleX(-1)' : undefined }}
      aria-hidden
    >
      <path d="M0,0 L10,0 L10,10 A10,10 0 0 0 0,0 Z" fill="black" />
    </svg>
  )
}

function PillIdle() {
  const { layout } = useNotch()
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 15000)
    return () => clearInterval(t)
  }, [])
  // On notched Macs the idle pill sits behind the camera housing, so keep it empty.
  if (layout.hasNotch) return null
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay: 0.2 } }}
      exit={{ opacity: 0, transition: { duration: 0.08 } }}
      className="absolute inset-x-0 top-0 flex items-center justify-between px-3.5"
      style={{ height: layout.notchHeight }}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
      <span className="text-[11px] font-medium tabular text-white/80">
        {time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </motion.div>
  )
}

// ------------------------------------------------------------- the notch --
export default function App() {
  const { layout, expanded, request, collapsedDone, setInteractive } = useNotch()
  const [peek, setPeek] = useState(false)
  const wasExpanded = useRef(false)

  const W = layout.panelWidth
  const H = layout.panelHeight
  const nW = layout.notchWidth
  const nH = layout.notchHeight

  useEffect(() => {
    if (expanded) {
      wasExpanded.current = true
      setPeek(false)
    }
  }, [expanded])

  const target = expanded
    ? { width: W, height: H, r: 30 }
    : peek
      ? { width: nW + 190, height: nH + 60, r: 26 }
      : { width: nW, height: nH, r: layout.hasNotch ? 12 : 16 }

  const transition = expanded
    ? { type: 'spring', stiffness: 150, damping: 22, mass: 0.95 }
    : { type: 'spring', stiffness: 320, damping: 32 }

  return (
    <div className="pointer-events-none fixed inset-0 flex items-start justify-center">
      {!isDesktop && <WebDesktop />}
      <motion.div
        className="pointer-events-auto relative"
        initial={false}
        animate={{ width: target.width, height: target.height }}
        transition={transition}
        onAnimationComplete={() => {
          if (!expanded && wasExpanded.current) {
            wasExpanded.current = false
            collapsedDone()
          }
        }}
        onMouseEnter={() => {
          if (expanded) return
          setInteractive(true)
          setPeek(true)
        }}
        onMouseLeave={() => {
          if (expanded) return
          setPeek(false)
          setInteractive(false)
        }}
        onClick={() => !expanded && request('expand')}
        style={{ cursor: expanded ? 'default' : 'pointer' }}
      >
        <AnimatePresence>
          {!expanded && (
            <motion.div key="ears" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.05 } }}>
              <Ear side="left" size={10} />
              <Ear side="right" size={10} />
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          className="absolute inset-0 overflow-hidden bg-black"
          initial={false}
          animate={{
            borderBottomLeftRadius: target.r,
            borderBottomRightRadius: target.r,
            boxShadow: expanded
              ? '0 40px 90px -30px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.10)'
              : peek
                ? '0 18px 40px -16px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)'
                : '0 0 0 0 rgba(0,0,0,0)',
          }}
          transition={transition}
        >
          <AnimatePresence>
            {expanded && (
              <motion.div
                key="panel"
                className="absolute left-1/2 top-0"
                style={{ width: W, height: H, marginLeft: -W / 2, transformOrigin: '50% 0%' }}
                initial={{ opacity: 0, scale: 0.94, y: -30, filter: 'blur(16px)' }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', transition: { delay: 0.08, duration: 0.55, ease } }}
                exit={{ opacity: 0, scale: 0.96, y: -20, filter: 'blur(12px)', transition: { duration: 0.2, ease: 'easeIn' } }}
              >
                <Dashboard />
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>{!expanded && !peek && <PillIdle key="idle" />}</AnimatePresence>
          <AnimatePresence>{!expanded && peek && <Peek key="peek" />}</AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  )
}

/** Browser preview only: a fake desktop so the notch has something to sit on. */
function WebDesktop() {
  const { expanded, settings } = useNotch()
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_30%_20%,#3b2a20,transparent_60%),radial-gradient(ellipse_at_80%_70%,#1e2a44,transparent_55%),#0d0d10]">
      <AnimatePresence>
        {!expanded && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 top-1/2 text-center text-sm text-white/45"
          >
            Наведите на чёлку или нажмите{' '}
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-white/80">{prettyHotkey(settings.hotkey)}</kbd>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
