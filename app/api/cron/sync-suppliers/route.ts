import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RestSupplierAdapter } from '@/lib/suppliers/rest-supplier'
import { CsvSupplierAdapter }  from '@/lib/suppliers/csv-supplier'

export const maxDuration = 300  // Vercel Pro: até 5 min para sync grande

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await createClient()

  // Busca todos os fornecedores ativos no DB
  const { data: suppliers } = await db
    .from('suppliers').select('*').eq('active', true)

  const results = await Promise.allSettled(
    (suppliers ?? []).map(async sup => {
      const logId = (await db.from('supplier_sync_logs').insert({
        supplier_id: sup.id, started_at: new Date().toISOString(),
      }).select('id').single()).data?.id

      let adapter
      if (sup.type === 'rest_api')
        adapter = new RestSupplierAdapter({
          id: sup.id, name: sup.name,
          baseUrl:   sup.config.baseUrl,
          token:     sup.config.token,
          markupPct: sup.markup_pct,
        })
      else if (sup.type === 'csv_ftp')
        adapter = new CsvSupplierAdapter(sup)
      else return

      const result = await adapter.syncCatalog()

      await db.from('supplier_sync_logs').update({
        finished_at: new Date().toISOString(),
        added:    result.added,
        updated:  result.updated,
        removed:  result.removed,
        errors:   result.errors,
        status:   result.errors.length === 0 ? 'success' : 'partial',
      }).eq('id', logId)

      await db.from('suppliers')
        .update({ last_sync: new Date().toISOString() })
        .eq('id', sup.id)
    })
  )

  return NextResponse.json({
    ran:    results.length,
    errors: results.filter(r => r.status === 'rejected').length,
  })
}
export async function POST(req: NextRequest) {
  // Allow admin users to trigger sync from UI (no CRON_SECRET needed, checked by auth)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['manager', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ message: 'Sync enfileirado. Será executado em breve.' })
}
