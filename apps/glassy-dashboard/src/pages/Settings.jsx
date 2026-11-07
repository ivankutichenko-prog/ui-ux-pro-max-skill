import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, ImagePlus, Keyboard, LogOut, Power, RotateCcw, Trash2, Upload } from 'lucide-react'
import { useStore } from '../lib/store'
import { eventToAccelerator, isDesktop, prettyHotkey, useNotch } from '../lib/notch'
import { Button, Card, Field, Modal, PageHeader, Tabs, Toggle, cx, inputCls, stagger } from '../components/ui'
import { CURRENCIES } from '../lib/format'
import { WALLPAPERS } from '../lib/constants'

function Section({ title, desc, children, className }) {
  return (
    <Card hover={false} className={cx('p-5', className)}>
      <h3 className="text-sm font-semibold">{title}</h3>
      {desc && <p className="mt-0.5 text-xs text-white/45">{desc}</p>}
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </Card>
  )
}

function Row({ title, desc, children }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="min-w-0">
        <p className="text-[13px]">{title}</p>
        {desc && <p className="mt-0.5 text-[11px] leading-snug text-white/45">{desc}</p>}
      </div>
      {children}
    </div>
  )
}

function HotkeyRecorder() {
  const { settings, setHotkey, suspendHotkey } = useNotch()
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState(null)
  const toast = useStore((s) => s.toast)

  useEffect(() => {
    if (!recording) return
    suspendHotkey(true)
    const onKey = async (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.key === 'Escape') return setRecording(false)
      const accel = eventToAccelerator(e)
      if (!accel) return // only modifiers so far, or a plain letter
      setRecording(false)
      const res = await setHotkey(accel)
      if (res.ok) {
        setError(null)
        toast(`Новая клавиша: ${prettyHotkey(accel)}`, 'success')
      } else setError(res.error)
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      suspendHotkey(false)
    }
  }, [recording]) // eslint-disable-line react-hooks/exhaustive-deps

  const current = settings.activeHotkey || settings.hotkey
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <motion.div
          animate={recording ? { boxShadow: ['0 0 0 0 rgba(96,165,250,0.6)', '0 0 0 8px rgba(96,165,250,0)'] } : { boxShadow: '0 0 0 0 rgba(0,0,0,0)' }}
          transition={recording ? { duration: 1.2, repeat: Infinity } : {}}
          className={cx('flex h-12 min-w-[140px] items-center justify-center rounded-xl px-4 font-display text-xl ring-1', recording ? 'bg-blue-500/20 ring-blue-300/60' : 'bg-white/10 ring-white/15')}
        >
          <AnimatePresence mode="wait">
            <motion.span key={recording ? 'rec' : current} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={recording ? 'text-sm font-sans text-blue-200' : ''}>
              {recording ? 'Нажмите клавишу…' : prettyHotkey(current)}
            </motion.span>
          </AnimatePresence>
        </motion.div>
        <Button variant="glass" icon={Keyboard} onClick={() => setRecording((r) => !r)}>
          {recording ? 'Отмена' : 'Изменить'}
        </Button>
        {current !== 'F8' && (
          <Button variant="ghost" size="sm" onClick={() => setHotkey('F8')}>
            Сбросить на F8
          </Button>
        )}
      </div>
      {(error || settings.hotkeyError) && <p className="text-[11px] text-amber-300">{error || settings.hotkeyError}</p>}
      <p className="text-[11px] leading-relaxed text-white/45">
        Подойдёт одна функциональная клавиша (F1–F24, Insert, Home, Pause…) или сочетание с модификатором (например {settings.platform === 'darwin' ? '⌥ Пробел' : 'Alt + Пробел'}).
        {settings.platform === 'darwin' && ' На MacBook F-клавиши по умолчанию управляют яркостью и звуком — нажимайте их вместе с fn или включите «Использовать F1, F2 и т.д. как стандартные функциональные клавиши» в настройках клавиатуры.'}
      </p>
    </div>
  )
}

async function downscale(file, maxW = 2400) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = url
    })
    const k = Math.min(1, maxW / img.width)
    const c = document.createElement('canvas')
    c.width = Math.round(img.width * k)
    c.height = Math.round(img.height * k)
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
    return c.toDataURL('image/jpeg', 0.85)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export default function Settings() {
  const store = useStore()
  const { prefs, setPrefs, toast } = store
  const { settings, updateSettings, quit } = useNotch()
  const [confirm, setConfirm] = useState(null)
  const wallInput = useRef(null)
  const importInput = useRef(null)

  const onWallpaper = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const data = await downscale(file)
      setPrefs({ wallpaper: 'custom', customWallpaper: data })
      toast('Фон обновлён', 'success')
    } catch {
      toast('Не удалось открыть изображение', 'error')
    }
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(store.exportData(), null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `glassy-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    toast('Резервная копия сохранена', 'success')
  }

  const importJson = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      store.importData(JSON.parse(await file.text()))
      toast('Данные восстановлены', 'success')
    } catch (err) {
      toast(err.message || 'Файл повреждён', 'error')
    }
  }

  return (
    <>
      <PageHeader title="Настройки" subtitle={`Glassy Dashboard ${settings.version && settings.version !== 'web' ? 'v' + settings.version : ''}`} />

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-3.5">
        <Section title="Чёлка и горячая клавиша" desc="Панель живёт в чёлке вверху экрана и раскрывается по одной клавише" className="col-span-2">
          <HotkeyRecorder />
          <div className="h-px bg-white/8" />
          <Row title="Показывать чёлку, когда панель свёрнута" desc="Наведите на неё, чтобы увидеть ближайшую встречу, кликните — чтобы открыть">
            <Toggle checked={settings.alwaysShowNotch} onChange={(v) => updateSettings({ alwaysShowNotch: v })} label="Показывать чёлку" />
          </Row>
          <Row title="Закрепить панель" desc="Не сворачивать при клике в другое окно">
            <Toggle checked={settings.pinned} onChange={(v) => updateSettings({ pinned: v })} label="Закрепить" />
          </Row>
          <Row title="Запускать при входе в систему" desc="Чёлка будет всегда под рукой после включения компьютера">
            <Toggle checked={settings.openAtLogin} onChange={(v) => updateSettings({ openAtLogin: v })} label="Автозапуск" />
          </Row>
        </Section>

        <Section title="Профиль">
          <Field label="Ваше имя">
            <input className={inputCls} value={prefs.userName} onChange={(e) => setPrefs({ userName: e.target.value })} />
          </Field>
          <Field label="Компания">
            <input className={inputCls} value={prefs.workspace} onChange={(e) => setPrefs({ workspace: e.target.value })} />
          </Field>
          <Field label="Подпись под названием">
            <input className={inputCls} value={prefs.plan} onChange={(e) => setPrefs({ plan: e.target.value })} />
          </Field>
          <Row title="Валюта">
            <Tabs size="sm" value={prefs.currency} onChange={(currency) => setPrefs({ currency })} tabs={Object.values(CURRENCIES).map((c) => ({ value: c.code, label: c.label }))} />
          </Row>
        </Section>

        <Section title="Оформление" desc="Фон за стеклом и сила эффекта">
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(WALLPAPERS).map(([k, w]) => (
              <motion.button
                key={k}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPrefs({ wallpaper: k })}
                className={cx('relative h-16 overflow-hidden rounded-xl ring-2 transition-all', prefs.wallpaper === k ? 'ring-white' : 'ring-white/10')}
                style={{
                  background: `radial-gradient(circle at 20% 20%, ${w.blobs[0]}, transparent 60%), radial-gradient(circle at 80% 30%, ${w.blobs[1]}, transparent 55%), radial-gradient(circle at 50% 90%, ${w.blobs[2]}, transparent 60%), ${w.base}`,
                }}
              >
                <span className="absolute bottom-1 left-2 text-[10px] font-medium drop-shadow">{w.label}</span>
              </motion.button>
            ))}
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => wallInput.current?.click()}
              className={cx(
                'relative flex h-16 flex-col items-center justify-center gap-1 overflow-hidden rounded-xl bg-white/8 text-[10px] ring-2',
                prefs.wallpaper === 'custom' ? 'ring-white' : 'ring-white/10',
              )}
              style={prefs.customWallpaper ? { backgroundImage: `url(${prefs.customWallpaper})`, backgroundSize: 'cover' } : undefined}
            >
              <ImagePlus size={16} className="drop-shadow" />
              <span className="drop-shadow">Своё фото</span>
            </motion.button>
            <input ref={wallInput} type="file" accept="image/*" hidden onChange={onWallpaper} />
          </div>
          <Row title="Живой фон" desc="Плавное движение света за стеклом">
            <Toggle checked={prefs.liveWallpaper} onChange={(v) => setPrefs({ liveWallpaper: v })} label="Живой фон" />
          </Row>
          <Field label={`Размытие стекла: ${prefs.glassBlur}px`}>
            <input type="range" min="8" max="60" value={prefs.glassBlur} onChange={(e) => setPrefs({ glassBlur: Number(e.target.value) })} className="accent-blue-500" />
          </Field>
          <Field label={`Плотность стекла: ${prefs.glassTint}%`}>
            <input type="range" min="2" max="30" value={prefs.glassTint} onChange={(e) => setPrefs({ glassTint: Number(e.target.value) })} className="accent-blue-500" />
          </Field>
        </Section>

        <Section title="Данные" desc="Всё хранится только на этом компьютере. Чтобы перенести данные на другое устройство — сохраните резервную копию и восстановите её там." className="col-span-2">
          <div className="flex flex-wrap gap-2">
            <Button variant="glass" icon={Download} onClick={exportJson}>
              Сохранить резервную копию
            </Button>
            <Button variant="glass" icon={Upload} onClick={() => importInput.current?.click()}>
              Восстановить из файла
            </Button>
            <input ref={importInput} type="file" accept="application/json,.json" hidden onChange={importJson} />
            <Button variant="glass" icon={RotateCcw} onClick={() => setConfirm('demo')}>
              Вернуть демо-данные
            </Button>
            <Button variant="danger" icon={Trash2} onClick={() => setConfirm('clear')}>
              Начать с чистого листа
            </Button>
          </div>
        </Section>

        {isDesktop && (
          <Section title="Приложение" className="col-span-2">
            <Row title="Выйти из Glassy Dashboard" desc="Чёлка и горячая клавиша перестанут работать до следующего запуска">
              <Button variant="danger" icon={Power} onClick={quit}>
                Выйти
              </Button>
            </Row>
          </Section>
        )}
      </motion.div>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm === 'clear' ? 'Удалить все данные?' : 'Загрузить демо-данные?'}
        subtitle={confirm === 'clear' ? 'Лиды, сделки, контакты, задачи и события будут удалены. Сначала можно сохранить резервную копию.' : 'Текущие данные будут заменены примером.'}
        width={420}
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirm(null)}>
            Отмена
          </Button>
          <Button
            variant={confirm === 'clear' ? 'danger' : 'primary'}
            icon={confirm === 'clear' ? LogOut : RotateCcw}
            onClick={() => {
              if (confirm === 'clear') store.clearAll()
              else store.resetDemo()
              toast(confirm === 'clear' ? 'Все данные удалены — можно начинать' : 'Демо-данные загружены', 'success')
              setConfirm(null)
            }}
          >
            {confirm === 'clear' ? 'Удалить всё' : 'Загрузить'}
          </Button>
        </div>
      </Modal>
    </>
  )
}
