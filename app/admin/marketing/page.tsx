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
        <h1 className="font-playfair text-2xl text-[#1C1008]">Marketing</h1>
        <a href="/admin/marketing/cupom/novo"
          className="px-4 py-2 bg-[#C08D3A] hover:bg-[#8C4A10] text-white rounded-xl
            text-xs font-bold uppercase tracking-widest transition-colors">
          + Novo Cupom
        </a>
      </div>

      <h2 className="text-[#8C6D3F] text-xs uppercase tracking-widest mb-4">Cupons de Desconto</h2>
      <div className="bg-white border border-[#E8DCC8] rounded-2xl shadow-sm overflow-hidden mb-10">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#FAF7F2] border-b border-[#E8DCC8]">
              {['Código', 'Tipo', 'Valor', 'Usos', 'Válido até', 'Status'].map(h => (
                <th key={h} className="text-left py-3 px-4 text-[#8C6D3F] text-xs uppercase tracking-widest font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(coupons ?? []).map(c => (
              <tr key={c.id} className="border-b border-[#F0E8D8] hover:bg-[#FAF7F2] transition-colors">
                <td className="py-3 px-4 text-[#8C4A10] font-mono font-bold">{c.code}</td>
                <td className="py-3 px-4 text-[#6B4F2A] text-xs capitalize">{c.type}</td>
                <td className="py-3 px-4 text-[#1C1008] font-medium">
                  {c.type === 'percent' ? `${c.value}%` : c.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="py-3 px-4 text-[#6B4F2A]">
                  {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ''}
                </td>
                <td className="py-3 px-4 text-[#B0916A] text-xs">
                  {c.valid_until ? new Date(c.valid_until).toLocaleDateString('pt-BR') : '—'}
                </td>
                <td className="py-3 px-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.active
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-600 border border-red-200'}`}>
                    {c.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
              </tr>
            ))}
            {(!coupons || coupons.length === 0) && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#B0916A] text-sm">
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