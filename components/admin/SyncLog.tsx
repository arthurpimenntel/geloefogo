interface Log {
  id: string
  started_at: string
  finished_at: string | null
  added: number
  updated: number
  removed: number
  status: string
  supplier: { name: string } | null
}

export function SyncLog({ logs }: { logs: Log[] }) {
  if (!logs.length) {
    return <p className="text-amber-800 text-sm">Nenhuma sincronização registrada.</p>
  }

  return (
    <div className="bg-[#1A0F08] border border-amber-900/20 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-amber-900/20">
            {['Fornecedor', 'Início', 'Duração', '+Adicionados', '~Atualizados', 'Erros', 'Status'].map(h => (
              <th key={h} className="text-left py-2.5 px-4 text-amber-700 text-xs uppercase tracking-widest font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {logs.map(log => {
            const duration = log.finished_at
              ? Math.round((new Date(log.finished_at).getTime() - new Date(log.started_at).getTime()) / 1000)
              : null
            return (
              <tr key={log.id} className="border-b border-amber-900/10 hover:bg-amber-900/10">
                <td className="py-2.5 px-4 text-amber-300">{log.supplier?.name ?? '—'}</td>
                <td className="py-2.5 px-4 text-amber-700 text-xs">
                  {new Date(log.started_at).toLocaleString('pt-BR')}
                </td>
                <td className="py-2.5 px-4 text-amber-700 text-xs">
                  {duration !== null ? `${duration}s` : '—'}
                </td>
                <td className="py-2.5 px-4 text-green-400 text-xs">+{log.added ?? 0}</td>
                <td className="py-2.5 px-4 text-blue-400 text-xs">~{log.updated ?? 0}</td>
                <td className="py-2.5 px-4 text-xs">
                  <span className={(log.removed ?? 0) > 0 ? 'text-red-400' : 'text-amber-800'}>
                    {log.removed ?? 0}
                  </span>
                </td>
                <td className="py-2.5 px-4">
                  <span className={`text-xs px-2 py-0.5 ${
                    log.status === 'success' ? 'bg-green-900/30 text-green-400' :
                    log.status === 'partial' ? 'bg-yellow-900/30 text-yellow-400' :
                    'bg-red-900/30 text-red-400'
                  }`}>
                    {log.status ?? '—'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
