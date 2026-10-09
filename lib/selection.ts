import type { CatalogItem, SelectedItem } from './types'

export function toggleSelection(selected: SelectedItem[], item: CatalogItem & { configuration?: string }): SelectedItem[] {
  const exists = selected.some((selectedItem) => selectedItem.id === item.id)
  if (exists) return selected.filter((selectedItem) => selectedItem.id !== item.id)

  return [
    ...selected,
    { id: item.id, item_type: item.item_type, title: item.title, amount: '', configuration: item.configuration ?? '' },
  ]
}

export function updateSelectionAmount(
  selected: SelectedItem[],
  id: string,
  amount: string,
): SelectedItem[] {
  return selected.map((item) => (item.id === id ? { ...item, amount } : item))
}

export function serializeSelectedItems(selected: SelectedItem[]): string {
  if (selected.length === 0) return 'Позиции не выбраны — общая консультация'

  return selected
    .map((item, index) => {
      const type = item.item_type === 'product' ? 'Продукция' : 'Услуга'
      const amount = item.amount.trim() || 'объём не указан'
      return `${index + 1}. ${item.title} (${type})${item.configuration ? ` · ${item.configuration}` : ''} — ${amount}`
    })
    .join('\n')
}
