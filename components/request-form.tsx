'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { serializeSelectedItems } from '@/lib/selection'
import { CloseIcon } from './icons'
import { useSelection } from './selection-provider'

type FormStatus = 'idle' | 'sending' | 'success' | 'error' | 'demo'

const endpoint = process.env.NEXT_PUBLIC_FORM_ENDPOINT

export function RequestForm() {
  const { selected, remove, setAmount, clear } = useSelection()
  const [status, setStatus] = useState<FormStatus>('idle')
  const [contactError, setContactError] = useState('')

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

    setContactError('')
    formData.set('_subject', 'Новая заявка с сайта «Антех Восток»')
    formData.set('Состав заявки', serializeSelectedItems(selected))

    if (!endpoint) {
      setStatus('demo')
      return
    }

    setStatus('sending')
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      })
      if (!response.ok) throw new Error(`Ошибка отправки: ${response.status}`)
      form.reset()
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

      <form className="request-form" onSubmit={handleSubmit}>
        <div className="form-section-heading">
          <span>01</span>
          <div>
            <h3>Состав заявки</h3>
            <p>Описания не повторяются — только выбранные позиции и необходимый объём.</p>
          </div>
        </div>

        {selected.length === 0 ? (
          <div className="selection-empty">
            <p>Позиции не выбраны</p>
            <span>Форма будет отправлена как запрос на общую консультацию.</span>
          </div>
        ) : (
          <div className="selected-list">
            {selected.map((item) => (
              <div className="selected-row" key={item.id}>
                <div className="selected-item-name">
                  <span>{item.item_type === 'product' ? 'Продукция' : 'Услуга'}</span>
                  <strong>{item.title}</strong>
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
            <p>Поля со звёздочкой обязательны.</p>
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
            {status === 'sending' ? 'Отправляем…' : 'Отправить заявку'}
          </button>
          <p>Пароль от корпоративной почты сайту не требуется.</p>
        </div>

        <div className="form-status" aria-live="polite">
          {status === 'demo' && (
            <p className="demo">Отправка пока не подключена. Введённые данные сохранены в форме.</p>
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
