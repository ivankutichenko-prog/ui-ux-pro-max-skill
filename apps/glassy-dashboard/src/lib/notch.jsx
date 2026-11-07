import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/** True inside the packaged Electron app (the preload exposes window.notch). */
export const isDesktop = typeof window !== 'undefined' && !!window.notch?.isDesktop
const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()

// Browser preview: there is no real notch, so emulate one in the viewport.
function webLayout() {
  const w = window.innerWidth
  const h = window.innerHeight
  return {
    panelWidth: Math.min(1480, w - 32),
    panelHeight: Math.min(940, h - 24),
    notchWidth: 190,
    notchHeight: 32,
    hasNotch: false,
    platform: 'web',
  }
}

const WEB_SETTINGS = {
  hotkey: 'F8',
  activeHotkey: 'F8',
  hotkeyError: null,
  alwaysShowNotch: true,
  pinned: false,
  openAtLogin: false,
  platform: 'web',
  version: 'web',
}

const NotchContext = createContext(null)

export function NotchProvider({ children }) {
  const [layout, setLayout] = useState(() => (isDesktop ? webLayout() : webLayout()))
  const [state, setState] = useState(() => (!isDesktop && params.has('expanded') ? 'expanded' : 'collapsed'))
  const [settings, setSettings] = useState(WEB_SETTINGS)

  useEffect(() => {
    if (isDesktop) {
      const api = window.notch
      api.getLayout().then((l) => l && setLayout(l))
      api.getState().then((s) => s && setState(s))
      api.getSettings().then((s) => s && setSettings(s))
      const offs = [api.onLayout(setLayout), api.onState(setState), api.onSettings(setSettings)]
      return () => offs.forEach((off) => off())
    }
    const onResize = () => setLayout(webLayout())
    const onKey = (e) => {
      if (e.key === 'F8') {
        e.preventDefault()
        setState((s) => (s === 'expanded' ? 'collapsed' : 'expanded'))
      }
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const request = useCallback((action) => {
    if (isDesktop) return window.notch.request(action)
    setState((s) => {
      if (action === 'expand') return 'expanded'
      if (action === 'collapse') return 'collapsed'
      return s === 'expanded' ? 'collapsed' : 'expanded'
    })
  }, [])

  const updateSettings = useCallback(async (patch) => {
    if (isDesktop) {
      const next = await window.notch.updateSettings(patch)
      setSettings(next)
      return next
    }
    setSettings((s) => ({ ...s, ...patch }))
  }, [])

  const setHotkey = useCallback(async (accelerator) => {
    if (isDesktop) {
      const res = await window.notch.setHotkey(accelerator)
      if (res.ok) setSettings(res.settings)
      return res
    }
    setSettings((s) => ({ ...s, hotkey: accelerator, activeHotkey: accelerator }))
    return { ok: true }
  }, [])

  const value = useMemo(
    () => ({
      layout,
      state,
      expanded: state === 'expanded',
      settings,
      request,
      updateSettings,
      setHotkey,
      collapsedDone: () => isDesktop && window.notch.collapsedDone(),
      setInteractive: (v) => isDesktop && window.notch.setInteractive(v),
      suspendHotkey: (v) => isDesktop && window.notch.suspendHotkey(v),
      quit: () => isDesktop && window.notch.quit(),
    }),
    [layout, state, settings, request, updateSettings, setHotkey],
  )

  return <NotchContext.Provider value={value}>{children}</NotchContext.Provider>
}

export const useNotch = () => useContext(NotchContext)

/** Human-friendly label for an Electron accelerator, e.g. "CommandOrControl+Shift+K". */
export function prettyHotkey(accel = '', platform = isDesktop ? window.notch.platform : 'web') {
  const mac = platform === 'darwin'
  return accel
    .split('+')
    .map((k) => {
      if (k === 'CommandOrControl' || k === 'CmdOrCtrl') return mac ? '⌘' : 'Ctrl'
      if (k === 'Command' || k === 'Cmd' || k === 'Super' || k === 'Meta') return mac ? '⌘' : 'Win'
      if (k === 'Control' || k === 'Ctrl') return mac ? '⌃' : 'Ctrl'
      if (k === 'Alt' || k === 'Option') return mac ? '⌥' : 'Alt'
      if (k === 'Shift') return mac ? '⇧' : 'Shift'
      if (k === 'Space') return 'Пробел'
      return k
    })
    .join(mac ? '' : ' + ')
}

/** Convert a KeyboardEvent into an Electron accelerator string (or null). */
export function eventToAccelerator(e) {
  const code = e.code || ''
  let key = null
  if (/^F\d{1,2}$/.test(e.key)) key = e.key
  else if (/^Key[A-Z]$/.test(code)) key = code.slice(3)
  else if (/^Digit\d$/.test(code)) key = code.slice(5)
  else if (code === 'Space') key = 'Space'
  else if (code === 'Backquote') key = '`'
  else if (/^Numpad\d$/.test(code)) key = 'num' + code.slice(6)
  else if (['Insert', 'Home', 'End', 'PageUp', 'PageDown', 'Pause', 'ScrollLock'].includes(code)) key = code
  if (!key) return null
  const mods = []
  if (e.metaKey) mods.push(platformIsMac() ? 'Command' : 'Super')
  if (e.ctrlKey) mods.push('Control')
  if (e.altKey) mods.push('Alt')
  if (e.shiftKey) mods.push('Shift')
  // A single letter/digit without modifiers would hijack normal typing everywhere.
  if (!mods.length && !/^F\d+$|^Pause$|^ScrollLock$|^Insert$|^Home$|^End$|^PageUp$|^PageDown$/.test(key)) return null
  return [...mods, key].join('+')
}

const platformIsMac = () => (isDesktop ? window.notch.platform === 'darwin' : /Mac/.test(navigator.platform))
