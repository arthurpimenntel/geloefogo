// hooks/useParallax.ts
'use client'

import { useRef } from 'react'
import { useScroll, useTransform, MotionStyle } from 'framer-motion'

export function useParallax(offset: number = 50): {
  ref: React.RefObject<HTMLDivElement>
  style: MotionStyle
} {
  const ref = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const translateY = useTransform(scrollYProgress, [0, 1], [-offset, offset])

  return { ref, style: { translateY } }
}