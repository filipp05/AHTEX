import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowIcon } from '@/components/icons'
import { PageHero } from '@/components/page-hero'
import { TechnicalVisual } from '@/components/technical-visual'

export const metadata: Metadata = {
  title: 'Производство',
  description: 'Раздел о производстве и возможностях компании «Антех Восток».',
}

export default function ProductionPage() {
  return (
    <>
      <PageHero eyebrow="Собственная база" title="Производство">
        <p>Здесь будут опубликованы только подтверждённые сведения о производстве компании.</p>
      </PageHero>
      <section className="section">
        <div className="container production-grid">
          <TechnicalVisual label="Ожидаются фотографии производственной площадки" />
          <div className="production-copy">
            <p className="eyebrow">Материалы готовятся</p>
            <h2>Покажем производство без рекламных выдумок</h2>
            <p>
              Заказчик предоставит фотографии продукции, производства и объектов, а также исходную
              техническую информацию. После подтверждения здесь появятся реальные этапы работ,
              оборудование и возможности предприятия.
            </p>
          </div>
        </div>
      </section>
      <section className="section light-industrial-section">
        <div className="container">
          <div className="section-heading">
            <div><p className="eyebrow">Что будет раскрыто</p><h2>Структура будущего раздела</h2></div>
          </div>
          <div className="production-placeholders">
            {[
              ['01', 'Производственная площадка', 'Описание и фотографии после передачи заказчиком.'],
              ['02', 'Этапы производства', 'Только подтверждённая последовательность работ.'],
              ['03', 'Контроль качества', 'Факты и документы, которые разрешено публиковать.'],
            ].map(([number, title, text]) => (
              <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>
            ))}
          </div>
          <div className="center-action">
            <Link className="button primary" href="/catalog/#request">Обсудить задачу <ArrowIcon /></Link>
          </div>
        </div>
      </section>
    </>
  )
}
