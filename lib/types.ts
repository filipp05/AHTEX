export type CatalogItemType = 'product' | 'service'
export type Specification = { label: string; value: string }
export type CatalogDetails = {
  specs: Specification[]
  variants: string[]
  length: boolean
  application: string
  documents: { title: string; url: string }[]
}
export type CatalogParameter = {
  id: string
  label: string
  type: 'select' | 'number' | 'text'
  options: string[]
  unit: string
  hint: string
  required: boolean
  min?: number
  max?: number
}
export type CatalogPhoto = { url: string; alt: string }
export type CatalogItem = {
  photos?: CatalogPhoto[]
  parameters?: CatalogParameter[]
  order?: number
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
