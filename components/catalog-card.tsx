'use client'
import { useState } from 'react'
import Image from 'next/image'
import { AnchorArtwork } from './anchor-artwork'
import type { CatalogItem } from '@/lib/types'
import { configuredItemId, emptyDetails, safeDocumentUrl } from '@/lib/catalog'
import { useSelection } from './selection-provider'
import { CheckIcon, PlusIcon } from './icons'

export function CatalogCard({ item, index, preview = false }: { item: CatalogItem; index: number; preview?: boolean }) {
  const details = item.details ?? emptyDetails
  const [variant, setVariant] = useState('')
  const [length, setLength] = useState('')
  const [values,setValues] = useState<Record<string,string>>({})
  const [photo,setPhoto] = useState(0)
  const [error, setError] = useState('')
  const { toggle, has } = useSelection()
  const cleanLength = length.trim()
  const parameterConfiguration = item.parameters?.map(p=>values[p.id]?.trim()?`${p.label}: ${values[p.id].trim()}${p.unit?' '+p.unit:''}`:'').filter(Boolean).join(' · ')
  const id = item.parameters ? configuredItemId(item.id, JSON.stringify(item.parameters.map(p=>[p.id,values[p.id]?.trim()||''])), '') : configuredItemId(item.id, variant, cleanLength)
  const selected = has(id)
  const configuration = parameterConfiguration ?? [variant, cleanLength ? `Длина: ${cleanLength} мм` : ''].filter(Boolean).join(' · ')
  function add() {
    for(const p of item.parameters || []) {
      const value=values[p.id]?.trim()||''
      if(p.required&&!value){setError(`Заполните поле «${p.label}».`);return}
      if(value&&p.type==='number'&&(!Number.isFinite(Number(value))||(p.min!==undefined&&Number(value)<p.min)||(p.max!==undefined&&Number(value)>p.max))){setError(`Проверьте число в поле «${p.label}».`);return}
      if(value&&p.type==='select'&&!p.options.includes(value)){setError(`Выберите значение «${p.label}».`);return}
    }
    if (cleanLength && (!/^\d+$/.test(cleanLength) || Number(cleanLength) < 1 || Number(cleanLength) > 99999)) {
      setError('Укажите длину целым числом в миллиметрах.'); return
    }
    setError('')
    toggle({ ...item, id, configuration })
  }
  return <article className={`catalog-card ${item.item_type} visual-${index % 3}`}>
    <div className="catalog-card-topline"><span>{String(index + 1).padStart(2, '0')}</span><span>{item.item_type === 'product' ? 'Продукция' : 'Услуга'}</span></div>

    <h2>{item.title}</h2><p>{item.description}</p>
    {(details.specs.length > 0 || details.application || Boolean(item.photos?.length)) && <details className="product-details"><summary>{item.photos?.length ? 'Изображения и характеристики' : item.item_type === 'product' ? 'Характеристики и применение' : 'Что вы получите'}</summary>
{item.photos?.length ? <div className="product-photos">{item.photos[Math.min(photo,item.photos.length-1)].url==='/images/anchor-sheet.webp'?<AnchorArtwork compact/>:<Image unoptimized src={item.photos[Math.min(photo,item.photos.length-1)].url} alt={item.photos[Math.min(photo,item.photos.length-1)].alt||item.title} width={600} height={360}/>}{item.photos.length>1&&<div className="photo-switcher">{item.photos.map((p,i)=><button type="button" key={p.url} aria-label={`Фото ${i+1}`} aria-pressed={i===photo} onClick={()=>setPhoto(i)}>{i+1}</button>)}</div>}</div> : item.item_type === 'product' && !item.parameters && <div className="catalog-card-visual" aria-hidden="true"><span/><i/></div>}
      {details.specs.length > 0 && <dl className="spec-list">{details.specs.map(s => <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}</dl>}
      {details.application && <p>{details.application}</p>}
    </details>}
    {details.documents.filter(d => safeDocumentUrl(d.url)).map(d => <a key={d.url} className="text-link" href={d.url}>{d.title} · PDF</a>)}
    <div className="card-config">
      {item.parameters?.map(p=><label key={p.id}><span>{p.label}{p.unit?`, ${p.unit}`:''}{p.required?' *':''}</span>{p.type==='select'?<select value={values[p.id]||''} onChange={e=>setValues(v=>({...v,[p.id]:e.target.value}))}><option value="">Подобрать</option>{p.options.map(o=><option key={o}>{o}</option>)}</select>:<input type={p.type==='number'?'number':'text'} step="any" min={p.min} max={p.max} maxLength={120} value={values[p.id]||''} onChange={e=>setValues(v=>({...v,[p.id]:e.target.value}))}/>} {p.hint&&<small>{p.hint}</small>}</label>)}
      {!item.parameters && details.variants.length > 0 && <label><span>Исполнение</span><select value={variant} onChange={e => setVariant(e.target.value)}><option value="">Подобрать</option>{details.variants.map(v => <option key={v}>{v}</option>)}</select></label>}
      {!item.parameters && details.length && <label><span>Длина, мм</span><input inputMode="numeric" value={length} onChange={e => setLength(e.target.value)} placeholder="Например, 1800" maxLength={5}/><small>600–3000 мм; другие длины — по согласованию</small></label>}
    </div>
    {error && <p className="field-error" role="alert">{error}</p>}
    <button className={`add-button ${selected ? 'selected' : ''}`} type="button" disabled={preview} onClick={add} aria-pressed={selected}>{selected ? <CheckIcon/> : <PlusIcon/>}{selected ? 'В заявке · убрать' : 'Добавить в заявку'}</button>
  </article>
}
