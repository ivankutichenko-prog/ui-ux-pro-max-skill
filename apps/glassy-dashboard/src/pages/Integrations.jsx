import { motion } from 'framer-motion'
import { CalendarDays, CreditCard, FileSpreadsheet, Globe, Mail, MessageCircle, Phone, Send, ShoppingBag, Zap } from 'lucide-react'
import { useStore } from '../lib/store'
import { Card, PageHeader, Toggle, stagger } from '../components/ui'

const ITEMS = [
  { id: 'telegram', name: 'Telegram', desc: 'Сообщения клиентов и уведомления о сделках в боте', icon: Send, color: '#38bdf8' },
  { id: 'whatsapp', name: 'WhatsApp', desc: 'Переписка с клиентами прямо во «Входящих»', icon: MessageCircle, color: '#34d399' },
  { id: 'email', name: 'Почта', desc: 'Gmail, Яндекс и любой IMAP-ящик', icon: Mail, color: '#60a5fa' },
  { id: 'calendar', name: 'Календарь', desc: 'Двусторонняя синхронизация встреч', icon: CalendarDays, color: '#fbbf24' },
  { id: 'payments', name: 'Онлайн-оплата', desc: 'Счета и приём платежей картой и по СБП', icon: CreditCard, color: '#a78bfa' },
  { id: 'telephony', name: 'IP-телефония', desc: 'Запись звонков и карточка клиента при входящем', icon: Phone, color: '#f472b6' },
  { id: 'accounting', name: 'Бухгалтерия', desc: 'Выгрузка счетов и актов в учётную систему', icon: FileSpreadsheet, color: '#a3e635' },
  { id: 'site', name: 'Формы на сайте', desc: 'Заявки с сайта сразу становятся лидами', icon: Globe, color: '#fb923c' },
  { id: 'shop', name: 'Интернет-магазин', desc: 'Заказы и клиенты из вашего магазина', icon: ShoppingBag, color: '#f87171' },
  { id: 'webhooks', name: 'Webhooks / API', desc: 'Подключите что угодно через HTTP-запросы', icon: Zap, color: '#e879f9' },
]

export default function Integrations() {
  const { integrations, toggleIntegration, toast } = useStore()
  const active = ITEMS.filter((i) => integrations[i.id]).length

  return (
    <>
      <PageHeader title="Интеграции" subtitle={`Подключено ${active} из ${ITEMS.length}`} />
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3.5">
        {ITEMS.map((it) => {
          const on = !!integrations[it.id]
          return (
            <Card key={it.id} className="relative overflow-hidden p-4">
              <motion.div
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl"
                style={{ background: it.color }}
                animate={{ opacity: on ? 0.35 : 0.08 }}
                transition={{ duration: 0.5 }}
              />
              <div className="relative flex items-start justify-between">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-white/15"
                  style={{ background: `${it.color}30`, color: it.color }}
                >
                  <it.icon size={18} />
                </span>
                <Toggle
                  checked={on}
                  label={it.name}
                  onChange={() => {
                    toggleIntegration(it.id)
                    toast(on ? `${it.name} отключено` : `${it.name} подключено`, on ? 'info' : 'success')
                  }}
                />
              </div>
              <p className="relative mt-3 text-sm font-semibold">{it.name}</p>
              <p className="relative mt-1 text-xs leading-relaxed text-white/55">{it.desc}</p>
              <p className="relative mt-3 text-[11px]" style={{ color: on ? '#6ee7b7' : 'rgba(255,255,255,0.35)' }}>
                {on ? '● Активно' : '○ Не подключено'}
              </p>
            </Card>
          )
        })}
      </motion.div>
    </>
  )
}
