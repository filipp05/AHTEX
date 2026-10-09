import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowIcon, FileIcon } from '@/components/icons'
import { PageHero } from '@/components/page-hero'

export const metadata: Metadata = {
  title: 'Техническая документация',
  description: 'Технические документы, каталоги и сертификаты продукции «Антех Восток».',
}

export default function DocumentsPage() {
  return (
    <>
      <PageHero eyebrow="Технический раздел" title="Документация">
        <p>Каталоги, паспорта, сертификаты и чертежи будут опубликованы после передачи и разрешения заказчика.</p>
      </PageHero>
      <section className="section">
        <div className="container documents-empty">
          <span className="document-icon"><FileIcon /></span>
          <p className="eyebrow">Файлы готовятся</p>
          <h2>Нужен конкретный документ?</h2>
          <p>
            Отправьте запрос через форму. В типе обращения выберите «Запрос документации» и опишите,
            какой материал вам требуется.
          </p>
          <Link className="button accent" href="/catalog/#request">Запросить документацию <ArrowIcon /></Link>
        </div>
      </section>
    </>
  )
}
