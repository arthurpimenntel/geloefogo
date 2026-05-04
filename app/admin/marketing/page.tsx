import { createClient } from '@/lib/supabase/server'

export const revalidate = 0

export default async function MarketingPage() {
  const supabase = await createClient()
  const { data: coupons } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-playfair text-2xl text-amber-100">Marketing</h1>
        <a href="/admin/marketing/cupom/novo"
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-[#0D0805]
            text-xs font-bold uppercase tracking-widest transition-colors">
          + Novo Cupom
        </a>
      </div>

      <h2 className="text-amber-500 text-xs uppercase tracking-widest mb-4">Cupons de Desconto</h2>
      <div className="bg-[#1A0F08] border border-amber-900/20 overflow-hidden mb-10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-amber-900/20">
              {['Código', 'Tipo', 'Valor', 'Usos', 'Válido até', 'Status'].map(h => (
                <th key={h} className="text-left py-3 px-4 text-amber-700 text-xs uppercase tracking-widest font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(coupons ?? []).map(c => (
              <tr key={c.id} className="border-b border-amber-900/10 hover:bg-amber-900/10">
                <td className="py-3 px-4 text-amber-300 font-mono font-bold">{c.code}</td>
                <td className="py-3 px-4 text-amber-700 text-xs capitalize">{c.type}</td>
                <td className="py-3 px-4 text-amber-300">
                  {c.type === 'percent' ? `${c.value}%` : c.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="py-3 px-4 text-amber-600">
                  {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ''}
                </td>
                <td className="py-3 px-4 text-amber-700 text-xs">
                  {c.valid_until ? new Date(c.valid_until).toLocaleDateString('pt-BR') : '—'}
                </td>
                <td className="py-3 px-4">
                  <span className={`text-xs px-2 py-0.5 ${c.active
                    ? 'bg-green-900/30 text-green-400'
                    : 'bg-red-900/30 text-red-400'}`}>
                    {c.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
              </tr>
            ))}
            {(!coupons || coupons.length === 0) && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-amber-800 text-sm">
                  Nenhum cupom cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
