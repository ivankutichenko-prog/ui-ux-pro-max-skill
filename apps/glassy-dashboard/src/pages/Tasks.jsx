import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, Flag, ListChecks, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { Button, Empty, PageHeader, Tabs, cx, inputCls } from '../components/ui'
import { Bar } from '../components/charts'
import { PRIORITIES } from '../lib/constants'
import { humanDate, isoDate } from '../lib/format'

function Check({ done }) {
  return (
    <span
      className={cx(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md ring-1 transition-colors duration-300',
        done ? 'bg-emerald-400 ring-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.6)]' : 'ring-white/30 hover:bg-white/10',
      )}
    >
      <svg viewBox="0 0 16 16" className="h-3 w-3">
        <motion.path
          d="M3 8.5 L6.5 12 L13 4.5"
          fill="none"
          stroke="#052e1c"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      </svg>
    </span>
  )
}

export default function Tasks() {
  const { tasks, addTask, toggleTask, deleteTask } = useStore()
  const today = isoDate(new Date())
  const [filter, setFilter] = useState('open')
  const [title, setTitle] = useState('')
  const [due, setDue] = useState(today)
  const [priority, setPriority] = useState('medium')

  const done = tasks.filter((t) => t.done).length
  const lists = {
    open: tasks.filter((t) => !t.done),
    today: tasks.filter((t) => !t.done && t.due <= today),
    upcoming: tasks.filter((t) => !t.done && t.due > today),
    done: tasks.filter((t) => t.done),
  }
  const list = useMemo(
    () =>
      [...lists[filter]].sort(
        (a, b) => Number(a.done) - Number(b.done) || a.due.localeCompare(b.due) || ['high', 'medium', 'low'].indexOf(a.priority) - ['high', 'medium', 'low'].indexOf(b.priority),
      ),
    [tasks, filter], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const submit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    addTask({ title: title.trim(), due, priority })
    setTitle('')
  }

  return (
    <>
      <PageHeader title="Задачи" subtitle={`Выполнено ${done} из ${tasks.length}`}>
        <div className="w-48">
          <Bar value={done} max={tasks.length || 1} color="#34d399" height={6} />
        </div>
      </PageHeader>

      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-inset mb-4 flex items-center gap-2 rounded-2xl p-2"
      >
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Новая задача… (Enter — добавить)" className={cx(inputCls, 'flex-1 border-transparent bg-transparent')} />
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={cx(inputCls, 'w-40')} />
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className={cx(inputCls, 'w-32')}>
          {Object.entries(PRIORITIES).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <Button type="submit" icon={Plus}>
          Добавить
        </Button>
      </motion.form>

      <Tabs
        className="mb-3"
        value={filter}
        onChange={setFilter}
        tabs={[
          { value: 'open', label: 'Активные', count: lists.open.length },
          { value: 'today', label: 'На сегодня', count: lists.today.length },
          { value: 'upcoming', label: 'Предстоящие', count: lists.upcoming.length },
          { value: 'done', label: 'Выполненные', count: lists.done.length },
        ]}
      />

      {list.length === 0 && <Empty icon={ListChecks} title="Здесь пусто" text="Добавьте задачу в поле выше" />}

      <div className="flex flex-col gap-1.5">
        <AnimatePresence initial={false}>
          {list.map((t, i) => {
            const p = PRIORITIES[t.priority]
            const overdue = !t.done && t.due < today
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 10) * 0.03 } }}
                exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                className="glass-inset group flex items-center gap-3 rounded-xl px-3.5 py-3"
              >
                <button onClick={() => toggleTask(t.id)} aria-label={t.done ? 'Вернуть в работу' : 'Отметить выполненной'}>
                  <Check done={t.done} />
                </button>
                <span className="relative min-w-0 flex-1 text-[13.5px]">
                  <span className={cx('transition-colors duration-300', t.done ? 'text-white/40' : 'text-white/90')}>{t.title}</span>
                  <motion.span
                    className="absolute left-0 top-1/2 h-px bg-white/50"
                    initial={false}
                    animate={{ width: t.done ? '100%' : '0%' }}
                    transition={{ duration: 0.35 }}
                  />
                </span>
                <span className="flex items-center gap-1 text-[11px]" style={{ color: p.color }}>
                  <Flag size={11} /> {p.label}
                </span>
                <span className={cx('flex w-28 items-center justify-end gap-1 text-[11px]', overdue ? 'text-red-300' : 'text-white/50')}>
                  <CalendarDays size={11} />
                  {overdue ? `просрочено · ${humanDate(t.due)}` : humanDate(t.due)}
                </span>
                <button
                  onClick={() => deleteTask(t.id)}
                  className="rounded-full p-1.5 text-white/30 opacity-0 transition-all hover:bg-red-500/20 hover:text-red-300 group-hover:opacity-100"
                  aria-label="Удалить задачу"
                >
                  <Trash2 size={13} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </>
  )
}
