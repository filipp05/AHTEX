'use client'

import { useEffect, useMemo, useState } from 'react'
import { fallbackCatalog } from '@/lib/fallback-catalog'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type { CatalogItem, CatalogItemType } from '@/lib/types'
import { CatalogCard } from './catalog-card'
import { parseDetails } from '@/lib/catalog'
import { useSelection } from './selection-provider'

const labels: Record<CatalogItemType, string> = {
  product: 'Продукция',
  service: 'Услуги',
}

export function CatalogView() {
  const [activeType, setActiveType] = useState<CatalogItemType>('product')
  const [items, setItems] = useState<CatalogItem[]>(fallbackCatalog)
  const [loading, setLoading] = useState(isSupabaseConfigured())
  const [notice, setNotice] = useState('')
  const { selected } = useSelection()

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) return

    let active = true
    supabase
      .from('catalog_items')
      .select('*')
      .order('created_at', { ascending: true })
      .retry(false)
      .abortSignal(AbortSignal.timeout(8000))
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setNotice('Не удалось обновить каталог. Показана сохранённая базовая версия.')
        } else if (data) {
          try { setItems(data.map(item => ({ ...item, details: parseDetails(item.details) })) as CatalogItem[]) } catch { setNotice('Не удалось обновить каталог. Показана сохранённая версия.') }
        }
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const visibleItems = useMemo(
    () => items.filter((item) => item.item_type === activeType),
    [activeType, items],
  )

  return (
    <>
      <div className="catalog-toolbar" role="group" aria-label="Вид каталога">
        {(Object.keys(labels) as CatalogItemType[]).map((type) => (
          <button
            key={type}
            type="button"
            aria-pressed={activeType === type}
            className={activeType === type ? 'active' : ''}
            onClick={() => setActiveType(type)}
          >
            {labels[type]}
            <span>{items.filter((item) => item.item_type === type).length}</span>
          </button>
        ))}
      </div>

      {notice && <p className="inline-notice" role="status">{notice}</p>}
      {loading && <p className="catalog-loading" role="status">Обновляем каталог…</p>}

      {!loading && visibleItems.length === 0 ? (
        <div className="catalog-empty">
          <p className="eyebrow">Раздел готов</p>
          <h2>Перечень {activeType === 'service' ? 'услуг' : 'продукции'} уточняется</h2>
          <p>
            Уточните необходимую продукцию или услугу в обращении — поможем с подбором.
          </p>
          <a className="button secondary" href="#request">Перейти к форме</a>
        </div>
      ) : (
        <div className="catalog-grid">
          {visibleItems.map((item, index) => <CatalogCard key={item.id} item={item} index={index} />)}
        </div>
      )}

      {selected.length > 0 && (
        <div className="selection-dock" role="region" aria-label="Состав заявки">
          <div>
            <span className="selection-count">{selected.length}</span>
            <span>
              {selected.length === 1 ? 'позиция выбрана' : selected.length % 10 >= 2 && selected.length % 10 <= 4 && (selected.length % 100 < 12 || selected.length % 100 > 14) ? 'позиции выбраны' : 'позиций выбрано'}
            </span>
          </div>
          <a href="#request" className="button primary">Перейти к заявке</a>
        </div>
      )}
    </>
  )
}
