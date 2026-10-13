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
    </div>
    <div className="container contact-bottom">
      <div className="contact-action"><p className="eyebrow">Коммерческое предложение</p><h2>Обсудим вашу задачу</h2><p className="contact-action-copy">Укажите нужную продукцию и объём — подготовим предложение по вашей заявке.</p><Link className="button primary" href="/catalog/#request">Составить заявку →</Link></div>
      <section className="company-details" aria-labelledby="company-details-title"><h2 id="company-details-title">Реквизиты компании</h2><p className="company-name">{site.legalName}</p><dl><div><dt>ИНН</dt><dd>{site.inn}</dd></div><div><dt>КПП</dt><dd>{site.kpp}</dd></div><div><dt>ОГРН</dt><dd>{site.ogrn}</dd></div><div><dt>Юридический адрес</dt><dd>{site.legalAddress}</dd></div></dl></section>
    </div></section></>
}
