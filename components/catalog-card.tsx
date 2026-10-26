'use client'
import { useState } from 'react'
import Image from 'next/image'
import type { CatalogItem, CatalogParameter } from '@/lib/types'
import { configuredItemId, emptyDetails, safeDocumentUrl } from '@/lib/catalog'
import { useSelection } from './selection-provider'
import { CheckIcon, PlusIcon } from './icons'

export function CatalogCard({ item, index, preview = false }: { item: CatalogItem; index: number; preview?: boolean }) {
  const details = item.details ?? emptyDetails
  const parameters = item.parameters ?? []
  const modalParameters = parameters.filter(p => p.presentation === 'modal')
  const inlineParameters = parameters.filter(p => p.presentation !== 'modal')
  const [variant, setVariant] = useState('')
  const [length, setLength] = useState('')
  const [values, setValues] = useState<Record<string, string>>({})
  const [photo, setPhoto] = useState(0)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const { toggle, has } = useSelection()
  const cleanLength = length.trim()

  function configurationFor(nextValues: Record<string, string>) {
    return parameters.map(p => {
      const value = nextValues[p.id]?.trim()
      return value ? `${p.label}: ${value}${p.unit ? ` ${p.unit}` : ''}` : ''
    }).filter(Boolean).join(' · ')
  }
  const id = parameters.length
    ? configuredItemId(item.id, JSON.stringify(parameters.map(p => [p.id, values[p.id]?.trim() || ''])), '')
    : configuredItemId(item.id, variant, cleanLength)
  const selected = has(id)
  const configuration = parameters.length
    ? configurationFor(values)
    : [variant, cleanLength ? `Длина: ${cleanLength} мм` : ''].filter(Boolean).join(' · ')

  function validateParameter(p: CatalogParameter, raw: string) {
    const value = raw.trim()
    if (p.required && !value) return `Заполните поле «${p.label}».`
    if (value && p.type === 'number' && (!Number.isFinite(Number(value)) || (p.min !== undefined && Number(value) < p.min) || (p.max !== undefined && Number(value) > p.max))) return `Проверьте число в поле «${p.label}».`
    if (value && p.type === 'select' && !p.options.includes(value)) return `Выберите значение «${p.label}».`
    if (value && value.length > 300) return `Сократите значение в поле «${p.label}».`
    return ''
  }
  function addConfigured(nextValues: Record<string, string>) {
    for (const p of parameters) {
      const message = validateParameter(p, nextValues[p.id] || '')
      if (message) { setError(message); return }
    }
    if (cleanLength && (!/^\d+$/.test(cleanLength) || Number(cleanLength) < 1 || Number(cleanLength) > 99999)) {
      setError('Укажите длину целым числом в миллиметрах.'); return
    }
    const nextConfiguration = parameters.length ? configurationFor(nextValues) : [variant, cleanLength ? `Длина: ${cleanLength} мм` : ''].filter(Boolean).join(' · ')
    const nextId = parameters.length
      ? configuredItemId(item.id, JSON.stringify(parameters.map(p => [p.id, nextValues[p.id]?.trim() || ''])), '')
      : configuredItemId(item.id, variant, cleanLength)
    setError('')
    toggle({ ...item, id: nextId, configuration: nextConfiguration })
    setModalOpen(false)
  }
  function add() {
    if (selected) { toggle({ ...item, id, configuration }); return }
    for (const p of inlineParameters) {
      const message = validateParameter(p, values[p.id] || '')
      if (message) { setError(message); return }
    }
    setError('')
    if (modalParameters.length) setModalOpen(true)
    else addConfigured(values)
  }

  return <article className={`catalog-card ${item.item_type} visual-${index % 3}`}>
    <div className="catalog-card-topline"><span>{String(index + 1).padStart(2, '0')}</span><span>{item.item_type === 'product' ? 'Продукция' : 'Услуга'}</span></div>
    {item.photos?.length ? <div className="product-photos"><Image unoptimized src={item.photos[Math.min(photo,item.photos.length-1)].url} alt={item.photos[Math.min(photo,item.photos.length-1)].alt||item.title} width={600} height={360}/>{item.photos.length>1&&<div className="photo-switcher">{item.photos.map((p,i)=><button type="button" key={p.url} aria-label={`Фото ${i+1}`} aria-pressed={i===photo} onClick={()=>setPhoto(i)}>{i+1}</button>)}</div>}</div> : item.item_type === 'product' && !parameters.length && <div className="catalog-card-visual" aria-hidden="true"><span/><i/></div>}
    <h2>{item.title}</h2><p>{item.description}</p>
    {(details.specs.length > 0 || details.application) && <details className="product-details" open={item.item_type === 'product'}><summary>{item.item_type === 'product' ? 'Характеристики и применение' : 'Что вы получите'}</summary>
      {details.specs.length > 0 && <dl className="spec-list">{details.specs.map(s => <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}</dl>}
      {details.application && <p>{details.application}</p>}
    </details>}
    {details.documents.filter(d => safeDocumentUrl(d.url)).map(d => <a key={d.url} className="text-link" href={d.url}>{d.title} · PDF</a>)}
    <div className="card-config">
      {inlineParameters.map(p=><label key={p.id}><span>{p.label}{p.unit?`, ${p.unit}`:''}{p.required?' *':''}</span>{p.type==='select'?<select value={values[p.id]||''} onChange={e=>setValues(v=>({...v,[p.id]:e.target.value}))}><option value="">Подобрать</option>{p.options.map(o=><option key={o}>{o}</option>)}</select>:<input type={p.type==='number'?'number':'text'} step="any" min={p.min} max={p.max} maxLength={300} value={values[p.id]||''} onChange={e=>setValues(v=>({...v,[p.id]:e.target.value}))} placeholder={p.hint||undefined}/>} {p.hint&&p.type==='select'&&<small>{p.hint}</small>}</label>)}
      {!parameters.length && details.variants.length > 0 && <label><span>Исполнение</span><select value={variant} onChange={e => setVariant(e.target.value)}><option value="">Подобрать</option>{details.variants.map(v => <option key={v}>{v}</option>)}</select></label>}
      {!parameters.length && details.length && <label><span>Длина, мм</span><input inputMode="numeric" value={length} onChange={e => setLength(e.target.value)} placeholder="Например, 1800" maxLength={5}/><small>600–3000 мм; другие длины — по согласованию</small></label>}
      {modalParameters.length>0&&<p className="parameter-hint">Размеры укажите при добавлении позиции в заявку.</p>}
    </div>
    {error && <p className="field-error" role="alert">{error}</p>}
    <button className={`add-button ${selected ? 'selected' : ''}`} type="button" disabled={preview} onClick={add} aria-pressed={selected}>{selected ? <CheckIcon/> : <PlusIcon/>}{selected ? 'В заявке · убрать' : 'Добавить в заявку'}</button>
    {modalOpen&&<div className="parameter-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModalOpen(false)}}><div className="parameter-modal" role="dialog" aria-modal="true" aria-labelledby={`parameter-title-${item.id}`}><button className="parameter-modal-close" type="button" aria-label="Закрыть" onClick={()=>setModalOpen(false)}>×</button><p className="eyebrow">Параметры заявки</p><h3 id={`parameter-title-${item.id}`}>{item.title}</h3><p>Укажите параметры вручную. Готовых вариантов нет.</p>{modalParameters.map(p=><label className="parameter-modal-field" key={p.id}><span>{p.label}{p.unit?`, ${p.unit}`:''}{p.required?' *':''}</span>{p.multiline?<textarea autoFocus rows={3} maxLength={300} value={values[p.id]||''} onChange={e=>setValues(v=>({...v,[p.id]:e.target.value}))} placeholder={p.hint||'Введите размеры'}/>:<input autoFocus type={p.type==='number'?'number':'text'} step="any" maxLength={300} value={values[p.id]||''} onChange={e=>setValues(v=>({...v,[p.id]:e.target.value}))} placeholder={p.hint}/>}</label>)}{error&&<p className="field-error" role="alert">{error}</p>}<div className="parameter-modal-actions"><button className="button secondary" type="button" onClick={()=>setModalOpen(false)}>Отмена</button><button className="button primary" type="button" onClick={()=>addConfigured(values)}>Добавить в заявку</button></div></div></div>}
  </article>
}
