// Narrow, typed-by-convention bridge between the renderer and the main process.
const { contextBridge, ipcRenderer } = require('electron')

const subscribe = (channel) => (callback) => {
  const listener = (_event, payload) => callback(payload)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

contextBridge.exposeInMainWorld('notch', {
  isDesktop: true,
  platform: process.platform,
  getLayout: () => ipcRenderer.invoke('notch:get-layout'),
  getState: () => ipcRenderer.invoke('notch:get-state'),
  onLayout: subscribe('notch:layout'),
  onState: subscribe('notch:state'),
  onSettings: subscribe('notch:settings'),
  request: (action) => ipcRenderer.send('notch:request', action),
  collapsedDone: () => ipcRenderer.send('notch:collapsed-done'),
  setInteractive: (interactive) => ipcRenderer.send('notch:interactive', !!interactive),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (patch) => ipcRenderer.invoke('settings:update', patch),
  setHotkey: (accelerator) => ipcRenderer.invoke('settings:set-hotkey', accelerator),
  suspendHotkey: (suspend) => ipcRenderer.send('settings:suspend-hotkey', !!suspend),
  quit: () => ipcRenderer.send('app:quit'),
})
