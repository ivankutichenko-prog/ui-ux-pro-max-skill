import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Copy, Mail, Phone, Plus, Search, Trash2, Users } from 'lucide-react'
import { useStore } from '../lib/store'
import { Avatar, Button, Empty, Field, Modal, PageHeader, Tabs, inputCls } from '../components/ui'

const PALETTE = ['#f59e0b', '#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#38bdf8', '#fb7185', '#a3e635']
const colorFor = (s) => PALETTE[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length]

function ContactModal({ open, onClose }) {
  const { addContact, toast, companies } = useStore()
  const blank = { name: '', role: '', company: '', email: '', phone: '', tags: '' }
  const [f, setF] = useState(blank)
  useEffect(() => {
    if (open) setF(blank)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const submit = (e) => {
    e.preventDefault()
    if (!f.name.trim()) return
    addContact({ ...f, name: f.name.trim(), tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean) })
    toast('Контакт добавлен', 'success')
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Новый контакт">
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Имя и фамилия">
            <input autoFocus className={inputCls} value={f.name} onChange={set('name')} placeholder="Анна Иванова" />
          </Field>
          <Field label="Должность">
            <input className={inputCls} value={f.role} onChange={set('role')} placeholder="Директор" />
          </Field>
          <Field label="Компания">
            <input className={inputCls} list="contact-companies" value={f.company} onChange={set('company')} />
            <datalist id="contact-companies">
              {companies.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </Field>
          <Field label="Телефон">
            <input className={inputCls} value={f.phone} onChange={set('phone')} placeholder="+7 900 000-00-00" />
          </Field>
        </div>
        <Field label="Email">
          <input className={inputCls} type="email" value={f.email} onChange={set('email')} placeholder="anna@company.ru" />
        </Field>
        <Field label="Теги" hint="Через запятую: VIP, Партнёр">
          <input className={inputCls} value={f.tags} onChange={set('tags')} />
        </Field>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit">Сохранить</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function Contacts() {
  const { contacts, deleteContact, toast } = useStore()
  const [q, setQ] = useState('')
  const [tag, setTag] = useState('all')
  const [open, setOpen] = useState(false)

  const tags = useMemo(() => [...new Set(contacts.flatMap((c) => c.tags || []))], [contacts])
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return contacts.filter(
      (c) =>
        (tag === 'all' || (c.tags || []).includes(tag)) &&
        (!s || [c.name, c.company, c.email, c.role].some((x) => (x || '').toLowerCase().includes(s))),
    )
  }, [contacts, q, tag])

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      toast('Скопировано', 'success')
    } catch {
      toast('Не удалось скопировать', 'error')
    }
  }

  return (
    <>
      <PageHeader title="Контакты" subtitle={`${contacts.length} человек в вашей базе`}>
        <div className="glass-input flex h-9 w-56 items-center gap-2 rounded-full px-3">
          <Search size={14} className="text-white/45" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Имя, компания, email" className="w-full bg-transparent text-xs outline-none placeholder:text-white/40" />
        </div>
        <Button icon={Plus} onClick={() => setOpen(true)}>
          Контакт
        </Button>
      </PageHeader>

      {tags.length > 0 && (
        <Tabs className="mb-4" value={tag} onChange={setTag} tabs={[{ value: 'all', label: 'Все' }, ...tags.map((t) => ({ value: t, label: t }))]} />
      )}

      {list.length === 0 && <Empty icon={Users} title="Контактов нет" text="Добавьте первого клиента или партнёра" action={<Button size="sm" icon={Plus} onClick={() => setOpen(true)}>Добавить</Button>} />}

      <motion.div layout className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3.5">
        <AnimatePresence>
          {list.map((c, i) => (
            <motion.div
              key={c.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: Math.min(i, 15) * 0.035 } }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -4 }}
              className="glass-inset group relative rounded-2xl p-4"
            >
              <button
                onClick={() => deleteContact(c.id)}
                className="absolute right-2.5 top-2.5 rounded-full p-1.5 text-white/30 opacity-0 transition-all hover:bg-red-500/20 hover:text-red-300 group-hover:opacity-100"
                aria-label="Удалить контакт"
              >
                <Trash2 size={13} />
              </button>
              <div className="flex items-center gap-3">
                <Avatar name={c.name} color={colorFor(c.name)} size={42} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="truncate text-[11px] text-white/50">{[c.role, c.company].filter(Boolean).join(' · ')}</p>
                </div>
              </div>
              <div className="mt-3.5 flex flex-col gap-1.5 text-xs text-white/70">
                {c.email && (
                  <button onClick={() => copy(c.email)} className="flex items-center gap-2 truncate text-left hover:text-white" title="Скопировать email">
                    <Mail size={12} className="shrink-0 text-white/40" />
                    <span className="truncate">{c.email}</span>
                    <Copy size={11} className="ml-auto shrink-0 opacity-0 group-hover:opacity-50" />
                  </button>
                )}
                {c.phone && (
                  <button onClick={() => copy(c.phone)} className="flex items-center gap-2 text-left hover:text-white" title="Скопировать телефон">
                    <Phone size={12} className="text-white/40" />
                    {c.phone}
                  </button>
                )}
              </div>
              {c.tags?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {c.tags.map((t) => (
                    <span key={t} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3.5 flex gap-2">
                {c.email && (
                  <a href={`mailto:${c.email}`} className="flex-1 rounded-full bg-white/10 py-1.5 text-center text-[11px] font-medium ring-1 ring-white/10 transition-colors hover:bg-white/20">
                    Написать
                  </a>
                )}
                {c.phone && (
                  <a href={`tel:${c.phone.replace(/[^+\d]/g, '')}`} className="flex-1 rounded-full bg-white/10 py-1.5 text-center text-[11px] font-medium ring-1 ring-white/10 transition-colors hover:bg-white/20">
                    Позвонить
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <ContactModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
