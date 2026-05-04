// components/storefront/CartDrawer.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '@/hooks/useCart'

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

const drawerVariants = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { type: 'tween', duration: 0.32, ease: [0.25, 0, 0, 1] } },
  exit: { x: '100%', transition: { type: 'tween', duration: 0.24, ease: [0.4, 0, 1, 1] } },
}

export function CartDrawer() {
  const { items, isOpen, close, subtotal, setQty, remove } = useCart()

  const fmt = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="cart-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.28 }}
            onClick={close}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.72)',
              zIndex: 49,
              backdropFilter: 'blur(2px)',
            }}
          />

          {/* Drawer */}
          <motion.div
            key="cart-drawer"
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              maxWidth: '440px',
              backgroundColor: '#100B07',
              borderLeft: '1px solid #2a1a08',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '1.5rem 1.75rem',
                borderBottom: '1px solid #1f1108',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#0D0805',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <BagIcon />
                <h2
                  className="font-playfair"
                  style={{
                    color: '#d97706',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    margin: 0,
                    letterSpacing: '0.05em',
                  }}
                >
                  Seu Carrinho
                </h2>
                {items.length > 0 && (
                  <span
                    style={{
                      backgroundColor: '#d97706',
                      color: '#0D0805',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.45rem',
                      minWidth: '20px',
                      textAlign: 'center',
                    }}
                  >
                    {items.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </div>
              <button
                onClick={close}
                aria-label="Fechar carrinho"
                style={{
                  background: 'none',
                  border: '1px solid #2a1a08',
                  color: '#92400e',
                  cursor: 'pointer',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#fbbf24'
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#d97706'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#92400e'
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#2a1a08'
                }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.75rem' }}>
              {items.length === 0 ? (
                <EmptyCart />
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  {items.map((item) => (
                    <li
                      key={item.product.id}
                      style={{
                        display: 'flex',
                        gap: '1rem',
                        padding: '1.25rem 0',
                        borderBottom: '1px solid #1a0f06',
                        alignItems: 'flex-start',
                      }}
                    >
                      {/* Imagem */}
                      <div
                        style={{
                          width: '70px',
                          height: '70px',
                          backgroundColor: '#1A0F06',
                          border: '1px solid #2a1a08',
                          flexShrink: 0,
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        {item.product.images?.[0] ? (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="70px"
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#2a1a08',
                              fontSize: '1.5rem',
                            }}
                          >
                            ◆
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <p
                          style={{
                            margin: 0,
                            color: '#fbbf24',
                            fontSize: '0.87rem',
                            fontWeight: 500,
                            lineHeight: 1.3,
                          }}
                        >
                          {item.product.name}
                        </p>
                        {item.product.brand && (
                          <p
                            style={{
                              margin: 0,
                              color: '#78350f',
                              fontSize: '0.7rem',
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                            }}
                          >
                            {item.product.brand}
                          </p>
                        )}

                        {/* Qty + Remove */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '0.25rem',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              border: '1px solid #2a1a08',
                            }}
                          >
                            <QtyButton
                              onClick={() => setQty(item.product.id, item.quantity - 1)}
                              label="−"
                            />
                            <span
                              style={{
                                color: '#fbbf24',
                                fontSize: '0.85rem',
                                padding: '0.3rem 0.75rem',
                                minWidth: '32px',
                                textAlign: 'center',
                                borderLeft: '1px solid #2a1a08',
                                borderRight: '1px solid #2a1a08',
                              }}
                            >
                              {item.quantity}
                            </span>
                            <QtyButton
                              onClick={() => setQty(item.product.id, item.quantity + 1)}
                              label="+"
                            />
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span
                              style={{
                                color: '#d97706',
                                fontSize: '0.92rem',
                                fontWeight: 600,
                              }}
                            >
                              {fmt(item.product.salePrice * item.quantity)}
                            </span>
                            <button
                              onClick={() => remove(item.product.id)}
                              aria-label="Remover item"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#78350f',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                padding: 0,
                                textDecoration: 'underline',
                                textUnderlineOffset: '2px',
                              }}
                            >
                              remover
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div
                style={{
                  padding: '1.5rem 1.75rem',
                  borderTop: '1px solid #2a1a08',
                  backgroundColor: '#0D0805',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                {/* Subtotal */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <span
                    style={{
                      color: '#78350f',
                      fontSize: '0.7rem',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Subtotal
                  </span>
                  <span
                    className="font-playfair"
                    style={{ color: '#fbbf24', fontSize: '1.25rem', fontWeight: 600 }}
                  >
                    {fmt(subtotal)}
                  </span>
                </div>

                <p
                  style={{
                    margin: 0,
                    color: '#78350f',
                    fontSize: '0.72rem',
                    letterSpacing: '0.03em',
                  }}
                >
                  Frete calculado no checkout
                </p>

                {/* CTA */}
                <Link
                  href="/checkout"
                  onClick={close}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    backgroundColor: '#d97706',
                    color: '#0D0805',
                    padding: '0.9rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#b45309')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#d97706')
                  }
                >
                  Finalizar Compra
                </Link>

                <button
                  onClick={close}
                  style={{
                    background: 'none',
                    border: '1px solid #2a1a08',
                    color: '#92400e',
                    padding: '0.75rem',
                    fontSize: '0.8rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.color = '#d97706'
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#92400e'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.color = '#92400e'
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#2a1a08'
                  }}
                >
                  Continuar Comprando
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function QtyButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        color: '#d97706',
        cursor: 'pointer',
        width: '32px',
        height: '32px',
        fontSize: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'color 0.1s',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#fbbf24')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#d97706')}
    >
      {label}
    </button>
  )
}

function BagIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#d97706"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  )
}

function EmptyCart() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1rem',
        gap: '1.5rem',
        height: '100%',
        minHeight: '280px',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          border: '1px solid #2a1a08',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#2a1a08',
          fontSize: '1.5rem',
        }}
      >
        ◆
      </div>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p
          className="font-playfair"
          style={{
            color: '#92400e',
            fontSize: '1rem',
            margin: 0,
            fontStyle: 'italic',
          }}
        >
          Seu carrinho está vazio
        </p>
        <p
          style={{
            color: '#78350f',
            fontSize: '0.78rem',
            margin: 0,
            letterSpacing: '0.05em',
            lineHeight: 1.6,
          }}
        >
          Explore nossa seleção de charutos
          <br />e acessórios premium.
        </p>
      </div>
    </div>
  )
}