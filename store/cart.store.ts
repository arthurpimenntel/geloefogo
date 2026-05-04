import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/types/domain.types'

export interface CartItem {
  product: Product
  quantity: number
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  open: () => void
  close: () => void
  add(product: Product, qty?: number): void
  remove(productId: string): void
  setQty(productId: string, qty: number): void
  clear(): void
  readonly subtotal: number
  readonly itemCount: number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      open:  () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),

      add(product, qty = 1) {
        set(state => {
          const existing = state.items.find(i => i.product.id === product.id)
          if (existing) {
            return { items: state.items.map(i =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + qty }
                : i
            )}
          }
          return { items: [...state.items, { product, quantity: qty }] }
        })
      },

      remove(id) {
        set(s => ({ items: s.items.filter(i => i.product.id !== id) }))
      },

      setQty(id, qty) {
        if (qty <= 0) { get().remove(id); return }
        set(s => ({ items: s.items.map(i =>
          i.product.id === id ? { ...i, quantity: qty } : i
        )}))
      },

      clear: () => set({ items: [] }),

      get subtotal() {
        return get().items.reduce((s, i) => s + i.product.salePrice * i.quantity, 0)
      },
      get itemCount() {
        return get().items.reduce((s, i) => s + i.quantity, 0)
      }
    }),
    { name: 'tabacaria-cart' }
  )
)