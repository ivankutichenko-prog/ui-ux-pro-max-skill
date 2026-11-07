import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Keyboard } from 'lucide-react'
import { prettyHotkey, useNotch } from '../lib/notch'
import { PageHeader } from '../components/ui'

export default function Support() {
  const { settings } = useNotch()
  const hk = prettyHotkey(settings.activeHotkey || settings.hotkey)
  const mac = settings.platform === 'darwin'
  const [open, setOpen] = useState(0)

  const faq = [
    {
      q: 'Как открыть и скрыть панель?',
      a: `Нажмите ${hk} в любой программе — панель выезжает из чёлки вверху экрана. Ещё раз ${hk}, Esc или клик в другое окно — и она прячется обратно. Также можно навести курсор на чёлку и кликнуть по ней или нажать на иконку в ${mac ? 'строке меню' : 'системном трее'}.`,
    },
    { q: 'Как поменять горячую клавишу?', a: 'Настройки → «Чёлка и горячая клавиша» → «Изменить», затем нажмите нужную клавишу или сочетание.' },
    {
      q: 'Где хранятся мои данные?',
      a: 'Только локально на этом компьютере, в папке профиля приложения. В интернет ничего не отправляется.',
    },
    {
      q: 'Как перенести данные на другой компьютер?',
      a: 'Настройки → «Сохранить резервную копию». Установите Glassy Dashboard на другом Mac или ПК с Windows и нажмите «Восстановить из файла».',
    },
    {
      q: 'Как начать вести свой бизнес вместо демо-данных?',
      a: 'Настройки → «Начать с чистого листа». Все примеры удалятся, и можно добавлять свои лиды, сделки, контакты и задачи.',
    },
    {
      q: 'Как полностью закрыть приложение?',
      a: `Через иконку в ${mac ? 'строке меню' : 'трее'} → «Выйти» или Настройки → «Выйти».`,
    },
  ]

  const shortcuts = [
    [hk, 'Открыть / скрыть панель'],
    ['Esc', 'Свернуть в чёлку'],
    [mac ? '⌘ K' : 'Ctrl + K', 'Поиск по CRM'],
    [mac ? '⌘ 1…0' : 'Ctrl + 1…0', 'Быстрый переход по разделам'],
  ]

  return (
    <>
      <PageHeader title="Поддержка" subtitle="Ответы на частые вопросы" />
      <div className="grid grid-cols-[1fr_280px] gap-3.5">
        <div className="flex flex-col gap-2">
          {faq.map((f, i) => (
            <motion.div
              key={f.q}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-inset overflow-hidden rounded-2xl"
            >
              <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left text-sm font-medium">
                {f.q}
                <motion.span animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.25 }}>
                  <ChevronDown size={16} className="text-white/50" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p className="px-4 pb-4 text-[13px] leading-relaxed text-white/65">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="glass-inset h-fit rounded-2xl p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Keyboard size={15} /> Горячие клавиши
          </p>
          <div className="flex flex-col gap-2.5">
            {shortcuts.map(([k, d]) => (
              <div key={d} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-white/65">{d}</span>
                <kbd className="shrink-0 rounded-md bg-white/12 px-2 py-0.5 font-sans text-[11px] ring-1 ring-white/15">{k}</kbd>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  )
}
