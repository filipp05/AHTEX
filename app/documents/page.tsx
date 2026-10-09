import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHero } from '@/components/page-hero'
import { site } from '@/content/site'
export const metadata: Metadata = { title: 'Документация' }
export default function DocumentsPage() {
 return <><PageHero eyebrow="Для специалистов" title="Техническая документация"><p>Документы для подбора продукции и подготовки проекта.</p></PageHero>
 <section className="section"><div className="container document-list"><article><span className="eyebrow">Нормативный документ</span><h2>Технические условия ТФА</h2><p className="document-number">ТУ-25.11.23.112-001-62179877-2026</p><p>Трубчатая фрикционная анкерная крепь с опорной плитой. На сайте приведено обозначение ТУ.</p></article>
 <article><span className="eyebrow">По запросу</span><h2>Паспорта, сертификат и чертежи</h2><p>Файлы для скачивания пока не опубликованы. Укажите продукцию и нужный документ в обращении.</p><a className="button secondary" href={`mailto:${site.email}?subject=${encodeURIComponent('Запрос технической документации')}`}>Запросить по почте →</a><Link className="text-link" href="/catalog/#request">Добавить к заявке</Link></article></div></section></>
}
