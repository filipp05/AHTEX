'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { toggleSelection, updateSelectionAmount } from '@/lib/selection'
import type { CatalogItem, SelectedItem } from '@/lib/types'

const STORAGE_KEY = 'anteh-request-items'

type SelectionContextValue = {
  selected: SelectedItem[]
  toggle: (item: CatalogItem) => void
  remove: (id: string) => void
  setAmount: (id: string, amount: string) => void
  clear: () => void
  has: (id: string) => boolean
}

const SelectionContext = createContext<SelectionContextValue | null>(null)

function isStoredSelection(value: unknown): value is SelectedItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        (item.item_type === 'product' || item.item_type === 'service') &&
        typeof item.amount === 'string',
    )
  )
}

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<SelectedItem[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const restore = () => {
      try {
        const raw = window.sessionStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed: unknown = JSON.parse(raw)
          if (isStoredSelection(parsed)) setSelected(parsed)
        }
      } catch {
        window.sessionStorage.removeItem(STORAGE_KEY)
      } finally {
        setReady(true)
      }
    }

    queueMicrotask(restore)
  }, [])

  useEffect(() => {
    if (!ready) return
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selected))
  }, [ready, selected])

  const toggle = useCallback((item: CatalogItem) => {
    setSelected((current) => toggleSelection(current, item))
  }, [])

  const remove = useCallback((id: string) => {
    setSelected((current) => current.filter((item) => item.id !== id))
  }, [])

  const setAmount = useCallback((id: string, amount: string) => {
    setSelected((current) => updateSelectionAmount(current, id, amount))
  }, [])

  const clear = useCallback(() => setSelected([]), [])
  const has = useCallback((id: string) => selected.some((item) => item.id === id), [selected])

  const value = useMemo(
    () => ({ selected, toggle, remove, setAmount, clear, has }),
    [selected, toggle, remove, setAmount, clear, has],
  )

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>
}

export function useSelection() {
  const context = useContext(SelectionContext)
  if (!context) throw new Error('useSelection должен использоваться внутри SelectionProvider')
  return context
}
