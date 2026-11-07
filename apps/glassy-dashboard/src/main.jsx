import React from 'react'
import ReactDOM from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import '@fontsource-variable/inter'
import '@fontsource/lora/400.css'
import '@fontsource/lora/500.css'
import '@fontsource/lora/600.css'
import './index.css'
import App from './App'
import { NotchProvider } from './lib/notch'
import { useStore } from './lib/store'

// Glass intensity is a live CSS variable driven from Settings.
function applyGlass({ glassBlur, glassTint }) {
  const root = document.documentElement
  root.style.setProperty('--glass-blur', `${glassBlur}px`)
  root.style.setProperty('--glass-tint', String(glassTint / 100))
}
applyGlass(useStore.getState().prefs)
useStore.subscribe((s, prev) => {
  if (s.prefs !== prev.prefs) applyGlass(s.prefs)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <NotchProvider>
        <App />
      </NotchProvider>
    </MotionConfig>
  </React.StrictMode>,
)
