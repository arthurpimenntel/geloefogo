interface KpiCardProps {
  label: string
  value: string
  sub?: string
  trend?: 'up' | 'down'
}

export function KpiCard({ label, value, sub, trend }: KpiCardProps) {
  return (
    <div className="bg-[#1A0F08] border border-amber-900/20 p-5">
      <p className="text-amber-700 text-xs uppercase tracking-widest mb-2">{label}</p>
      <p className="font-playfair text-2xl text-amber-200">{value}</p>
      {(sub || trend) && (
        <div className="flex items-center gap-1.5 mt-2">
          {trend && (
            <span className={trend === 'up' ? 'text-green-400' : 'text-red-400'}>
              {trend === 'up' ? '↑' : '↓'}
            </span>
          )}
          {sub && <p className="text-amber-800 text-xs">{sub}</p>}
        </div>
      )}
    </div>
  )
}
