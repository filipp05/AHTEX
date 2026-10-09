import type { CatalogItem } from './types'

const now = '2026-09-21T00:00:00.000Z'

export const fallbackCatalog: CatalogItem[] = [
  {
    id: 'fallback-friction-anchor',
    item_type: 'product',
    title: 'Фрикционные трубчатые анкеры',
    description:
      'Решения для крепления кровли и бортов, усиления горного массива и поддержания горных выработок. Технические характеристики будут опубликованы после подтверждения заказчиком.',
    created_at: now,
    updated_at: now,
  },
  {
    id: 'fallback-support-plates',
    item_type: 'product',
    title: 'Опорные плиты',
    description:
      'Элемент системы крепления горных выработок. Размеры, варианты исполнения и технические характеристики будут добавлены после получения материалов заказчика.',
    created_at: now,
    updated_at: now,
  },
  {
    id: 'fallback-reinforcement-cages',
    item_type: 'product',
    title: 'Армокаркасы',
    description:
      'Категория продукции «Антех Восток». Назначение, состав и характеристики будут опубликованы только после подтверждения заказчиком.',
    created_at: now,
    updated_at: now,
  },
]
