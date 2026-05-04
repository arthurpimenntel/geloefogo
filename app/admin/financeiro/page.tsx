import { createClient } from '@/lib/supabase/server'

export const revalidate = 0

export default async function FinanceiroPage() {
  const supabase = await createClient()
  const { data: payments } = await supabase
    .from('payments')
    .select('*, order:orders(id, total, status)')
    .eq('status', 'aprovado')
    .order('created_at', { ascending: false })
    .limit(50)

  const total = (payments ?? []).reduce((s, p) => s + p.amount, 0)

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-playfair text-2xl text-amber-100">Financeiro</h1>
        <p className="text-amber-700 text-sm mt-1">Conciliação de pagamentos aprovados</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#1A0F08] border border-amber-900/20 p-5">
          <p className="text-amber-700 text-xs uppercase tracking-widest">Total Recebido</p>
          <p className="font-playfair text-2xl text-amber-300 mt-2">
            {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        <div className="bg-[#1A0F08] border border-amber-900/20 p-5">
          <p className="text-amber-700 text-xs uppercase tracking-widest">Transações</p>
          <p className="font-playfair text-2xl text-amber-300 mt-2">{payments?.length ?? 0}</p>
        </div>
        <div className="bg-[#1A0F08] border border-amber-900/20 p-5">
          <p className="text-amber-700 text-xs uppercase tracking-widest">Ticket Médio</p>
          <p className="font-playfair text-2xl text-amber-300 mt-2">
            {payments?.length
              ? (total / payments.length).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
              : 'R$0,00'}
          </p>
        </div>
      </div>

      <div className="bg-[#1A0F08] border border-amber-900/20 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-amber-900/20">
              {['Data', 'Pedido', 'Método', 'Gateway', 'Valor'].map(h => (
                <th key={h} className="text-left py-3 px-4 text-amber-700 text-xs uppercase tracking-widest font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(payments ?? []).map(p => (
              <tr key={p.id} className="border-b border-amber-900/10 hover:bg-amber-900/10">
                <td className="py-3 px-4 text-amber-700 text-xs">
                  {new Date(p.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="py-3 px-4 text-amber-500 font-mono text-xs">
                  #{(p.order as any)?.id?.slice(0, 8)}
                </td>
                <td className="py-3 px-4 text-amber-600 text-xs capitalize">{p.method}</td>
                <td className="py-3 px-4 text-amber-700 text-xs">{p.provider}</td>
                <td className="py-3 px-4 text-amber-300 font-medium">
                  {p.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
