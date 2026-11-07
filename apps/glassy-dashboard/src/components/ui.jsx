import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, animate, motion, useInView, useReducedMotion } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight, X } from 'lucide-react'
import { initials } from '../lib/format'

export const spring = { type: 'spring', stiffness: 380, damping: 32 }
export const softSpring = { type: 'spring', stiffness: 220, damping: 26 }
export const ease = [0.22, 1, 0.36, 1]

const cx = (...c) => c.filter(Boolean).join(' ')
export { cx }

/** Staggered fade/raise for grid children. */
export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
}
export const rise = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease } },
}

export function Card({ className, children, hover = true, inset = true, as = 'div', ...rest }) {
  const Comp = motion[as]
  return (
    <Comp
      variants={rise}
      whileHover={hover ? { y: -3, transition: { duration: 0.25, ease } } : undefined}
      className={cx(inset ? 'glass-inset' : 'glass', 'rounded-2xl', className)}
      {...rest}
    >
      {children}
    </Comp>
  )
}

export function Button({ variant = 'primary', size = 'md', className, children, icon: Icon, ...rest }) {
  const styles = {
    primary:
      'bg-gradient-to-b from-[#4f8dff] to-[#2563eb] text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.8),inset_0_1px_0_rgba(255,255,255,0.35)] hover:brightness-110',
    glass: 'glass-input text-white/90 hover:text-white',
    ghost: 'text-white/70 hover:text-white hover:bg-white/8',
    danger: 'bg-red-500/20 text-red-200 border border-red-400/30 hover:bg-red-500/30',
  }
  const sizes = { sm: 'h-8 px-3 text-xs gap-1.5', md: 'h-9 px-4 text-[13px] gap-2', lg: 'h-11 px-5 text-sm gap-2' }
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={spring}
      className={cx('inline-flex items-center justify-center rounded-full font-medium transition-[filter,background,color] disabled:opacity-40 disabled:pointer-events-none', styles[variant], sizes[size], className)}
      {...rest}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2} />}
      {children}
    </motion.button>
  )
}

export function IconButton({ icon: Icon, label, className, active, size = 34, ...rest }) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.9 }}
      transition={spring}
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-white/10 transition-colors',
        active ? 'bg-white/25 text-white' : 'bg-white/8 text-white/75 hover:bg-white/15 hover:text-white',
        className,
      )}
      style={{ width: size, height: size }}
      {...rest}
    >
      <Icon size={Math.round(size * 0.47)} strokeWidth={2} />
    </motion.button>
  )
}

export function Change({ value, className }) {
  const up = value >= 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={cx(
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular',
        up ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-300',
        className,
      )}
    >
      <Icon size={12} strokeWidth={2.5} />
      {Math.abs(value).toFixed(Math.abs(value) < 10 ? 1 : 0).replace('.', ',')}%
    </span>
  )
}

export function Chip({ color = '#94a3b8', children, className, onClick }) {
  const Comp = onClick ? motion.button : motion.span
  return (
    <Comp
      layout
      onClick={onClick}
      whileTap={onClick ? { scale: 0.92 } : undefined}
      className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium', className)}
      style={{ background: `${color}26`, color, boxShadow: `inset 0 0 0 1px ${color}40` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {children}
    </Comp>
  )
}

export function Avatar({ name, color = '#a78bfa', size = 28, className }) {
  return (
    <span
      className={cx('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white', className)}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9, size * 0.36),
        background: `linear-gradient(140deg, ${color}, ${color}99)`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 4px 12px -4px ${color}`,
      }}
    >
      {initials(name)}
    </span>
  )
}

/** Animated number that counts up when it scrolls into view and tweens on change. */
export function CountUp({ value, format = (v) => Math.round(v).toLocaleString('ru-RU'), duration = 1.2, className }) {
  const ref = useRef(null)
  const prev = useRef(0)
  const inView = useInView(ref, { once: true })
  const reduce = useReducedMotion()
  useEffect(() => {
    if (!ref.current || !inView) return
    if (reduce) {
      ref.current.textContent = format(value)
      prev.current = value
      return
    }
    const controls = animate(prev.current, value, {
      duration,
      ease,
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = format(v)
      },
    })
    prev.current = value
    return () => controls.stop()
  }, [value, inView]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <span ref={ref} className={cx('tabular', className)}>
      {format(0)}
    </span>
  )
}

/** Segmented tabs with a sliding glass pill. */
export function Tabs({ tabs, value, onChange, size = 'md', className }) {
  const id = useId()
  return (
    <div className={cx('inline-flex items-center gap-0.5 rounded-full bg-black/15 p-1 ring-1 ring-white/8', className)}>
      {tabs.map((t) => {
        const active = t.value === value
        return (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            className={cx(
              'relative whitespace-nowrap rounded-full font-medium transition-colors',
              size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-xs',
              active ? 'text-white' : 'text-white/55 hover:text-white/85',
            )}
          >
            {active && (
              <motion.span
                layoutId={`tab-pill-${id}`}
                className="absolute inset-0 rounded-full bg-white/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_12px_-4px_rgba(0,0,0,0.4)]"
                transition={spring}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {t.label}
              {t.count != null && <span className="tabular text-white/45">{t.count}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors duration-300',
        checked ? 'bg-emerald-400/80 shadow-[0_0_16px_-2px_rgba(52,211,153,0.7)]' : 'bg-white/15',
      )}
    >
      <motion.span
        layout
        transition={spring}
        className="block h-5 w-5 rounded-full bg-white shadow-md"
        style={{ marginLeft: checked ? 20 : 0 }}
      />
    </button>
  )
}

export function Field({ label, children, hint }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-white/50">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-white/40">{hint}</span>}
    </label>
  )
}

export const inputCls = 'glass-input h-10 w-full rounded-xl px-3 text-sm text-white placeholder:text-white/35'

export function Modal({ open, onClose, title, subtitle, children, width = 460 }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, onClose])

  const root = document.getElementById('modal-root')
  if (!root) return null
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/35 backdrop-blur-[6px]"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="glass-dark relative rounded-3xl p-6 shadow-2xl"
            style={{ width }}
            initial={{ opacity: 0, scale: 0.92, y: 20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, y: 10, filter: 'blur(6px)' }}
            transition={softSpring}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl">{title}</h3>
                {subtitle && <p className="mt-1 text-xs text-white/50">{subtitle}</p>}
              </div>
              <IconButton icon={X} label="Закрыть" onClick={onClose} size={30} />
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    root,
  )
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease }}>
        <h1 className="font-display text-[30px] leading-tight tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs text-white/50">{subtitle}</p>}
      </motion.div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

export function Empty({ icon: Icon, title, text, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center gap-2 py-14 text-center"
    >
      {Icon && (
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/8 ring-1 ring-white/10">
          <Icon size={22} className="text-white/60" />
        </div>
      )}
      <p className="text-sm font-medium text-white/80">{title}</p>
      {text && <p className="max-w-xs text-xs text-white/45">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  )
}

export function KpiCard({ icon: Icon, label, value, format, change, accent = '#fff', children }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10" style={{ color: accent }}>
          <Icon size={15} strokeWidth={2} />
        </div>
        {children}
      </div>
      <p className="mt-3 text-[11px] text-white/55">{label}</p>
      <div className="mt-0.5 flex items-baseline gap-2">
        <CountUp value={value} format={format} className="font-display text-[26px] leading-none" />
      </div>
      {change != null && <Change value={change} className="mt-2" />}
    </Card>
  )
}
