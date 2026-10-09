'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { site } from '@/content/site'
import { serializeSelectedItems } from '@/lib/selection'
import { CloseIcon } from './icons'
import { useSelection } from './selection-provider'

type FormStatus = 'idle' | 'sending' | 'success' | 'error' | 'demo'

const endpoint = process.env.NEXT_PUBLIC_FORM_ENDPOINT
const DRAFT_KEY = 'anteh-contact-draft'

export function RequestForm() {
  const { selected, remove, setAmount, clear } = useSelection()
  const [status, setStatus] = useState<FormStatus>('idle')
  const [contactError, setContactError] = useState('')
  const [prepared, setPrepared] = useState('')
  const [copyStatus, setCopyStatus] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  useEffect(() => {
    try {
      const draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? '{}')
      for (const element of Array.from(formRef.current?.elements ?? [])) {
        if ((element instanceof HTMLInputElement && !['checkbox', 'hidden'].includes(element.type)) || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
          if (typeof draft[element.name] === 'string' && element.name !== 'company_website') element.value = draft[element.name]
        }
      }
    } catch { /* Ignore invalid or unavailable storage. */ }
  }, [])
  function saveDraft() {
    setPrepared(''); setCopyStatus(''); setStatus('idle')
    if (!formRef.current) return
    const data = Object.fromEntries(new FormData(formRef.current))
    delete data['Согласие']; delete data.company_website
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data)) } catch { /* Form still works. */ }
  }
  useEffect(() => { queueMicrotask(() => { setPrepared(''); setStatus(current => current === 'demo' ? 'idle' : current) }) }, [selected])
  async function copyRequest() {
    try { await navigator.clipboard.writeText(prepared); setCopyStatus('Текст скопирован.') }
    catch { setCopyStatus('Выделите и скопируйте текст ниже.') }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    if (formData.get('company_website')) return

    const phone = String(formData.get('phone') ?? '').trim()
    const email = String(formData.get('email') ?? '').trim()
    if (!phone && !email) {
      setContactError('Укажите телефон или электронную почту.')
      setStatus('idle')
      return
    }

    if (!String(formData.get('Контактное лицо') ?? '').trim()) { setContactError('Укажите имя контактного лица.'); return }
    setContactError('')
    formData.set('_subject', 'Новая заявка с сайта «АнТех Восток»')
    formData.set('Состав заявки', serializeSelectedItems(selected))

    if (!endpoint) {
      setPrepared(Array.from(formData.entries()).filter(([key]) => !['_subject','company_website','Согласие'].includes(key)).map(([key,value]) => `${key}: ${value}`).join('\n\n'))
      setStatus('demo')
      return
    }

    setStatus('sending')
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
        signal: AbortSignal.timeout(15000),
      })
      if (!response.ok) throw new Error(`Ошибка отправки: ${response.status}`)
      form.reset()
      try { sessionStorage.removeItem(DRAFT_KEY) } catch {}
      clear()
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="request" className="request-section scroll-target">
      <div className="request-heading">
        <p className="eyebrow light">Заявка</p>
        <h2>Расскажите, что нужно решить</h2>
        <p>
          Выберите позиции в каталоге или отправьте общий запрос на техническую консультацию.
        </p>
      </div>

      <form ref={formRef} className="request-form" onSubmit={handleSubmit} onInput={saveDraft}>
        {!endpoint && <p className="request-notice">Онлайн-отправка пока недоступна. Подготовьте запрос и отправьте его на <a href={`mailto:${site.email}`}>{site.email}</a>.</p>}
        <div className="form-section-heading">
          <span>01</span>
          <div>
            <h3>Состав заявки</h3>
            <p>Проверьте выбранные исполнения и укажите необходимый объём.</p>
          </div>
        </div>

        {selected.length === 0 ? (
          <div className="selection-empty">
            <p>Позиции не выбраны</p>
            <span>Можно обратиться за общей технической консультацией.</span>
          </div>
        ) : (
          <div className="selected-list">
            {selected.map((item) => (
              <div className="selected-row" key={item.id}>
                <div className="selected-item-name">
                  <span>{item.item_type === 'product' ? 'Продукция' : 'Услуга'}</span>
                  <strong>{item.title}</strong>{item.configuration && <small>{item.configuration}</small>}
                </div>
                <label>
                  <span>Количество или объём</span>
                  <input
                    value={item.amount}
                    onChange={(event) => setAmount(item.id, event.target.value)}
                    placeholder="Например, 500 шт."
                    maxLength={120}
                  />
                </label>
                <button type="button" onClick={() => remove(item.id)} aria-label={`Убрать ${item.title} из заявки`}>
                  <CloseIcon />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="form-section-heading contact-heading">
          <span>02</span>
          <div>
            <h3>Контактные данные</h3>
            <p>Укажите имя и хотя бы один способ связи: телефон или почту.</p>
          </div>
        </div>

        <div className="form-grid">
          <label>
            <span>Контактное лицо *</span>
            <input name="Контактное лицо" autoComplete="name" required maxLength={120} />
          </label>
          <label>
            <span>Предприятие</span>
            <input name="Предприятие" autoComplete="organization" maxLength={160} />
          </label>
          <label>
            <span>Телефон</span>
            <input name="phone" type="tel" autoComplete="tel" maxLength={40} placeholder="+7 (___) ___-__-__" />
          </label>
          <label>
            <span>Электронная почта</span>
            <input name="email" type="email" autoComplete="email" maxLength={160} placeholder="name@company.ru" />
          </label>
          <label>
            <span>Регион</span>
            <input name="Регион" autoComplete="address-level1" maxLength={120} />
          </label>
          <label>
            <span>Тип обращения</span>
            <select name="Тип обращения" defaultValue="Запрос коммерческого предложения">
              <option>Запрос коммерческого предложения</option>
              <option>Техническая консультация</option>
              <option>Запрос документации</option>
            </select>
          </label>
        </div>

        {contactError && <p className="field-error" role="alert">{contactError}</p>}

        <label className="message-field">
          <span>Комментарий или техническая задача</span>
          <textarea
            name="Комментарий"
            rows={5}
            maxLength={3000}
            placeholder="Опишите условия, задачу или дополнительные требования"
          />
        </label>

        <div className="honeypot" aria-hidden="true">
          <label>Не заполняйте это поле<input name="company_website" tabIndex={-1} autoComplete="off" /></label>
        </div>

        <label className="consent-field">
          <input type="checkbox" name="Согласие" value="Да" required />
          <span>
            Я согласен на обработку персональных данных в соответствии с{' '}
            <Link href="/privacy/">политикой обработки данных</Link>.
          </span>
        </label>

        <div className="form-actions">
          <button className="button accent" type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? 'Отправляем…' : endpoint ? 'Отправить заявку' : 'Подготовить запрос'}
          </button>
          <p>Данные используются для ответа на ваше обращение.</p>
        </div>

        <div className="form-status" aria-live="polite">
          {status === 'demo' && (
            <div className="prepared-request"><p>Запрос подготовлен, но ещё не отправлен.</p><div className="prepared-actions"><button type="button" className="button secondary" onClick={copyRequest}>Скопировать текст</button><a className="button primary" href={`mailto:${site.email}?subject=${encodeURIComponent('Запрос с сайта АнТех Восток')}&body=${encodeURIComponent(prepared)}`}>Открыть почту →</a></div><p>{copyStatus}</p><label><span>Текст запроса</span><textarea readOnly rows={8} value={prepared}/></label></div>
          )}
          {status === 'success' && <p className="success">Заявка отправлена. Спасибо!</p>}
          {status === 'error' && (
            <p className="error">Не удалось отправить заявку. Данные остались в форме — попробуйте ещё раз позже.</p>
          )}
        </div>
      </form>
    </section>
  )
}
