import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getProduct } from '../data/content.js'

const CartContext = createContext(null)
const STORAGE_KEY = 'ev1-sample-cart'

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [open, setOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const api = useMemo(() => {
    const addItem = (productId, quantity = 1) => {
      setItems((prev) => {
        const found = prev.find((item) => item.productId === productId)
        if (found) {
          return prev.map((item) =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          )
        }
        return [...prev, { productId, quantity }]
      })
      setOpen(true)
    }

    const setQuantity = (productId, quantity) => {
      setItems((prev) => {
        if (quantity <= 0) return prev.filter((item) => item.productId !== productId)
        return prev.map((item) =>
          item.productId === productId ? { ...item, quantity } : item,
        )
      })
    }

    const removeItem = (productId) => {
      setItems((prev) => prev.filter((item) => item.productId !== productId))
    }

    const clear = () => setItems([])

    const detailed = items
      .map((item) => {
        const product = getProduct(item.productId)
        if (!product) return null
        return { ...item, product, lineTotal: product.price * item.quantity }
      })
      .filter(Boolean)

    const count = detailed.reduce((sum, item) => sum + item.quantity, 0)
    const total = detailed.reduce((sum, item) => sum + item.lineTotal, 0)

    return {
      items: detailed,
      count,
      total,
      open,
      setOpen,
      addItem,
      setQuantity,
      removeItem,
      clear,
    }
  }, [items, open])

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
