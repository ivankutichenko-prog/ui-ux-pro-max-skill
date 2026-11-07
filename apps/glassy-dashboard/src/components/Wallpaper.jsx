import { motion, useReducedMotion } from 'framer-motion'
import { useStore } from '../lib/store'
import { WALLPAPERS } from '../lib/constants'

// Soft light pools. Positions/sizes are relative to the panel.
const BLOBS = [
  { left: '-8%', top: '-18%', size: '62%', dx: 40, dy: 30, dur: 26 },
  { left: '52%', top: '-22%', size: '58%', dx: -50, dy: 40, dur: 31 },
  { left: '24%', top: '42%', size: '66%', dx: 60, dy: -30, dur: 34 },
  { left: '68%', top: '48%', size: '50%', dx: -40, dy: -40, dur: 28 },
  { left: '-12%', top: '58%', size: '48%', dx: 50, dy: -20, dur: 37 },
]

export default function Wallpaper() {
  const { wallpaper, customWallpaper, liveWallpaper } = useStore((s) => s.prefs)
  const reduce = useReducedMotion()
  const w = WALLPAPERS[wallpaper] ?? WALLPAPERS.lounge
  const live = liveWallpaper && !reduce

  if (wallpaper === 'custom' && customWallpaper) {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <motion.img
          src={customWallpaper}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ scale: 1.08 }}
          animate={{ scale: live ? [1.04, 1.1, 1.04] : 1.04 }}
          transition={live ? { duration: 40, repeat: Infinity, ease: 'easeInOut' } : { duration: 1.2 }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/35" />
        <div className="grain absolute inset-0" />
      </div>
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: w.base }}>
      {BLOBS.map((b, i) => (
        <motion.div
          key={`${wallpaper}-${i}`}
          className="absolute rounded-full"
          style={{
            left: b.left,
            top: b.top,
            width: b.size,
            aspectRatio: '1',
            background: `radial-gradient(circle at 50% 50%, ${w.blobs[i]} 0%, ${w.blobs[i]}aa 22%, transparent 66%)`,
            willChange: live ? 'transform' : undefined,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={
            live
              ? { opacity: 0.9, scale: [1, 1.12, 1], x: [0, b.dx, 0], y: [0, b.dy, 0] }
              : { opacity: 0.9, scale: 1 }
          }
          transition={
            live
              ? { opacity: { duration: 1.2 }, default: { duration: b.dur, repeat: Infinity, ease: 'easeInOut' } }
              : { duration: 1.2 }
          }
        />
      ))}
      {/* Window light + a soft horizon, so the glass has structure to refract. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(115deg, rgba(255,255,255,0.10) 0%, transparent 28%), linear-gradient(180deg, transparent 62%, rgba(0,0,0,0.18) 63%, rgba(0,0,0,0.35) 100%)',
        }}
      />
      <div
        className="absolute"
        style={{
          left: '18%',
          right: '18%',
          bottom: '9%',
          height: '9%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.14), transparent 70%)',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.45)_100%)]" />
      <div className="grain absolute inset-0" />
    </div>
  )
}
