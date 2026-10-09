import type { Metadata } from 'next'
import '@fontsource-variable/onest'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { SelectionProvider } from '@/components/selection-provider'
import { site } from '@/content/site'
import './globals.css'

const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL

export const metadata: Metadata = {
  metadataBase: configuredUrl ? new URL(configuredUrl) : undefined,
  title: {
    default: 'АнТех Восток — решения для крепления горных выработок',
    template: '%s — АнТех Восток',
  },
  description: site.description,
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: site.name,
    title: 'АнТех Восток — решения для крепления горных выработок',
    description: site.description,
  },
  robots: configuredUrl ? { index: true, follow: true } : { index: false, follow: false },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: site.name,
  alternateName: site.logoName,
  description: site.description,
  ...(configuredUrl ? { url: configuredUrl } : {}),
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <SelectionProvider>
          <a className="skip-link" href="#main-content">Перейти к содержимому</a>
          <Header />
          <main id="main-content">{children}</main>
          <Footer />
        </SelectionProvider>
      </body>
    </html>
  )
}
