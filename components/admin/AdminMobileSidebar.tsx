'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'

interface NavItem {
  href: string
  label: string
  icon: string
}

interface Props {
  nav: NavItem[]
  user: { name: string; role: string }
}

export function AdminMobileSidebar({ nav, user }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex flex-col gap-1.5 items-center justify-center w-8 h-8 text-amber-600"
        aria-label="Menu admin"
      >
        <span className="block w-5 h-px bg-current" />
        <span className="block w-5 h-px bg-current" />
        <span className="block w-3 h-px bg-current self-start ml-1" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.28, ease: [0.25, 0, 0, 1] }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-[#0A0604] border-r border-amber-900/20 z-50 flex flex-col"
            >
              <div className="p-5 border-b border-amber-900/20 flex items-center justify-between">
                <div>
                  <p className="font-playfair text-amber-300 text-base">Gelo &amp; Fogo</p>
                  <p className="text-amber-700 text-xs uppercase tracking-widest">Admin</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 flex items-center justify-center text-amber-700
                    hover:text-amber-300 transition-colors text-lg"
                >
                  ✕
                </button>
              </div>

              <nav className="flex-1 py-4 overflow-y-auto">
                {nav.map(({ href, label, icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-5 py-3 text-amber-700 hover:text-amber-300
                      hover:bg-amber-900/20 text-sm transition-colors border-b border-amber-900/10"
                  >
                    <span className="text-base">{icon}</span>
                    {label}
                  </Link>
                ))}
              </nav>

              <div className="p-5 border-t border-amber-900/20">
                <p className="text-amber-600 text-xs truncate">{user.name}</p>
                <p className="text-amber-800 text-[10px] uppercase tracking-widest mt-0.5">{user.role}</p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
