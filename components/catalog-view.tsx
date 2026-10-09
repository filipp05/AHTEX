'use client'

import { useEffect, useMemo, useState } from 'react'
import { fallbackCatalog } from '@/lib/fallback-catalog'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type { CatalogItem, CatalogItemType } from '@/lib/types'
import { CheckIcon, PlusIcon } from './icons'
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
  const { selected, toggle, has } = useSelection()

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) return

    let active = true
    supabase
      .from('catalog_items')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setNotice('Не удалось обновить каталог. Показана сохранённая базовая версия.')
        } else if (data) {
          setItems(data as CatalogItem[])
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
      <div className="catalog-toolbar" role="tablist" aria-label="Вид каталога">
        {(Object.keys(labels) as CatalogItemType[]).map((type) => (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={activeType === type}
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
            Здесь появятся только подтверждённые заказчиком позиции. Общую техническую консультацию
            уже можно запросить в форме ниже.
          </p>
          <a className="button secondary" href="#request">Перейти к форме</a>
        </div>
      ) : (
        <div className="catalog-grid">
          {visibleItems.map((item, index) => {
            const selectedItem = has(item.id)
            return (
              <article className={`catalog-card ${item.item_type} visual-${index % 3}`} key={item.id}>
                <div className="catalog-card-topline">
                  <span>{activeType === 'product' ? 'П' : 'У'}—{String(index + 1).padStart(2, '0')}</span>
                  <span>{labels[item.item_type]}</span>
                </div>
                <div className="catalog-card-visual" aria-hidden="true">
                  <span />
                  <i />
                </div>
                <div>
                  <h2>{item.title}</h2>
                  <p>{item.description}</p>
                </div>
                <button
                  type="button"
                  className={`add-button ${selectedItem ? 'selected' : ''}`}
                  onClick={() => toggle(item)}
                  aria-pressed={selectedItem}
                >
                  {selectedItem ? <CheckIcon /> : <PlusIcon />}
                  {selectedItem ? 'В заявке' : 'Добавить в заявку'}
                </button>
              </article>
            )
          })}
        </div>
      )}

      {selected.length > 0 && (
        <div className="selection-dock" role="region" aria-label="Состав заявки">
          <div>
            <span className="selection-count">{selected.length}</span>
            <span>
              {selected.length === 1 ? 'позиция выбрана' : selected.length < 5 ? 'позиции выбраны' : 'позиций выбрано'}
            </span>
          </div>
          <a href="#request" className="button primary">Перейти к заявке</a>
        </div>
      )}
    </>
  )
}
