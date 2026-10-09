import { describe, it, expect } from 'vitest'
import { configuredItemId, parseDetails, parseCatalog, safeDocumentUrl } from '@/lib/catalog'
import { catalogItems } from '@/lib/static-catalog'
import { toggleSelection, serializeSelectedItems } from '@/lib/selection'
describe('catalog and request configuration', () => {
 it('validates all published records', () => { for(const item of catalogItems) expect(parseDetails(item.details)).toEqual(item.details) })
 it('keeps distinct configurations and removes only the selected one', () => {
  const base=catalogItems[0]
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
  expect(()=>parseDetails({...catalogItems[0].details,variants:['A','A']})).toThrow()
 })
})

describe('static catalog', () => {
 it('accepts 100 positions and rejects duplicate IDs or invalid entries', () => {
  const records = Array.from({length:100}, (_,i)=>({...catalogItems[0],id:`item-${i}`}))
  expect(parseCatalog(records)).toHaveLength(100)
  expect(()=>parseCatalog([records[0],records[0]])).toThrow()
  expect(()=>parseCatalog([{...records[0],title:''}])).toThrow()
  expect(()=>parseCatalog([{...records[0],item_type:'unknown'}])).toThrow()
 })
})
