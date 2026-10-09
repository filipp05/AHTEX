import { describe, expect, it } from 'vitest'
import { serializeSelectedItems, toggleSelection, updateSelectionAmount } from '@/lib/selection'
import type { CatalogItem } from '@/lib/types'

const item: CatalogItem = {
  id: 'anchor',
  item_type: 'product',
  title: 'Фрикционный анкер',
  description: 'Описание',
  created_at: '2026-09-21T00:00:00.000Z',
  updated_at: '2026-09-21T00:00:00.000Z',
}

describe('состав заявки', () => {
  it('добавляет и повторным действием убирает позицию', () => {
    const added = toggleSelection([], item)
    expect(added).toHaveLength(1)
    expect(toggleSelection(added, item)).toEqual([])
  })

  it('сохраняет свободно заданный объём', () => {
    const selected = updateSelectionAmount(toggleSelection([], item), item.id, '500 шт.')
    expect(selected[0].amount).toBe('500 шт.')
  })

  it('формирует понятный состав письма без описаний карточек', () => {
    const selected = updateSelectionAmount(toggleSelection([], item), item.id, '500 шт.')
    const result = serializeSelectedItems(selected)
    expect(result).toContain('Фрикционный анкер (Продукция) — 500 шт.')
    expect(result).not.toContain(item.description)
  })
})
