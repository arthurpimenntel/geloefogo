'use client'

export function SyncAllButton() {
  async function handleSync() {
    if (confirm('Sincronizar todos os fornecedores ativos? Isso pode levar alguns minutos.')) {
      const res = await fetch('/api/cron/sync-suppliers', { method: 'POST' })
      if (res.ok) {
        alert('Sincronização iniciada! Aguarde alguns instantes.')
        window.location.reload()
      } else {
        alert('Erro ao iniciar sincronização.')
      }
    }
  }

  return (
    <button
      onClick={handleSync}
      className="px-4 py-2 border border-amber-700 text-amber-600 hover:border-amber-500
        hover:text-amber-300 text-xs uppercase tracking-widest transition-colors"
    >
      🔄 Sincronizar Todos
    </button>
  )
}
