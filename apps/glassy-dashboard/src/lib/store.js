import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { demoData, emptyData } from './seed'
import { uid } from './format'
import { stageById } from './constants'

const DEFAULT_PREFS = {
  userName: 'Иван',
  workspace: 'Моя компания',
  plan: 'Бизнес-план',
  currency: 'RUB',
  wallpaper: 'lounge',
  customWallpaper: null,
  liveWallpaper: true,
  glassBlur: 28,
  glassTint: 12,
  showWeekend: false,
  rightRail: ['contacts', 'credits', 'messages'],
}

const log = (state, type, text) => [{ id: uid(), type, text, at: Date.now() }, ...state.activity].slice(0, 40)

export const useStore = create(
  persist(
    (set, get) => ({
      ...demoData(),
      prefs: DEFAULT_PREFS,
      page: 'overview',
      toasts: [],

      // ---------------------------------------------------------- ui ---
      setPage: (page) => set({ page }),
      setPrefs: (patch) => set((s) => ({ prefs: { ...s.prefs, ...patch } })),
      toast: (text, tone = 'info') => {
        const id = uid()
        set((s) => ({ toasts: [...s.toasts, { id, text, tone }] }))
        setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3200)
      },

      // -------------------------------------------------------- leads ---
      addLead: (lead) =>
        set((s) => ({
          leads: [{ id: uid(), status: 'new', score: 50, createdAt: Date.now(), ...lead }, ...s.leads],
          activity: log(s, 'lead', `Новый лид: ${lead.name}`),
        })),
      updateLead: (id, patch) => set((s) => ({ leads: s.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
      deleteLead: (id) => set((s) => ({ leads: s.leads.filter((l) => l.id !== id) })),
      convertLead: (id) => {
        const lead = get().leads.find((l) => l.id === id)
        if (!lead) return
        const close = new Date()
        close.setDate(close.getDate() + 21)
        set((s) => ({
          leads: s.leads.map((l) => (l.id === id ? { ...l, status: 'qualified', converted: true } : l)),
          deals: [
            {
              id: uid(),
              title: `Сделка с ${lead.company || lead.name}`,
              company: lead.company || lead.name,
              stage: 'qualified',
              owner: lead.owner,
              value: lead.value,
              closeDate: close.toISOString().slice(0, 10),
              createdAt: Date.now(),
            },
            ...s.deals,
          ],
          activity: log(s, 'deal', `Лид «${lead.name}» конвертирован в сделку`),
        }))
      },

      // -------------------------------------------------------- deals ---
      addDeal: (deal) =>
        set((s) => ({
          deals: [{ id: uid(), stage: 'new', createdAt: Date.now(), ...deal }, ...s.deals],
          activity: log(s, 'deal', `Новая сделка: ${deal.title}`),
        })),
      moveDeal: (id, stage) => {
        const deal = get().deals.find((d) => d.id === id)
        if (!deal || deal.stage === stage) return
        set((s) => {
          const stats = { ...s.stats }
          // Closing a deal books its value into this month's revenue (and back if reopened).
          if (stage === 'won' || deal.stage === 'won') {
            const revenue = [...stats.revenue]
            revenue[revenue.length - 1] += stage === 'won' ? deal.value : -deal.value
            stats.revenue = revenue
          }
          return {
            stats,
            deals: s.deals.map((d) => (d.id === id ? { ...d, stage } : d)),
            activity: log(s, 'deal', `Сделка «${deal.title}» → ${stageById[stage]?.label}`),
          }
        })
      },
      deleteDeal: (id) => set((s) => ({ deals: s.deals.filter((d) => d.id !== id) })),

      // ----------------------------------------------------- contacts ---
      addContact: (c) =>
        set((s) => {
          const contacts = [...s.stats.contacts]
          contacts[contacts.length - 1] += 1
          return {
            contacts: [{ id: uid(), tags: [], createdAt: Date.now(), ...c }, ...s.contacts],
            stats: { ...s.stats, contacts },
            activity: log(s, 'contact', `Добавлен контакт: ${c.name}`),
          }
        }),
      deleteContact: (id) => set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) })),

      addCompany: (c) =>
        set((s) => ({
          companies: [{ id: uid(), createdAt: Date.now(), ...c }, ...s.companies],
          activity: log(s, 'company', `Добавлена компания: ${c.name}`),
        })),
      deleteCompany: (id) => set((s) => ({ companies: s.companies.filter((c) => c.id !== id) })),

      // -------------------------------------------------------- tasks ---
      addTask: (t) => set((s) => ({ tasks: [{ id: uid(), done: false, createdAt: Date.now(), ...t }, ...s.tasks] })),
      toggleTask: (id) =>
        set((s) => {
          const task = s.tasks.find((t) => t.id === id)
          return {
            tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
            activity: task && !task.done ? log(s, 'task', `Задача «${task.title}» выполнена`) : s.activity,
          }
        }),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      // ------------------------------------------------------- events ---
      addEvent: (e) =>
        set((s) => ({
          events: [...s.events, { id: uid(), color: 'blue', ...e }],
          activity: log(s, 'event', `Новое событие: ${e.title}`),
        })),
      deleteEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

      // ------------------------------------------------------- inbox ---
      markRead: (id, read = true) => set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, read } : m)) })),
      markAllRead: () => set((s) => ({ messages: s.messages.map((m) => ({ ...m, read: true })) })),
      reply: (id, text) =>
        set((s) => {
          const daily = [...s.stats.messagesDaily]
          daily[daily.length - 1] += 1
          return {
            messages: s.messages.map((m) => (m.id === id ? { ...m, replies: [...m.replies, { id: uid(), text, at: Date.now() }] } : m)),
            stats: { ...s.stats, messagesDaily: daily, creditsUsed: s.stats.creditsUsed + 5 },
          }
        }),
      deleteMessage: (id) => set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),

      // ------------------------------------------------- integrations ---
      toggleIntegration: (id) => set((s) => ({ integrations: { ...s.integrations, [id]: !s.integrations[id] } })),

      addCredits: (amount) =>
        set((s) => ({
          stats: { ...s.stats, credits: s.stats.credits + amount },
          activity: log(s, 'credits', `Баланс пополнен`),
        })),

      // --------------------------------------------------------- data ---
      resetDemo: () => set({ ...demoData() }),
      clearAll: () => set({ ...emptyData() }),
      exportData: () => {
        const { leads, deals, contacts, companies, tasks, events, messages, activity, integrations, stats, prefs } = get()
        return { app: 'glassy-dashboard', version: 1, exportedAt: new Date().toISOString(), leads, deals, contacts, companies, tasks, events, messages, activity, integrations, stats, prefs }
      },
      importData: (data) => {
        if (!data || data.app !== 'glassy-dashboard') throw new Error('Это не файл Glassy Dashboard')
        const base = emptyData()
        set({
          leads: data.leads ?? base.leads,
          deals: data.deals ?? base.deals,
          contacts: data.contacts ?? base.contacts,
          companies: data.companies ?? base.companies,
          tasks: data.tasks ?? base.tasks,
          events: data.events ?? base.events,
          messages: data.messages ?? base.messages,
          activity: data.activity ?? base.activity,
          integrations: data.integrations ?? base.integrations,
          stats: { ...base.stats, ...data.stats },
          prefs: { ...DEFAULT_PREFS, ...data.prefs },
        })
      },
    }),
    {
      name: 'glassy-dashboard',
      version: 1,
      partialize: ({ toasts, ...rest }) =>
        Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function')),
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        prefs: { ...DEFAULT_PREFS, ...(persisted?.prefs || {}) },
      }),
    },
  ),
)
