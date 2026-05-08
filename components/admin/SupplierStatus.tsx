'use client'

import { useState } from 'react'

interface Supplier {
  id: string
  name: string
  type: string
  active: boolean
  markup_pct: number
  priority: number
  last_sync: string | null
}

export function SupplierStatus({ supplier }: { supplier: Supplier }) {
  const [syncing, setSyncing] = useState(false)
  const [result,  setResult]  = useState<string | null>(null)

  async function handleSync() {
    setSyncing(true)
    setResult(null)
    try {
      const res  = await fetch(`/api/admin/fornecedores/${supplier.id}/sync`, { method: 'POST' })
      const data = await res.json()
      setResult(`✅ +${data.added} adicionados, ${data.updated} atualizados, ${data.errors?.length ?? 0} erros`)
    } catch {
      setResult('❌ Erro ao sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  const TYPE_LABEL: Record<string, string> = {
    rest_api: 'REST API',
    csv_ftp:  'CSV / FTP',
    webhook:  'Webhook Push',
    manual:   'Manual',
  }

  return (
    <div className="bg-white border border-[#E8DCC8] rounded-2xl shadow-sm p-5 flex items-center gap-6">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${supplier.active ? 'bg-green-400' : 'bg-red-400'}`} />
          <p className="text-[#1C1008] font-medium">{supplier.name}</p>
        </div>
        <div className="flex gap-4 mt-2 flex-wrap">
          <span className="text-[#8C6D3F] text-xs">{TYPE_LABEL[supplier.type] ?? supplier.type}</span>
          <span className="text-[#8C6D3F] text-xs">Markup: {supplier.markup_pct}%</span>
          <span className="text-[#8C6D3F] text-xs">Prioridade: {supplier.priority}</span>
          {supplier.last_sync && (
            <span className="text-[#B0916A] text-xs">
              Última sync: {new Date(supplier.last_sync).toLocaleString('pt-BR')}
            </span>
          )}
        </div>
        {result && (
          <p className={`text-xs mt-2 font-medium ${result.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>
            {result}
          </p>
        )}
      </div>
      <button
        onClick={handleSync}
        disabled={syncing || !supplier.active}
        className="px-4 py-2 border border-[#D9C9A8] rounded-xl text-[#6B4F2A]
          hover:border-[#C08D3A] hover:bg-[#F5EFE6] text-xs uppercase tracking-widest
          transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
      >
        {syncing ? '...' : '🔄 Sync'}
      </button>
    </div>
  )
}