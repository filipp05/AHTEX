export type CatalogItemType = 'product' | 'service'
export type Specification = { label: string; value: string }
export type CatalogDetails = {
  specs: Specification[]
  variants: string[]
  length: boolean
  application: string
  documents: { title: string; url: string }[]
}
export type CatalogItem = {
  id: string
  item_type: CatalogItemType
  title: string
  description: string
  details?: CatalogDetails
  created_at: string
  updated_at: string
}
export type SelectedItem = Pick<CatalogItem, 'id' | 'item_type' | 'title'> & {
  amount: string
  configuration?: string
}
