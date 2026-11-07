import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cx, ease } from './ui'

function useSize() {
  const ref = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize((s) => (s.width === width && s.height === height ? s : { width, height }))
    })
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, size]
}

/** Monotone cubic interpolation (no overshoot) → SVG path. */
function monotonePath(pts) {
  const n = pts.length
  if (n < 2) return n ? `M${pts[0].x},${pts[0].y}` : ''
  const dx = []
  const m = []
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1].x - pts[i].x
    m[i] = (pts[i + 1].y - pts[i].y) / (dx[i] || 1)
  }
  const t = [m[0]]
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2
  t[n - 1] = m[n - 2]
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0
      t[i + 1] = 0
      continue
    }
    const a = t[i] / m[i]
    const b = t[i + 1] / m[i]
    const s = a * a + b * b
    if (s > 9) {
      const k = 3 / Math.sqrt(s)
      t[i] = k * a * m[i]
      t[i + 1] = k * b * m[i]
    }
  }
  let d = `M${pts[0].x},${pts[0].y}`
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3
    d += ` C${pts[i].x + h},${pts[i].y + t[i] * h} ${pts[i + 1].x - h},${pts[i + 1].y - t[i + 1] * h} ${pts[i + 1].x},${pts[i + 1].y}`
  }
  return d
}

/**
 * Smooth area/line chart with a drawing animation, gradient fill,
 * glowing end point and a hover crosshair + tooltip.
 */
export function AreaChart({
  data,
  height = 160,
  color = '#ffffff',
  fill = true,
  format = (v) => v,
  labels,
  axisLabels,
  showGrid = false,
  strokeWidth = 2.4,
  padTop = 14,
  padBottom = 6,
  className,
}) {
  const [ref, { width }] = useSize()
  const [hover, setHover] = useState(null)
  const id = useId().replace(/:/g, '')
  const reduce = useReducedMotion()

  const { pts, line, area } = useMemo(() => {
    if (!width || !data.length) return { pts: [], line: '', area: '' }
    const max = Math.max(...data, 1)
    const min = Math.min(...data, 0)
    const span = max - min || 1
    const h = height - padTop - padBottom
    const step = data.length > 1 ? width / (data.length - 1) : 0
    const pts = data.map((v, i) => ({ x: i * step, y: padTop + h - ((v - min) / span) * h, v }))
    const line = monotonePath(pts)
    const area = `${line} L${width},${height} L0,${height} Z`
    return { pts, line, area }
  }, [data, width, height, padTop, padBottom])

  const last = pts[pts.length - 1]
  const key = `${data.length}-${width > 0}`

  const onMove = (e) => {
    if (!pts.length) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const i = Math.round((x / rect.width) * (pts.length - 1))
    setHover(Math.max(0, Math.min(pts.length - 1, i)))
  }

  const hp = hover != null ? pts[hover] : null

  return (
    <div ref={ref} className={cx('relative w-full', className)} style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} className="absolute inset-0 overflow-visible">
          <defs>
            <linearGradient id={`fill-${id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
            <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>
          {showGrid &&
            [0.25, 0.5, 0.75].map((g) => (
              <line key={g} x1="0" x2={width} y1={height * g} y2={height * g} stroke="white" strokeOpacity="0.07" strokeDasharray="3 5" />
            ))}
          {fill && (
            <motion.path
              key={`a-${key}`}
              d={area}
              fill={`url(#fill-${id})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, d: area }}
              transition={{ opacity: { duration: 1, delay: reduce ? 0 : 0.5 }, d: { duration: 0.6, ease } }}
            />
          )}
          <motion.path
            key={`glow-${key}`}
            d={line}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth * 3}
            strokeOpacity="0.25"
            filter={`url(#glow-${id})`}
            initial={{ pathLength: reduce ? 1 : 0 }}
            animate={{ pathLength: 1, d: line }}
            transition={{ pathLength: { duration: 1.4, ease }, d: { duration: 0.6, ease } }}
          />
          <motion.path
            key={`l-${key}`}
            d={line}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={{ pathLength: reduce ? 1 : 0 }}
            animate={{ pathLength: 1, d: line }}
            transition={{ pathLength: { duration: 1.4, ease }, d: { duration: 0.6, ease } }}
          />
          {last && (
            <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: reduce ? 0 : 1.3, type: 'spring', stiffness: 400, damping: 18 }} style={{ originX: `${last.x}px`, originY: `${last.y}px` }}>
              <circle cx={last.x} cy={last.y} r="9" fill={color} opacity="0.18">
                {!reduce && <animate attributeName="r" values="6;12;6" dur="2.4s" repeatCount="indefinite" />}
              </circle>
              <circle cx={last.x} cy={last.y} r="4.5" fill={color} stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
            </motion.g>
          )}
          {hp && (
            <g pointerEvents="none">
              <line x1={hp.x} x2={hp.x} y1={0} y2={height} stroke="white" strokeOpacity="0.25" strokeDasharray="3 4" />
              <circle cx={hp.x} cy={hp.y} r="5" fill={color} stroke="white" strokeWidth="2" />
            </g>
          )}
          <rect width={width} height={height} fill="transparent" onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
        </svg>
      )}
      <AnimatePresence>
        {hp && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0, left: Math.min(Math.max(hp.x, 50), width - 50) }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="glass-dark pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg px-2.5 py-1.5 text-center"
            style={{ top: Math.max(hp.y - 54, -8) }}
          >
            <div className="text-xs font-semibold tabular">{format(hp.v)}</div>
            {labels && <div className="text-[10px] text-white/55">{labels[hover]}</div>}
          </motion.div>
        )}
      </AnimatePresence>
      {axisLabels && (
        <div className="absolute -bottom-5 left-0 right-0 flex justify-between text-[10px] text-white/40">
          {axisLabels.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Rounded "pill" bars that spring up from the baseline — like the contacts widget.
 * The last bar can be rendered striped to mark the in-progress period.
 */
export function PillBars({ data, labels, height = 120, color = '#ffffff', stripedLast = true, format = (v) => v, gap = 8, className }) {
  const max = Math.max(...data, 1)
  const [hover, setHover] = useState(null)
  const reduce = useReducedMotion()
  return (
    <div className={cx('w-full', className)}>
      <div className="flex items-end" style={{ height, gap }}>
        {data.map((v, i) => {
          const isLast = stripedLast && i === data.length - 1
          return (
            <div
              key={i}
              className="relative flex h-full flex-1 items-end justify-center"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <motion.div
                className={cx('w-full max-w-[26px] rounded-full', isLast && 'striped')}
                style={{
                  background: isLast ? undefined : `linear-gradient(180deg, ${color}, ${color}d0)`,
                  boxShadow: `0 6px 18px -6px ${color}aa, inset 0 1px 0 rgba(255,255,255,0.6)`,
                  opacity: hover == null || hover === i ? 1 : 0.55,
                }}
                initial={{ height: reduce ? `${(v / max) * 100}%` : 6 }}
                animate={{ height: `${Math.max(6, (v / max) * 100)}%` }}
                transition={{ type: 'spring', stiffness: 140, damping: 16, delay: reduce ? 0 : 0.15 + i * 0.07 }}
              />
              <AnimatePresence>
                {hover === i && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="glass-dark pointer-events-none absolute z-10 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-semibold tabular"
                    style={{ bottom: `calc(${Math.max(6, (v / max) * 100)}% + 6px)` }}
                  >
                    {format(v)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
      {labels && (
        <div className="mt-2 flex text-[10px] text-white/55" style={{ gap }}>
          {labels.map((l, i) => (
            <span key={i} className="flex-1 text-center">
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/** Vertical column chart with gradient columns and value labels on hover. */
export function Columns({ data, labels, height = 180, colors = ['#93c5fd', '#3b82f6'], format = (v) => v, highlightLast = true }) {
  const max = Math.max(...data, 1)
  const [hover, setHover] = useState(null)
  return (
    <div className="w-full">
      <div className="relative flex items-end gap-2" style={{ height }}>
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <div key={g} className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-white/[0.07]" style={{ bottom: `${g * 100}%` }} />
        ))}
        {data.map((v, i) => {
          const hi = highlightLast && i === data.length - 1
          return (
            <div key={i} className="relative flex h-full flex-1 items-end" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <motion.div
                className="w-full rounded-t-lg rounded-b-sm"
                style={{
                  background: hi ? `linear-gradient(180deg, #fde68a, #f59e0b)` : `linear-gradient(180deg, ${colors[0]}, ${colors[1]})`,
                  opacity: hover == null || hover === i ? 0.95 : 0.5,
                  boxShadow: hi ? '0 0 24px -4px rgba(245,158,11,0.7)' : 'inset 0 1px 0 rgba(255,255,255,0.45)',
                }}
                initial={{ height: 0 }}
                animate={{ height: `${(v / max) * 100}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.1 + i * 0.04 }}
              />
              {hover === i && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-dark pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-semibold tabular"
                  style={{ bottom: `calc(${(v / max) * 100}% + 6px)` }}
                >
                  {format(v)}
                </motion.div>
              )}
            </div>
          )
        })}
      </div>
      {labels && (
        <div className="mt-2 flex gap-2 text-[10px] text-white/45">
          {labels.map((l, i) => (
            <span key={i} className="flex-1 text-center">
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/** Animated donut with segments drawing in sequence. */
export function Donut({ segments, size = 168, thickness = 18, center }) {
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const [hover, setHover] = useState(null)
  let offset = 0
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const len = (s.value / total) * c
          const gapLen = segments.length > 1 ? Math.min(4, len / 3) : 0
          const dash = Math.max(0, len - gapLen)
          const el = (
            <motion.circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={hover === i ? thickness + 4 : thickness}
              strokeLinecap="round"
              strokeDashoffset={-offset}
              initial={{ strokeDasharray: `0 ${c}` }}
              animate={{ strokeDasharray: `${dash} ${c}` }}
              transition={{ duration: 0.9, delay: 0.2 + i * 0.12, ease }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ filter: hover === i ? `drop-shadow(0 0 8px ${s.color})` : undefined, transition: 'stroke-width .2s' }}
            />
          )
          offset += len
          return el
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={hover ?? 'center'}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.18 }}
          >
            {hover != null ? (
              <>
                <div className="font-display text-2xl tabular">{Math.round((segments[hover].value / total) * 100)}%</div>
                <div className="text-[11px] text-white/55">{segments[hover].label}</div>
              </>
            ) : (
              center
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

/** Thin horizontal progress with an animated fill. */
export function Bar({ value, max = 100, color = '#fff', height = 4, delay = 0, className }) {
  return (
    <div className={cx('w-full overflow-hidden rounded-full bg-white/10', className)} style={{ height }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${color}aa, ${color})`, boxShadow: `0 0 10px ${color}66` }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, (value / (max || 1)) * 100)}%` }}
        transition={{ duration: 0.9, delay, ease }}
      />
    </div>
  )
}

export function Sparkline({ data, color = '#fff', height = 34, width = 90 }) {
  return (
    <div style={{ width }}>
      <AreaChart data={data} height={height} color={color} strokeWidth={1.8} padTop={4} padBottom={4} />
    </div>
  )
}
