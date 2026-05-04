import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles').select('role').single()
  if (!profile || !['manager','super_admin'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const now      = new Date()
  const today    = new Date(now.setHours(0,0,0,0)).toISOString()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [monthOrders, pendingOrders, revenue] = await Promise.all([
    supabase.from('orders')
      .select('id, total', { count: 'exact' })
      .gte('created_at', thisMonth)
      .neq('status', 'cancelado'),

    supabase.from('orders')
      .select('id', { count: 'exact' })
      .in('status', ['pago', 'processando']),

    supabase.rpc('get_revenue_summary')   
  ])

  const orders   = monthOrders.data ?? []
  const total    = orders.reduce((s, o) => s + o.total, 0)
  const avgTicket = orders.length ? total / orders.length : 0

  return NextResponse.json({
    revenueMonth:   Math.round(total * 100) / 100,
    ordersMonth:    monthOrders.count ?? 0,
    pendingOrders:  pendingOrders.count ?? 0,
    avgTicket:      Math.round(avgTicket * 100) / 100,
    revenueByDay:   revenue.data
  })
}