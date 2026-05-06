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
}

function sanitizeProduct(product: Product): Product {
  return {
    ...product,
    salePrice:    Number(product.salePrice)    || 0,
    comparePrice: product.comparePrice != null ? Number(product.comparePrice) || 0 : undefined,
    costPrice:    product.costPrice    != null ? Number(product.costPrice)    || 0 : undefined,
  }
}

// Selectors externos — não dependem de getters no objeto do store
// (getters são perdidos no shallow-merge interno do set() do Zustand)
export const selectSubtotal = (state: CartStore & { items: CartItem[] }) =>
  state.items.reduce(
    (sum, item) => sum + (Number(item.product.salePrice) || 0) * item.quantity,
    0
  )

export const selectItemCount = (state: CartStore & { items: CartItem[] }) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0)

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items:  [],
      isOpen: false,

      open:  () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),

      add(product, qty = 1) {
        const sanitized = sanitizeProduct(product)
        set(state => {
          const existing = state.items.find(i => i.product.id === sanitized.id)
          if (existing) {
            return {
              items: state.items.map(i =>
                i.product.id === sanitized.id
                  ? { ...i, quantity: i.quantity + qty }
                  : i
              ),
            }
          }
          return { items: [...state.items, { product: sanitized, quantity: qty }] }
        })
      },

      remove(id) {
        set(s => ({ items: s.items.filter(i => i.product.id !== id) }))
      },

      setQty(id, qty) {
        if (qty <= 0) { get().remove(id); return }
        set(s => ({
          items: s.items.map(i =>
            i.product.id === id ? { ...i, quantity: qty } : i
          ),
        }))
      },

      clear: () => set({ items: [] }),
    }),
    {
      name: 'tabacaria-cart',
      onRehydrateStorage: () => state => {
        if (!state) return
        state.items = state.items.map(item => ({
          ...item,
          product: sanitizeProduct(item.product),
        }))
      },
    }
  )
)