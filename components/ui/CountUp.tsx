'use client'
import { useCountUp } from '@/hooks/useCountUp'

interface CountUpProps {
  target: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

export function CountUp({ target, duration = 1800, prefix = '', suffix = '', className = '' }: CountUpProps) {
  const { value, ref } = useCountUp(target, duration)
  return (
    <span ref={ref as any} className={className}>
      {prefix}{value.toLocaleString('pt-BR')}{suffix}
    </span>
  )
}
