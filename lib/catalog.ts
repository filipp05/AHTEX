import type { CatalogDetails, CatalogItem } from './types'
export const emptyDetails: CatalogDetails = { specs: [], variants: [], length: false, application: '', documents: [] }
export function safeDocumentUrl(value: string): boolean {
  return (/^\/files\/[a-zA-Z0-9_/-]+\.pdf$/.test(value) || /^\/media\/[a-f0-9-]+\.pdf$/.test(value)) && !value.includes('..')
}
export function parseDetails(value: unknown): CatalogDetails {
  if (value == null) return { ...emptyDetails }
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error('Некорректные характеристики')
  const d = value as Record<string, unknown>
  const text = (v: unknown, max: number) => typeof v === 'string' && v.trim().length > 0 && v.length <= max
  if (!Array.isArray(d.specs) || d.specs.length > 20 || !d.specs.every(s => s && text(s.label, 100) && text(s.value, 300))) throw new Error('Проверьте характеристики: до 20 строк «Параметр | Значение».')
  if (!Array.isArray(d.variants) || d.variants.length > 30 || !d.variants.every(v => text(v, 100)) || new Set(d.variants).size !== d.variants.length) throw new Error('Проверьте исполнения: до 30 разных названий.')
  if (typeof d.length !== 'boolean' || typeof d.application !== 'string' || d.application.length > 1000) throw new Error('Проверьте описание применения.')
  if (!Array.isArray(d.documents) || d.documents.length > 10 || !d.documents.every(v => v && text(v.title, 160) && typeof v.url === 'string' && safeDocumentUrl(v.url))) throw new Error('Документы: название и путь /files/имя.pdf латиницей.')
  return d as CatalogDetails
}
export function configuredItemId(id: string, variant: string, length: string): string {
  return variant || length ? `${id}::${encodeURIComponent(JSON.stringify([variant, length]))}` : id
}

export function parseCatalog(value: unknown): CatalogItem[] {
  if (!Array.isArray(value)) throw new Error('Каталог должен быть массивом')
  const ids = new Set<string>()
  return value.map(item => {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(item.id) || ids.has(item.id)) throw new Error('У каждой позиции должен быть уникальный постоянный id')
    if (!['product', 'service'].includes(item.item_type)) throw new Error('Тип позиции: product или service')
    for (const [key, max] of [['title', 160], ['description', 2000]] as const) {
      if (typeof item[key] !== 'string' || !item[key].trim() || item[key].length > max) throw new Error(`Проверьте ${key} позиции ${item.id}`)
    }
    if (item.photos !== undefined && (!Array.isArray(item.photos) || item.photos.length > 3 || !item.photos.every((p: {url?: unknown; alt?: unknown}) => typeof p?.url === 'string' && (/^\/media\/[a-f0-9-]+\.webp$/.test(p.url) || p.url === '/images/anchor-sheet.webp') && typeof p.alt === 'string' && p.alt.length <= 160))) throw new Error('Допустимо до 3 фотографий')
    if (item.parameters !== undefined) {
      if (!Array.isArray(item.parameters) || item.parameters.length > 10) throw new Error('Допустимо до 10 параметров заявки')
      const keys = new Set()
      for (const p of item.parameters) {
        if (!p || typeof p.id !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(p.id) || keys.has(p.id) || typeof p.label !== 'string' || !p.label.trim() || p.label.length > 100 || !['select','number','text'].includes(p.type) || typeof p.required !== 'boolean') throw new Error('Проверьте название и тип параметра')
        if (typeof p.unit !== 'string' || p.unit.length > 30 || typeof p.hint !== 'string' || p.hint.length > 200 || !Array.isArray(p.options) || p.options.length > 30 || !p.options.every((v: unknown) => typeof v === 'string' && v.trim() && v.length <= 100) || new Set(p.options).size !== p.options.length) throw new Error('Проверьте варианты и подсказку параметра')
        if (p.type === 'select' && p.options.length === 0) throw new Error('Добавьте варианты выбора')
        for (const n of [p.min,p.max]) if (n !== undefined && (typeof n !== 'number' || !Number.isFinite(n))) throw new Error('Границы должны быть числами')
        if (p.min !== undefined && p.max !== undefined && p.min > p.max) throw new Error('Минимум больше максимума')
        keys.add(p.id)
      }
    }
    if (item.order !== undefined && (!Number.isInteger(item.order) || Math.abs(item.order) > 10000)) throw new Error('Проверьте порядок показа')
    ids.add(item.id)
    return { ...item, details: parseDetails(item.details) } as CatalogItem
  })
}
