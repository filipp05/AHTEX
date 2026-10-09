import Image from 'next/image'
import Link from 'next/link'
import { navigation, site } from '@/content/site'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <div className="footer-brand">
            <Image src="/anteh-logo.png" alt="Анкерные технологии Восток" width={226} height={75} />
          </div>
          <p className="footer-description">{site.description}</p>
        </div>
        <div>
          <p className="footer-title">Разделы</p>
          <nav className="footer-links" aria-label="Навигация в подвале">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href}>{item.label}</Link>
            ))}
          </nav>
        </div>
        <div>
          <p className="footer-title">Связаться</p>
          <p className="footer-muted">Контакты будут опубликованы после подтверждения заказчиком.</p>
          <Link className="text-link light" href="/catalog/#request">Оставить заявку →</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} {site.name}</span>
        <Link href="/privacy/">Обработка персональных данных</Link>
        <Link href="/admin/" className="admin-link">Управление сайтом</Link>
      </div>
    </footer>
  )
}
