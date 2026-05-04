interface BadgeProps {
  children: React.ReactNode
  variant?: 'gold' | 'red' | 'green' | 'gray'
  className?: string
}

export function Badge({ children, variant = 'gold', className = '' }: BadgeProps) {
  const variants = {
    gold:  'bg-amber-900/30 text-amber-400 border border-amber-800/40',
    red:   'bg-red-900/30 text-red-400 border border-red-800/40',
    green: 'bg-green-900/30 text-green-400 border border-green-800/40',
    gray:  'bg-zinc-900/30 text-zinc-400 border border-zinc-800/40',
  }
  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
