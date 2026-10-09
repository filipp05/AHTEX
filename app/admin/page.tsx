import type { Metadata } from 'next'
import { AdminPanel } from '@/components/admin-panel'
import { PageHero } from '@/components/page-hero'

export const metadata: Metadata = {
  title: 'Управление каталогом',
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return (
    <>
      <PageHero eyebrow="Закрытый раздел" title="Управление каталогом">
        <p>Создание и редактирование продукции и услуг доступно только разрешённым сотрудникам.</p>
      </PageHero>
      <section className="section admin-section"><div className="container"><AdminPanel /></div></section>
    </>
  )
}
