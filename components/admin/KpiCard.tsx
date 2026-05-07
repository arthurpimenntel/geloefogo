interface KpiCardProps {
  label: string
  value: string
  sub?: string
  trend?: 'up' | 'down'
}

export function KpiCard({ label, value, sub, trend }: KpiCardProps) {
  return (
    <div className="bg-white border border-[#E8DCC8] rounded-2xl p-5 shadow-sm">
      <p className="text-[#8C6D3F] text-[10px] uppercase tracking-widest mb-2 font-medium">{label}</p>
      <p className="font-playfair text-2xl text-[#1C1008] font-semibold">{value}</p>
      {(sub || trend) && (
        <div className="flex items-center gap-1.5 mt-2">
          {trend && (
            <span className={trend === 'up' ? 'text-green-600 text-sm' : 'text-red-500 text-sm'}>
              {trend === 'up' ? '↑' : '↓'}
            </span>
          )}
          {sub && <p className="text-[#B0916A] text-xs">{sub}</p>}
        </div>
      )}
    </div>
  )
}