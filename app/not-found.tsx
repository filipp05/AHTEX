import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="not-found">
      <div><span>404</span><h1>Такой страницы нет</h1><p>Вернитесь на главную или перейдите в каталог.</p>
        <div className="hero-actions"><Link className="button accent" href="/">На главную</Link><Link className="button secondary" href="/catalog/">В каталог</Link></div>
      </div>
    </section>
  )
}
