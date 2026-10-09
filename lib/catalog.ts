import type { CatalogDetails } from './types'
export const emptyDetails: CatalogDetails = { specs: [], variants: [], length: false, application: '', documents: [] }
export function safeDocumentUrl(value: string): boolean {
  return /^\/files\/[a-zA-Z0-9_/-]+\.pdf$/.test(value) && !value.includes('..')
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
