'use client'
import { useState } from 'react'
import type { CatalogItem } from '@/lib/types'
import { configuredItemId, emptyDetails, safeDocumentUrl } from '@/lib/catalog'
import { useSelection } from './selection-provider'
import { CheckIcon, PlusIcon } from './icons'

export function CatalogCard({ item, index }: { item: CatalogItem; index: number }) {
  const details = item.details ?? emptyDetails
  const [variant, setVariant] = useState('')
  const [length, setLength] = useState('')
  const [error, setError] = useState('')
  const { toggle, has } = useSelection()
  const cleanLength = length.trim()
  const id = configuredItemId(item.id, variant, cleanLength)
  const selected = has(id)
  const configuration = [variant, cleanLength ? `Длина: ${cleanLength} мм` : ''].filter(Boolean).join(' · ')
  function add() {
    if (cleanLength && (!/^\d+$/.test(cleanLength) || Number(cleanLength) < 1 || Number(cleanLength) > 99999)) {
      setError('Укажите длину целым числом в миллиметрах.'); return
    }
    setError('')
    toggle({ ...item, id, configuration })
  }
  return <article className={`catalog-card ${item.item_type} visual-${index % 3}`}>
    <div className="catalog-card-topline"><span>{String(index + 1).padStart(2, '0')}</span><span>{item.item_type === 'product' ? 'Продукция' : 'Услуга'}</span></div>
    {item.item_type === 'product' && <div className="catalog-card-visual" aria-hidden="true"><span/><i/></div>}
    <h2>{item.title}</h2><p>{item.description}</p>
    {(details.specs.length > 0 || details.application) && <details className="product-details"><summary>{item.item_type === 'product' ? 'Характеристики и применение' : 'Что вы получите'}</summary>
      {details.specs.length > 0 && <dl className="spec-list">{details.specs.map(s => <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}</dl>}
      {details.application && <p>{details.application}</p>}
    </details>}
    {details.documents.filter(d => safeDocumentUrl(d.url)).map(d => <a key={d.url} className="text-link" href={d.url}>{d.title} · PDF</a>)}
    <div className="card-config">
      {details.variants.length > 0 && <label><span>Исполнение</span><select value={variant} onChange={e => setVariant(e.target.value)}><option value="">Подобрать</option>{details.variants.map(v => <option key={v}>{v}</option>)}</select></label>}
      {details.length && <label><span>Длина, мм</span><input inputMode="numeric" value={length} onChange={e => setLength(e.target.value)} placeholder="Например, 1800" maxLength={5}/><small>600–3000 мм; другие длины — по согласованию</small></label>}
    </div>
    {error && <p className="field-error" role="alert">{error}</p>}
    <button className={`add-button ${selected ? 'selected' : ''}`} type="button" onClick={add} aria-pressed={selected}>{selected ? <CheckIcon/> : <PlusIcon/>}{selected ? 'В заявке · убрать' : 'Добавить в заявку'}</button>
  </article>
}
