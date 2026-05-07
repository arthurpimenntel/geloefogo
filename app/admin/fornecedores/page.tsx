import { createClient } from '@/lib/supabase/server'
import { SupplierStatus } from '@/components/admin/SupplierStatus'
import { SyncLog } from '@/components/admin/SyncLog'
import { SyncAllButton } from '@/components/admin/SyncAllButton'
import Link from 'next/link'

export const revalidate = 0

export default async function FornecedoresPage() {
  const supabase = await createClient()
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, name, type, active, markup_pct, priority, last_sync')
    .order('priority')

  const { data: logs } = await supabase
    .from('supplier_sync_logs')
    .select('*, supplier:suppliers(name)')
    .order('started_at', { ascending: false })
    .limit(20)

  return (
    <div>
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="font-playfair text-2xl text-[#1C1008]">Fornecedores</h1>
          <p className="text-[#8C6D3F] text-sm mt-1">{suppliers?.length ?? 0} fornecedores cadastrados</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <SyncAllButton />
          <Link
            href="/admin/fornecedores/novo"
            className="px-4 py-2 bg-[#C08D3A] hover:bg-[#8C4A10] text-white rounded-xl
              text-xs font-bold uppercase tracking-widest transition-colors"
          >
            + Novo Fornecedor
          </Link>
        </div>
      </div>

      {/* ── Cards de Importação ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">

        {/* AliExpress */}
        <Link
          href="/admin/fornecedores/aliexpress"
          className="group bg-white border border-[#E8DCC8] rounded-2xl shadow-sm hover:border-[#C08D3A]
            p-6 flex items-center gap-5 transition-all hover:shadow-md"
        >
          <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center
            bg-red-50 border border-red-100 rounded-xl text-2xl">
            🛍️
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#1C1008] text-sm font-medium mb-0.5">AliExpress</p>
            <p className="text-[#8C6D3F] text-xs">
              Busque e importe produtos via AliExpress Affiliate API
            </p>
          </div>
          <span className="text-[#D9C9A8] group-hover:text-[#C08D3A] transition-colors text-lg">→</span>
        </Link>

        {/* CJDropshipping */}
        <Link
          href="/admin/fornecedores/cj"
          className="group bg-white border border-[#E8DCC8] rounded-2xl shadow-sm hover:border-[#C08D3A]
            p-6 flex items-center gap-5 transition-all hover:shadow-md"
        >
          <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center
            bg-amber-50 border border-amber-100 rounded-xl text-2xl">
            📦
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#1C1008] text-sm font-medium mb-0.5">CJDropshipping</p>
            <p className="text-[#8C6D3F] text-xs">
              Busque e importe produtos via CJ REST API
            </p>
          </div>
          <span className="text-[#D9C9A8] group-hover:text-[#C08D3A] transition-colors text-lg">→</span>
        </Link>

      </div>

      {/* ── Lista de fornecedores ──────────────────────────────────────────── */}
      {(!suppliers || suppliers.length === 0) ? (
        <div className="bg-white border border-[#E8DCC8] rounded-2xl shadow-sm p-12 text-center">
          <p className="text-4xl mb-4">🔗</p>
          <p className="font-playfair text-[#8C6D3F] text-lg mb-2">Nenhum fornecedor cadastrado</p>
          <p className="text-[#B0916A] text-xs mb-6">Adicione fornecedores para sincronizar produtos automaticamente.</p>
          <Link
            href="/admin/fornecedores/novo"
            className="inline-block px-6 py-2.5 border border-[#D9C9A8] text-[#6B4F2A] rounded-xl
              hover:border-[#C08D3A] hover:bg-[#F5EFE6] text-xs uppercase tracking-widest transition-colors"
          >
            Adicionar primeiro fornecedor
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 mb-10">
          {(suppliers ?? []).map(s => (
            <SupplierStatus key={s.id} supplier={s as any} />
          ))}
        </div>
      )}

      {logs && logs.length > 0 && (
        <>
          <h2 className="font-playfair text-lg text-[#1C1008] mb-4 mt-8">Últimas Sincronizações</h2>
          <SyncLog logs={(logs ?? []) as any} />
        </>
      )}
    </div>
  )
}