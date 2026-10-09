import { describe, it, expect } from 'vitest'
import { configuredItemId, parseDetails, safeDocumentUrl } from '@/lib/catalog'
import { fallbackCatalog } from '@/lib/fallback-catalog'
import { toggleSelection, serializeSelectedItems } from '@/lib/selection'
describe('catalog and request configuration', () => {
 it('validates all published records', () => { for(const item of fallbackCatalog) expect(parseDetails(item.details)).toEqual(item.details) })
 it('keeps distinct configurations and removes only the selected one', () => {
  const base=fallbackCatalog[0]
  const a={...base,id:configuredItemId(base.id,'ТФА39','1800'),configuration:'ТФА39 · Длина: 1800 мм'}
  const b={...base,id:configuredItemId(base.id,'ТФА48','2400'),configuration:'ТФА48 · Длина: 2400 мм'}
  const items=toggleSelection(toggleSelection([],a),b)
  expect(items).toHaveLength(2)
  expect(serializeSelectedItems(items)).toContain('ТФА48 · Длина: 2400 мм')
  expect(toggleSelection(items,a).map(i=>i.id)).toEqual([b.id])
 })
 it('rejects dangerous document URLs and malformed data', () => {
  for(const url of ['javascript:alert(1)','//evil.com/a.pdf','/files/../a.pdf','https://evil.com/a.pdf']) expect(safeDocumentUrl(url)).toBe(false)
  expect(safeDocumentUrl('/files/tfa39.pdf')).toBe(true)
  expect(()=>parseDetails({})).toThrow()
  expect(()=>parseDetails({...fallbackCatalog[0].details,variants:['A','A']})).toThrow()
 })
})
