import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHero } from '@/components/page-hero'
import { site } from '@/content/site'
export const metadata: Metadata = { title: 'Контакты' }
export default function ContactsPage() {
  return <><PageHero eyebrow="Обсудим вашу задачу" title="На связи с производством"><p>Подбор продукции, комплектация и коммерческие предложения.</p></PageHero>
    <section className="section"><div className="container contacts-grid">
      <a className="contact-placeholder" href={site.phoneHref}><span className="contact-label">Позвонить<span className="contact-arrow" aria-hidden="true">↗</span></span><strong>{site.phone}</strong></a>
      <a className="contact-placeholder" href={`mailto:${site.email}`}><span className="contact-label">Написать нам<span className="contact-arrow" aria-hidden="true">↗</span></span><strong>{site.email}</strong></a>
    </div><div className="container contact-action"><div><p className="eyebrow">Коммерческое предложение</p><h2>Соберите свой запрос</h2><p>Выберите продукцию, исполнение и необходимый объём.</p></div><Link className="button primary" href="/catalog/#request">Перейти к заявке →</Link></div>
    <div className="container company-details"><h2>Реквизиты</h2><p>{site.legalName}</p><dl><div><dt>ИНН</dt><dd>{site.inn}</dd></div><div><dt>КПП</dt><dd>{site.kpp}</dd></div><div><dt>ОГРН</dt><dd>{site.ogrn}</dd></div><div><dt>Юридический адрес</dt><dd>{site.legalAddress}</dd></div></dl></div></section></>
}
