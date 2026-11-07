import { useEffect, useState } from 'react'
import { useStore } from '../lib/store'
import { Button, Field, Modal, inputCls } from '../components/ui'
import { DEAL_STAGES } from '../lib/constants'
import { TEAM } from '../lib/seed'
import { addDays, isoDate } from '../lib/format'

const blank = () => ({ title: '', company: '', value: '', stage: 'new', owner: 'me', closeDate: isoDate(addDays(new Date(), 30)) })

export default function DealModal({ open, onClose, stage }) {
  const addDeal = useStore((s) => s.addDeal)
  const toast = useStore((s) => s.toast)
  const companies = useStore((s) => s.companies)
  const [f, setF] = useState(blank)

  useEffect(() => {
    if (open) setF({ ...blank(), stage: stage || 'new' })
  }, [open, stage])

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const submit = (e) => {
    e.preventDefault()
    if (!f.title.trim()) return
    addDeal({ ...f, title: f.title.trim(), value: Number(f.value) || 0 })
    toast('Сделка создана', 'success')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Новая сделка" subtitle="Появится в воронке на выбранном этапе">
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <Field label="Название">
          <input autoFocus className={inputCls} value={f.title} onChange={set('title')} placeholder="Например, Внедрение CRM" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Компания">
            <input className={inputCls} list="companies-list" value={f.company} onChange={set('company')} placeholder="ООО «Ромашка»" />
            <datalist id="companies-list">
              {companies.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </Field>
          <Field label="Сумма">
            <input className={inputCls} type="number" min="0" value={f.value} onChange={set('value')} placeholder="150000" />
          </Field>
          <Field label="Этап">
            <select className={inputCls} value={f.stage} onChange={set('stage')}>
              {DEAL_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ответственный">
            <select className={inputCls} value={f.owner} onChange={set('owner')}>
              {TEAM.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Плановая дата закрытия">
          <input className={inputCls} type="date" value={f.closeDate} onChange={set('closeDate')} />
        </Field>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit">Создать сделку</Button>
        </div>
      </form>
    </Modal>
  )
}
