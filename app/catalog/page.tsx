import type { Metadata } from 'next'
import { CatalogView } from '@/components/catalog-view'
import { PageHero } from '@/components/page-hero'
import { RequestForm } from '@/components/request-form'

export const metadata: Metadata = {
  title: 'Продукция и услуги',
  description: 'Единый каталог продукции и услуг «Антех Восток» с возможностью собрать заявку.',
}

export default function CatalogPage() {
  return (
    <>
      <PageHero eyebrow="Единый каталог" title="Продукция и услуги">
        <p>
          Выберите одну или несколько позиций. Они попадут в общую заявку — переписывать названия
          и описания вручную не потребуется.
        </p>
      </PageHero>
      <section className="section catalog-section">
        <div className="container">
          <CatalogView />
        </div>
      </section>
      <RequestForm />
    </>
  )
}
