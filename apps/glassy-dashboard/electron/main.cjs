// Glassy Dashboard — main process.
//
// The app lives in the background (menu bar on macOS, system tray on Windows)
// and is shown as a "notch": a single frameless, transparent, always-on-top
// window anchored to the top-center of the screen. Collapsed, only a small
// black pill is visible (it blends with the MacBook notch); a global hotkey,
// a click on the pill or the tray icon unfolds it into the full dashboard.
//
// The window never resizes. The renderer animates the notch shape inside the
// window, and the window itself lets clicks pass through everywhere except the
// pill while collapsed (setIgnoreMouseEvents + forward).

const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  screen,
  Tray,
  Menu,
  nativeImage,
  shell,
} = require('electron')
const path = require('path')
const fs = require('fs')

const isMac = process.platform === 'darwin'
const isWin = process.platform === 'win32'
const DEV_URL = process.env.VITE_DEV_SERVER_URL

const DEFAULT_SETTINGS = {
  hotkey: 'F8',
  alwaysShowNotch: true,
  pinned: false,
  firstRun: true,
}
const FALLBACK_HOTKEYS = ['Alt+Space', 'CommandOrControl+Shift+Space']

/** @type {BrowserWindow | null} */
let win = null
/** @type {Tray | null} */
let tray = null
let settings = { ...DEFAULT_SETTINGS }
let state = 'collapsed' // 'collapsed' | 'expanded'
let activeHotkey = null
let hotkeyError = null
let layout = null
let quitting = false

// ---------------------------------------------------------------- settings --
const settingsFile = () => path.join(app.getPath('userData'), 'notch-settings.json')

function loadSettings() {
  try {
    settings = { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(settingsFile(), 'utf8')) }
  } catch {
    settings = { ...DEFAULT_SETTINGS }
  }
}

function saveSettings() {
  try {
    fs.mkdirSync(path.dirname(settingsFile()), { recursive: true })
    fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2))
  } catch (err) {
    console.error('Failed to save settings', err)
  }
}

// ------------------------------------------------------------------ layout --
const SHADOW_PAD = 36 // room around the panel so its CSS shadow is not clipped

function computeLayout(display) {
  const b = display.bounds
  // On macOS the work area starts below the menu bar; on notched MacBooks the
  // menu bar is exactly as tall as the notch (~37pt), otherwise ~24pt.
  const menuBar = isMac ? Math.max(0, display.workArea.y - b.y) : 0
  const hasNotch = isMac && menuBar >= 32
  const notchHeight = isMac ? Math.max(menuBar, 30) : 32
  const panelWidth = Math.min(1480, b.width - 32)
  const panelHeight = Math.min(940, b.height - 24)
  const width = Math.min(b.width, panelWidth + SHADOW_PAD * 2)
  const height = Math.min(b.height, panelHeight + SHADOW_PAD)
  return {
    bounds: {
      x: Math.round(b.x + (b.width - width) / 2),
      y: b.y,
      width: Math.round(width),
      height: Math.round(height),
    },
    panelWidth: Math.round(panelWidth),
    panelHeight: Math.round(panelHeight),
    notchWidth: hasNotch ? 204 : 190,
    notchHeight,
    hasNotch,
    platform: process.platform,
  }
}

function applyLayout(display) {
  if (!win) return
  layout = computeLayout(display)
  win.setBounds(layout.bounds)
  win.webContents.send('notch:layout', layout)
}

const cursorDisplay = () => screen.getDisplayNearestPoint(screen.getCursorScreenPoint())

// ------------------------------------------------------------------ window --
function createWindow() {
  layout = computeLayout(screen.getPrimaryDisplay())

  win = new BrowserWindow({
    ...layout.bounds,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    enableLargerThanScreen: true,
    roundedCorners: false,
    show: false,
    title: 'Glassy Dashboard',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
      spellcheck: false,
    },
  })

  // Float above the menu bar / taskbar and over full-screen apps, like a real notch.
  win.setAlwaysOnTop(true, 'screen-saver')
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true, skipTransformProcessType: true })
  win.setIgnoreMouseEvents(true, { forward: true })

  if (DEV_URL) win.loadURL(DEV_URL)
  else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))

  win.webContents.once('did-finish-load', () => {
    win.webContents.send('notch:layout', layout)
    if (settings.alwaysShowNotch) win.showInactive()
    if (settings.firstRun) {
      settings.firstRun = false
      saveSettings()
      setTimeout(expand, 450)
    }
  })

  win.on('blur', () => {
    if (state === 'expanded' && !settings.pinned) collapse()
  })

  // External links open in the default browser, never inside the notch.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:|^mailto:|^tel:/.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (e, url) => {
    if (DEV_URL && url.startsWith(DEV_URL)) return
    e.preventDefault()
    if (/^https?:|^mailto:|^tel:/.test(url)) shell.openExternal(url)
  })

  win.on('close', (e) => {
    if (!quitting) {
      e.preventDefault()
      collapse()
    }
  })
}

// ------------------------------------------------------------ notch state --
function expand() {
  if (!win) return
  applyLayout(cursorDisplay())
  state = 'expanded'
  win.setIgnoreMouseEvents(false)
  if (isMac) app.focus({ steal: true })
  win.show()
  win.focus()
  win.webContents.send('notch:state', 'expanded')
  refreshTrayMenu()
}

function collapse() {
  if (!win || state === 'collapsed') return
  state = 'collapsed'
  win.webContents.send('notch:state', 'collapsed')
  refreshTrayMenu()
}

function toggle() {
  if (state === 'expanded') collapse()
  else expand()
}

// Called by the renderer once the collapse animation has finished.
function onCollapsedDone() {
  if (!win || state !== 'collapsed') return
  win.setIgnoreMouseEvents(true, { forward: true })
  const hadFocus = win.isFocused()
  if (!settings.alwaysShowNotch) {
    win.hide()
  } else if (layout && win.getBounds().x !== computeLayout(screen.getPrimaryDisplay()).bounds.x) {
    // Park the idle pill back on the primary display.
    applyLayout(screen.getPrimaryDisplay())
  }
  if (hadFocus) {
    // Hand keyboard focus back to whatever app was in front.
    if (isMac) {
      app.hide()
      if (settings.alwaysShowNotch) setTimeout(() => win && win.showInactive(), 60)
    } else {
      win.blur()
    }
  }
}

// ----------------------------------------------------------------- hotkey --
function registerHotkey(accelerator) {
  try {
    if (activeHotkey) globalShortcut.unregister(activeHotkey)
  } catch {}
  activeHotkey = null
  try {
    if (accelerator && globalShortcut.register(accelerator, toggle)) {
      activeHotkey = accelerator
      return true
    }
  } catch {}
  return false
}

function setupHotkey() {
  hotkeyError = null
  if (registerHotkey(settings.hotkey)) return
  hotkeyError = `Клавиша «${settings.hotkey}» занята другой программой`
  for (const alt of FALLBACK_HOTKEYS) {
    if (registerHotkey(alt)) {
      hotkeyError += `, временно используется «${alt}»`
      return
    }
  }
}

// ------------------------------------------------------------------- tray --
function trayIcon() {
  const dir = path.join(__dirname, 'assets')
  if (isMac) {
    const img = nativeImage.createFromPath(path.join(dir, 'trayTemplate.png'))
    img.setTemplateImage(true)
    return img
  }
  return nativeImage.createFromPath(path.join(dir, isWin ? 'tray.png' : 'tray@2x.png'))
}

function refreshTrayMenu() {
  if (!tray) return
  const loginItem = app.getLoginItemSettings().openAtLogin
  const menu = Menu.buildFromTemplate([
    {
      label: state === 'expanded' ? 'Свернуть панель' : 'Открыть панель',
      accelerator: activeHotkey || undefined,
      registerAccelerator: false,
      click: toggle,
    },
    { type: 'separator' },
    {
      label: 'Закрепить панель',
      type: 'checkbox',
      checked: settings.pinned,
      click: (item) => updateSettings({ pinned: item.checked }),
    },
    {
      label: 'Показывать чёлку всегда',
      type: 'checkbox',
      checked: settings.alwaysShowNotch,
      click: (item) => updateSettings({ alwaysShowNotch: item.checked }),
    },
    {
      label: 'Запускать при входе в систему',
      type: 'checkbox',
      checked: loginItem,
      click: (item) => updateSettings({ openAtLogin: item.checked }),
    },
    { type: 'separator' },
    { label: 'Выйти из Glassy Dashboard', click: quit },
  ])
  tray.setContextMenu(menu)
  tray.setToolTip(`Glassy Dashboard — ${activeHotkey || 'клавиша не назначена'}`)
}

function createTray() {
  tray = new Tray(trayIcon())
  // On Windows a left click toggles; the menu stays on right click.
  if (!isMac) tray.on('click', toggle)
  refreshTrayMenu()
}

// ---------------------------------------------------------------- settings --
function publicSettings() {
  return {
    ...settings,
    activeHotkey,
    hotkeyError,
    openAtLogin: app.getLoginItemSettings().openAtLogin,
    platform: process.platform,
    version: app.getVersion(),
  }
}

function updateSettings(patch) {
  if ('openAtLogin' in patch) {
    app.setLoginItemSettings({ openAtLogin: !!patch.openAtLogin, openAsHidden: true })
    delete patch.openAtLogin
  }
  settings = { ...settings, ...patch }
  saveSettings()
  if ('alwaysShowNotch' in patch && win && state === 'collapsed') {
    if (settings.alwaysShowNotch) win.showInactive()
    else win.hide()
  }
  refreshTrayMenu()
  if (win) win.webContents.send('notch:settings', publicSettings())
  return publicSettings()
}

function quit() {
  quitting = true
  app.quit()
}

// --------------------------------------------------------------------- ipc --
ipcMain.handle('notch:get-layout', () => layout)
ipcMain.handle('notch:get-state', () => state)
ipcMain.on('notch:request', (_e, action) => {
  if (action === 'expand') expand()
  else if (action === 'collapse') collapse()
  else toggle()
})
ipcMain.on('notch:collapsed-done', onCollapsedDone)
ipcMain.on('notch:interactive', (_e, interactive) => {
  if (!win || state === 'expanded') return
  if (interactive) win.setIgnoreMouseEvents(false)
  else win.setIgnoreMouseEvents(true, { forward: true })
})

ipcMain.handle('settings:get', () => publicSettings())
ipcMain.handle('settings:update', (_e, patch) => updateSettings(patch || {}))
ipcMain.handle('settings:set-hotkey', (_e, accelerator) => {
  const previous = activeHotkey
  if (registerHotkey(accelerator)) {
    settings.hotkey = accelerator
    hotkeyError = null
    saveSettings()
    refreshTrayMenu()
    return { ok: true, settings: publicSettings() }
  }
  if (previous) registerHotkey(previous)
  return { ok: false, error: `Не удалось назначить «${accelerator}» — сочетание занято системой или другой программой.` }
})
// While the user records a new hotkey in Settings, the current one must not fire.
ipcMain.on('settings:suspend-hotkey', (_e, suspend) => {
  if (suspend) {
    if (activeHotkey) globalShortcut.unregister(activeHotkey)
  } else if (activeHotkey && !globalShortcut.isRegistered(activeHotkey)) {
    registerHotkey(activeHotkey)
  }
})
ipcMain.on('app:quit', quit)

// --------------------------------------------------------------- lifecycle --
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => expand())

  app.whenReady().then(() => {
    if (isMac && app.dock) app.dock.hide()
    loadSettings()
    createWindow()
    setupHotkey()
    createTray()

    // Smoke test (CI / headless): open the notch, capture it, and quit.
    if (process.env.GLASSY_SMOKE_TEST) {
      win.webContents.once('did-finish-load', () => {
        setTimeout(expand, 300)
        setTimeout(async () => {
          const image = await win.webContents.capturePage()
          fs.writeFileSync(process.env.GLASSY_SMOKE_TEST, image.toPNG())
          console.log('SMOKE_OK', JSON.stringify({ layout, state, hotkey: activeHotkey }))
          quit()
        }, 3500)
      })
    }

    screen.on('display-metrics-changed', () => {
      if (state === 'collapsed') applyLayout(screen.getPrimaryDisplay())
    })
    screen.on('display-removed', () => applyLayout(screen.getPrimaryDisplay()))
  })

  app.on('activate', () => expand())
  app.on('before-quit', () => {
    quitting = true
  })
  app.on('will-quit', () => globalShortcut.unregisterAll())
  // Keep running in the tray when the (only) window is hidden.
  app.on('window-all-closed', (e) => e.preventDefault())
}
