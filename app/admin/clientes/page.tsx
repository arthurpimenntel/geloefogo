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
        <h1 className="font-playfair text-2xl text-[#1C1008]">Clientes</h1>
        <p className="text-[#8C6D3F] text-sm mt-1">{clients?.length ?? 0} clientes cadastrados</p>
      </div>

      <div className="bg-white border border-[#E8DCC8] rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#FAF7F2] border-b border-[#E8DCC8]">
              {['Cliente', 'Telefone', 'Pontos', 'Tags', 'Desde', 'Ações'].map(h => (
                <th key={h} className="text-left py-3 px-4 text-[#8C6D3F] text-xs uppercase tracking-widest font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(clients ?? []).map(c => (
              <tr key={c.id} className="border-b border-[#F0E8D8] hover:bg-[#FAF7F2] transition-colors">
                <td className="py-3 px-4">
                  <p className="text-[#1C1008] font-medium">{c.full_name ?? '—'}</p>
                  <p className="text-[#B0916A] text-xs font-mono">{c.cpf ?? '—'}</p>
                </td>
                <td className="py-3 px-4 text-[#6B4F2A] text-xs">{c.phone ?? '—'}</td>
                <td className="py-3 px-4 text-[#C08D3A] font-medium">{c.points ?? 0} pts</td>
                <td className="py-3 px-4">
                  <div className="flex gap-1 flex-wrap">
                    {(c.tags ?? []).map((tag: string) => (
                      <span key={tag}
                        className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#F5EFE6] text-[#8C4A10] border border-[#D9C9A8]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4 text-[#B0916A] text-xs">
                  {new Date(c.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="py-3 px-4">
                  <a href={`/admin/clientes/${c.id}`}
                    className="text-[#C08D3A] hover:text-[#8C4A10] text-xs font-medium transition-colors">
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