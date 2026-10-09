export type CatalogItemType = 'product' | 'service'

export type CatalogItem = {
  id: string
  item_type: CatalogItemType
  title: string
  description: string
  created_at: string
  updated_at: string
}

export type SelectedItem = Pick<CatalogItem, 'id' | 'item_type' | 'title'> & {
  amount: string
}
