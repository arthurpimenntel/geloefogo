// components/ui/Button.tsx
import { forwardRef } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props }, ref) => {
    const base = 'uppercase tracking-widest font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
    const variants = {
      primary: 'bg-amber-600 hover:bg-amber-500 text-[#0D0805]',
      outline: 'border border-amber-700 text-amber-500 hover:border-amber-400 hover:text-amber-200',
      ghost:   'text-amber-600 hover:text-amber-300',
    }
    const sizes = {
      sm: 'px-4 py-2 text-[10px]',
      md: 'px-6 py-2.5 text-xs',
      lg: 'px-8 py-3 text-xs',
    }
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {loading ? 'Carregando...' : children}
      </button>
    )
  }
)
Button.displayName = 'Button'
