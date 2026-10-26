import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { PageHero } from '@/components/page-hero'
export const metadata: Metadata = { title: 'Производство', description: 'Серийное производство анкерной крепи и опорных плит в Хабаровске.' }
const stages = [
 ['Подготовка сырья', 'Приём и подготовка металлического сырья для производства.'],
 ['Формирование профиля', 'Изготовление трубчатого профиля анкера с продольной прорезью.'],
 ['Размер и комплектация', 'Резка анкеров в требуемую длину и изготовление опорных плит.'],
 ['Защитное покрытие', 'Подготовка антикоррозийного исполнения в соответствии с заказом.'],
 ['Контроль качества', 'Проверка геометрии, поверхности и механических характеристик.'],
 ['Подготовка к отгрузке', 'Маркировка, комплектование и упаковка готовой продукции.'],
]
export default function ProductionPage() {
 return <><PageHero eyebrow="Хабаровск · собственное производство" title="От металлического сырья до комплекта крепи"><p>Автоматизированная линия для серийного выпуска трубчатых фрикционных анкеров и опорных плит.</p></PageHero>
 <section className="section production-feature"><div className="container split-heading"><div><p className="eyebrow">Производственные возможности</p><h2><span className="capacity-number">До 80 000</span><span className="capacity-unit">комплектов в месяц</span></h2></div><div className="large-copy"><p>Комплект включает фрикционный трубчатый анкер и опорную плиту. Производство ориентировано на повторяемость параметров и выпуск продукции под задачи горнодобывающих предприятий.</p><Link className="text-link" href="/catalog/">Продукция и исполнения →</Link></div></div></section>
 <section className="section production-gallery-section"><div className="container"><div className="section-heading"><div><p className="eyebrow">Производство</p><h2>Оборудование и продукция</h2></div><p>Фотографии производственного участка.</p></div><div className="production-gallery">
  <figure><Image src="/images/production-close.webp" alt="Металлические изделия и оборудование на производстве" fill sizes="(max-width: 760px) 100vw, 33vw"/><figcaption>Изделия на производственной линии</figcaption></figure>
  <figure><Image src="/images/production-line.webp" alt="Оборудование на производственном участке" fill sizes="(max-width: 760px) 100vw, 33vw"/><figcaption>Производственный участок</figcaption></figure>
  <figure><Image src="/images/production-equipment.webp" alt="Крупный план производственного оборудования" fill sizes="(max-width: 760px) 100vw, 33vw"/><figcaption>Производственное оборудование</figcaption></figure>
 </div></div></section>
 <section className="section light-industrial-section"><div className="container"><div className="section-heading"><div><p className="eyebrow">Процесс</p><h2>Шесть этапов производства</h2></div></div><div className="production-placeholders">{stages.map(([title,text],i)=><article key={title}><span>0{i+1}</span><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
 <section className="section production-feature"><div className="container split-heading"><div><p className="eyebrow">Контроль качества</p><h2>Проверка на каждом этапе</h2></div><div className="large-copy"><p>Приёмочный и периодический контроль включает геометрические параметры, поверхность стержней, покрытие, механические свойства, несущую способность и упаковку.</p><p>Изготовление ТФА — по ТУ-25.11.23.112-001-62179877-2026.</p><Link className="button primary" href="/catalog/#request">Обсудить комплектацию →</Link></div></div></section></>
}
