import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCheck, Inbox as InboxIcon, Mail, MessageCircle, Send, Trash2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { Avatar, Button, Empty, PageHeader, Tabs, cx } from '../components/ui'
import { CHANNELS } from '../lib/constants'
import { relativeTime } from '../lib/format'

const CH_ICON = { email: Mail, telegram: Send, whatsapp: MessageCircle }

export default function InboxPage() {
  const { messages, markRead, markAllRead, reply, deleteMessage, toast } = useStore()
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(() => messages[0]?.id)
  const [text, setText] = useState('')

  const list = messages
    .filter((m) => filter === 'all' || (filter === 'unread' ? !m.read : m.channel === filter))
    .sort((a, b) => b.at - a.at)
  const current = messages.find((m) => m.id === selected)
  const unread = messages.filter((m) => !m.read).length

  useEffect(() => {
    if (current && !current.read) {
      const t = setTimeout(() => markRead(current.id), 600)
      return () => clearTimeout(t)
    }
  }, [current, markRead])

  const send = (e) => {
    e.preventDefault()
    if (!text.trim() || !current) return
    reply(current.id, text.trim())
    setText('')
    toast(`Ответ отправлен через ${CHANNELS[current.channel].label}`, 'success')
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Входящие" subtitle={unread ? `${unread} непрочитанных` : 'Все сообщения прочитаны'}>
        <Button variant="glass" icon={CheckCheck} onClick={markAllRead} disabled={!unread}>
          Прочитать все
        </Button>
      </PageHeader>

      <Tabs
        className="mb-3 self-start"
        value={filter}
        onChange={setFilter}
        tabs={[
          { value: 'all', label: 'Все', count: messages.length },
          { value: 'unread', label: 'Непрочитанные', count: unread },
          ...Object.entries(CHANNELS).map(([k, v]) => ({ value: k, label: v.label })),
        ]}
      />

      <div className="flex min-h-[460px] flex-1 gap-3.5">
        <div className="glass-inset scroll-area w-[330px] shrink-0 rounded-2xl p-1.5">
          {list.length === 0 && <Empty icon={InboxIcon} title="Нет сообщений" />}
          {list.map((m, i) => {
            const Icon = CH_ICON[m.channel]
            const active = m.id === selected
            return (
              <motion.button
                key={m.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelected(m.id)}
                className={cx('relative flex w-full gap-3 rounded-xl p-3 text-left transition-colors', active ? 'bg-white/14' : 'hover:bg-white/6')}
              >
                {active && <motion.span layoutId="inbox-active" className="absolute inset-0 rounded-xl ring-1 ring-white/20" />}
                <div className="relative">
                  <Avatar name={m.from} color={CHANNELS[m.channel].color} size={34} />
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 ring-1 ring-white/20">
                    <Icon size={9} style={{ color: CHANNELS[m.channel].color }} />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={cx('truncate text-[13px]', !m.read ? 'font-semibold' : 'text-white/80')}>{m.from}</span>
                    <span className="shrink-0 text-[10px] text-white/40">{relativeTime(m.at)}</span>
                  </div>
                  <p className={cx('truncate text-xs', !m.read ? 'text-white/90' : 'text-white/60')}>{m.subject}</p>
                  <p className="truncate text-[11px] text-white/40">{m.body}</p>
                </div>
                <AnimatePresence>
                  {!m.read && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.9)]"
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            )
          })}
        </div>

        <div className="glass-inset flex min-w-0 flex-1 flex-col rounded-2xl">
          <AnimatePresence mode="wait">
            {current ? (
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="flex h-full flex-col"
              >
                <div className="flex items-start justify-between gap-4 border-b border-white/8 p-5">
                  <div className="flex items-center gap-3">
                    <Avatar name={current.from} color={CHANNELS[current.channel].color} size={40} />
                    <div>
                      <p className="text-sm font-semibold">{current.from}</p>
                      <p className="text-[11px] text-white/45">
                        {CHANNELS[current.channel].label} · {relativeTime(current.at)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      deleteMessage(current.id)
                      setSelected(list.find((m) => m.id !== current.id)?.id)
                    }}
                    className="rounded-full p-2 text-white/40 hover:bg-red-500/20 hover:text-red-300"
                    aria-label="Удалить сообщение"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="scroll-area flex-1 p-5">
                  <h2 className="font-display text-xl">{current.subject}</h2>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80">{current.body}</p>
                  <div className="mt-6 flex flex-col items-end gap-2">
                    <AnimatePresence>
                      {current.replies.map((r) => (
                        <motion.div
                          key={r.id}
                          initial={{ opacity: 0, y: 12, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className="max-w-md rounded-2xl rounded-br-md bg-blue-500/70 px-3.5 py-2 text-sm shadow-[0_8px_20px_-10px_rgba(59,130,246,0.9)]"
                        >
                          {r.text}
                          <span className="ml-2 text-[10px] text-white/60">{relativeTime(r.at)}</span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
                <form onSubmit={send} className="flex items-center gap-2 border-t border-white/8 p-3">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={`Ответить в ${CHANNELS[current.channel].label}…`}
                    className="glass-input h-10 flex-1 rounded-full px-4 text-sm placeholder:text-white/35"
                  />
                  <Button type="submit" icon={Send} disabled={!text.trim()}>
                    Отправить
                  </Button>
                </form>
              </motion.div>
            ) : (
              <Empty icon={InboxIcon} title="Выберите сообщение" />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
