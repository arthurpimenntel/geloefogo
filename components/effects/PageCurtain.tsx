'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

const curtainVariants = {
  initial:  { x: '-100%' },
  animate:  { x: '0%',    transition: { duration: 0.35, ease: [0.76, 0, 0.24, 1] } },
  exit:     { x: '100%',  transition: { duration: 0.35, ease: [0.76, 0, 0.24, 1] } },
}

const pageVariants = {
  initial:  { opacity: 0, y: 12 },
  animate:  { opacity: 1, y: 0,   transition: { duration: 0.4, delay: 0.15 } },
  exit:     { opacity: 0, y: -8,  transition: { duration: 0.2 } },
}

export function PageCurtain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname + '-curtain'}
          variants={curtainVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            background: '#1A0F08', pointerEvents: 'none',
          }}
        />
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit">
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  )
}