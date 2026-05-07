'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/hooks/useCart'
import { CartDrawer } from './CartDrawer'

const NAV_LINKS = [
  { href: '/catalogo?categoria=charutos',    label: 'Charutos' },
  { href: '/catalogo?categoria=cachimbos',   label: 'Cachimbos' },
  { href: '/catalogo?categoria=acessorios',  label: 'Acessórios' },
  { href: '/catalogo?categoria=narguiles',   label: 'Narguilés' },
  { href: '/catalogo',                       label: 'Ver Tudo' },
]

export function Navbar() {
  const [scrolled,   setScrolled]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { itemCount, open: openCart } = useCart()
  const prevCount = useRef(itemCount)
  const [bump, setBump] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (itemCount > prevCount.current) {
      setBump(true)
      const t = setTimeout(() => setBump(false), 400)
      return () => clearTimeout(t)
    }
    prevCount.current = itemCount
  }, [itemCount])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          scrolled
            ? 'bg-[#F5EFE6]/95 backdrop-blur-md border-b border-[#D4B896]/40 py-3'
            : 'bg-[#F5EFE6]/80 backdrop-blur-sm border-b border-[#D4B896]/20 py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 group">
            <div className="flex flex-col leading-none">
              <span className="font-serif text-[#1C1C1C] tracking-[0.12em] text-lg md:text-xl group-hover:text-[#C9A96E] transition-colors duration-300">
                Gelo &amp; Fogo
              </span>
              <span className="text-[9px] uppercase tracking-[0.35em] text-[#8B7355] group-hover:text-[#C9A96E] transition-colors">
                Tabacaria Premium
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-[11px] uppercase tracking-[0.2em] text-[#8B7355] hover:text-[#1C1C1C] transition-colors duration-200 relative group"
              >
                {label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[#C9A96E] group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/catalogo"
              className="hidden md:flex items-center justify-center w-9 h-9 text-[#8B7355] hover:text-[#1C1C1C] transition-colors"
              aria-label="Buscar"
            >
              <SearchIcon />
            </Link>

            <Link
              href="/conta"
              className="hidden md:flex items-center justify-center w-9 h-9 text-[#8B7355] hover:text-[#1C1C1C] transition-colors"
              aria-label="Minha conta"
            >
              <AccountIcon />
            </Link>

            <button
              onClick={openCart}
              className="relative flex items-center justify-center w-9 h-9 text-[#8B7355] hover:text-[#1C1C1C] transition-colors"
              aria-label="Abrir carrinho"
            >
              <CartIcon />
              {itemCount > 0 && (
                <motion.span
                  animate={bump ? { scale: [1, 1.5, 1] } : { scale: 1 }}
                  transition={{ duration: 0.35 }}
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#C9A96E] text-[#1C1C1C] text-[10px] font-bold flex items-center justify-center leading-none rounded-full"
                >
                  {itemCount > 9 ? '9+' : itemCount}
                </motion.span>
              )}
            </button>

            {/* Mobile burger */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 text-[#8B7355] hover:text-[#1C1C1C] transition-colors"
              aria-label="Menu"
            >
              <motion.span
                animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                className="block w-5 h-px bg-current origin-center"
              />
              <motion.span
                animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
                className="block w-5 h-px bg-current"
              />
              <motion.span
                animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                className="block w-5 h-px bg-current origin-center"
              />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: [0.25, 0, 0, 1] }}
              className="md:hidden border-t border-[#D4B896]/40 bg-[#F5EFE6]/98 backdrop-blur-md overflow-hidden"
            >
              <nav className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1">
                {NAV_LINKS.map(({ href, label }, i) => (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className="block py-3 px-2 text-sm text-[#8B7355] hover:text-[#1C1C1C] border-b border-[#D4B896]/30 transition-colors uppercase tracking-widest"
                    >
                      {label}
                    </Link>
                  </motion.div>
                ))}
                <div className="flex gap-4 pt-4 pb-2">
                  <Link
                    href="/conta"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-xs text-[#8B7355] hover:text-[#1C1C1C] uppercase tracking-widest transition-colors"
                  >
                    <AccountIcon />
                    Minha conta
                  </Link>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <CartDrawer />
    </>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function AccountIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  )
}