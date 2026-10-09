'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { navigation } from '@/content/site'
import { useSelection } from './selection-provider'
import { CloseIcon, MenuIcon } from './icons'

export function Header() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { selected } = useSelection()

  return (
    <header className="site-header" onKeyDown={event => { if (event.key === 'Escape') { setOpen(false); document.querySelector<HTMLButtonElement>('.menu-button')?.focus() } }}>
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="АнТех Восток — на главную">
          <Image
            src="/anteh-logo.webp"
            alt="Анкерные технологии Восток"
            width={226}
            height={71}
            priority
            className="brand-image"
          />
        </Link>

        <nav className="desktop-nav" aria-label="Основная навигация">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={(item.href === '/' ? pathname === '/' : pathname.startsWith(item.href.slice(0, -1))) ? 'page' : undefined}
              className={(item.href === '/' ? pathname === '/' : pathname.startsWith(item.href.slice(0, -1))) ? 'active' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link href="/catalog/#request" className="header-request">
          Заявка
          {selected.length > 0 && <span aria-label={`Выбрано позиций: ${selected.length}`}>{selected.length}</span>}
        </Link>

        <button
          className="menu-button"
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      <nav
        id="mobile-navigation"
        className={`mobile-nav ${open ? 'open' : ''}`}
        aria-label="Мобильная навигация"
      >
        {navigation.map((item) => (
          <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
            {item.label}
          </Link>
        ))}
        <Link href="/catalog/#request" onClick={() => setOpen(false)}>
          Заявка{selected.length > 0 ? ` · ${selected.length}` : ''}
        </Link>
      </nav>
    </header>
  )
}
