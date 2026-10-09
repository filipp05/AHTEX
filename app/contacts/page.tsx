import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowIcon } from '@/components/icons'
import { PageHero } from '@/components/page-hero'

export const metadata: Metadata = {
  title: 'Контакты',
  description: 'Контакты компании «Антех Восток» и форма обращения.',
}

export default function ContactsPage() {
  return (
    <>
      <PageHero eyebrow="Связаться с нами" title="Контакты">
        <p>Подтверждённые телефон, электронная почта, адрес и режим работы будут добавлены перед публикацией.</p>
      </PageHero>
      <section className="section">
        <div className="container contacts-grid">
          <div className="contact-placeholder">
            <span>Телефон</span><strong>Ожидается от заказчика</strong>
          </div>
          <div className="contact-placeholder">
            <span>Электронная почта</span><strong>Ожидается от заказчика</strong>
          </div>
          <div className="contact-placeholder">
            <span>Адрес</span><strong>Ожидается от заказчика</strong>
          </div>
          <div className="contact-placeholder">
            <span>Режим работы</span><strong>Ожидается от заказчика</strong>
          </div>
        </div>
        <div className="container contact-action">
          <div><p className="eyebrow">Обратная связь</p><h2>Форма заявки уже подготовлена</h2></div>
          <Link className="button primary" href="/catalog/#request">Перейти к форме <ArrowIcon /></Link>
        </div>
      </section>
    </>
  )
}
