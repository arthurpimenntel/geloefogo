import { createClient } from '@/lib/supabase/server'

export const revalidate = 0

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: clients } = await supabase
    .from('profiles')
    .select('id, full_name, cpf, phone, role, points, created_at, tags')
    .eq('role', 'customer')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-playfair text-2xl text-amber-100">Clientes</h1>
        <p className="text-amber-700 text-sm mt-1">{clients?.length ?? 0} clientes cadastrados</p>
      </div>

      <div className="bg-[#1A0F08] border border-amber-900/20 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-amber-900/20">
              {['Cliente', 'Telefone', 'Pontos', 'Tags', 'Desde', 'Ações'].map(h => (
                <th key={h} className="text-left py-3 px-4 text-amber-700 text-xs uppercase tracking-widest font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(clients ?? []).map(c => (
              <tr key={c.id} className="border-b border-amber-900/10 hover:bg-amber-900/10 transition-colors">
                <td className="py-3 px-4">
                  <p className="text-amber-200">{c.full_name ?? '—'}</p>
                  <p className="text-amber-800 text-xs font-mono">{c.cpf ?? '—'}</p>
                </td>
                <td className="py-3 px-4 text-amber-600 text-xs">{c.phone ?? '—'}</td>
                <td className="py-3 px-4 text-amber-400">{c.points ?? 0} pts</td>
                <td className="py-3 px-4">
                  <div className="flex gap-1 flex-wrap">
                    {(c.tags ?? []).map((tag: string) => (
                      <span key={tag}
                        className="text-[10px] px-1.5 py-0.5 bg-amber-900/30 text-amber-500 border border-amber-900/50">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4 text-amber-800 text-xs">
                  {new Date(c.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="py-3 px-4">
                  <a href={`/admin/clientes/${c.id}`}
                    className="text-amber-700 hover:text-amber-400 text-xs transition-colors">
                    Ver
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
