import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Building2, ChevronUp, Handshake, Pin, PinOff, Search, Target, Users } from 'lucide-react'
import { useStore } from '../lib/store'
import { useNotch, prettyHotkey } from '../lib/notch'
import { IconButton, cx } from './ui'
import { MONTHS_GEN } from '../lib/format'

const IS_MAC = /Mac/.test(navigator.platform)
const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(t)
  }, [])
  return now
}

function GlobalSearch() {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)
  const { leads, contacts, deals, companies, setPage } = useStore()

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return []
    const m = (...f) => f.some((x) => (x || '').toLowerCase().includes(s))
    return [
      ...leads.filter((l) => m(l.name, l.company)).map((l) => ({ id: l.id, icon: Target, title: l.name, sub: `Лид · ${l.company}`, page: 'leads' })),
      ...deals.filter((d) => m(d.title, d.company)).map((d) => ({ id: d.id, icon: Handshake, title: d.title, sub: `Сделка · ${d.company}`, page: 'deals' })),
      ...contacts.filter((c) => m(c.name, c.company, c.email)).map((c) => ({ id: c.id, icon: Users, title: c.name, sub: `Контакт · ${c.company}`, page: 'contacts' })),
      ...companies.filter((c) => m(c.name, c.industry)).map((c) => ({ id: c.id, icon: Building2, title: c.name, sub: `Компания · ${c.industry}`, page: 'companies' })),
    ].slice(0, 7)
  }, [q, leads, contacts, deals, companies])

  return (
    <div className="relative">
      <div className="glass-input flex h-8 w-60 items-center gap-2 rounded-full px-3">
        <Search size={14} className="text-white/50" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => e.key === 'Escape' && (e.stopPropagation(), setQ(''), e.currentTarget.blur())}
          placeholder="Поиск по CRM…"
          className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/40"
        />
        <kbd className="whitespace-nowrap rounded bg-white/10 px-1.5 font-sans text-[10px] text-white/45">{IS_MAC ? '⌘K' : 'Ctrl K'}</kbd>
      </div>
      <AnimatePresence>
        {open && q && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="glass-dark absolute right-0 top-10 z-40 w-80 overflow-hidden rounded-2xl p-1.5 shadow-2xl"
          >
            {results.length === 0 && <p className="px-3 py-4 text-center text-xs text-white/50">Ничего не найдено</p>}
            {results.map((r, i) => (
              <motion.button
                key={r.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.025 }}
                onMouseDown={() => {
                  setPage(r.page)
                  setQ('')
                }}
                className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-white/10"
              >
                <r.icon size={15} className="text-white/60" />
                <span className="min-w-0">
                  <span className="block truncate text-[13px]">{r.title}</span>
                  <span className="block truncate text-[11px] text-white/45">{r.sub}</span>
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function TopStrip() {
  const { layout, settings, request, updateSettings } = useNotch()
  const now = useClock()
  const pinned = settings.pinned
  const hotkey = prettyHotkey(settings.activeHotkey || settings.hotkey)
  const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="relative flex shrink-0 items-center" style={{ height: Math.max(layout.notchHeight, 32) + 14 }}>
      {/* Left of the notch */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-1 items-center gap-3 pl-2"
      >
        <span className="relative flex h-6 w-6 items-center justify-center">
          <span className="absolute inset-0 rounded-[8px] bg-gradient-to-br from-white/80 to-white/30 shadow-[0_0_14px_rgba(255,255,255,0.35)]" />
          <span className="relative h-2 w-3 rounded-b-full bg-black/80" />
        </span>
        <span className="font-display text-[15px]">Glassy</span>
        <span className="text-xs text-white/50">
          {WEEKDAYS[now.getDay()].replace(/^./, (c) => c.toUpperCase())}, {now.getDate()} {MONTHS_GEN[now.getMonth()]} · <span className="tabular">{time}</span>
        </span>
      </motion.div>

      {/* Keep clear of the hardware notch */}
      <div style={{ width: layout.notchWidth + 48 }} className="shrink-0" />

      {/* Right of the notch */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex flex-1 items-center justify-end gap-2 pr-1"
      >
        <GlobalSearch />
        <span className="hidden items-center gap-1.5 rounded-full bg-white/8 px-2.5 py-1 text-[11px] text-white/55 ring-1 ring-white/10 xl:flex">
          <kbd className="rounded bg-white/15 px-1.5 font-sans text-[10px] text-white/85">{hotkey}</kbd>
          скрыть
        </span>
        <IconButton
          icon={pinned ? Pin : PinOff}
          active={pinned}
          size={30}
          label={pinned ? 'Открепить: панель скрывается при клике вне' : 'Закрепить: не скрывать при клике вне'}
          onClick={() => updateSettings({ pinned: !pinned })}
        />
        <IconButton icon={ChevronUp} size={30} label="Свернуть в чёлку" onClick={() => request('collapse')} className={cx('bg-white/12')} />
      </motion.div>
    </div>
  )
}
