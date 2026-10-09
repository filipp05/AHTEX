'use client'

import { useMemo, useState } from 'react'
import { catalogItems } from '@/lib/static-catalog'
import type { CatalogItemType } from '@/lib/types'
import { CatalogCard } from './catalog-card'
import { useSelection } from './selection-provider'

const labels: Record<CatalogItemType, string> = {
  product: 'Продукция',
  service: 'Услуги',
}

export function CatalogView() {
  const [activeType, setActiveType] = useState<CatalogItemType>('product')
  const items = catalogItems
  const { selected } = useSelection()

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

      {visibleItems.length === 0 ? (
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
