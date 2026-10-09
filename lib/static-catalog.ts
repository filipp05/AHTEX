import data from '@/content/catalog.json'
import { parseCatalog } from './catalog'

export const catalogItems = parseCatalog(data)
