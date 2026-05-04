// components/ui/GoldDivider.tsx
export function GoldDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`h-px bg-gradient-to-r from-transparent via-amber-700 to-transparent ${className}`} />
  )
}
