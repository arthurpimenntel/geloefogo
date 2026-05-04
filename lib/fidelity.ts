import { createClient } from '@/lib/supabase/server'

export const POINTS_PER_BRL    = 1     // 1 pt por R$1 gasto
export const REDEMPTION_RATE   = 0.05  // 100 pts = R$5 de desconto
export const MIN_REDEEM        = 100   // mínimo para resgatar

export function calcEarned(total: number): number {
  return Math.floor(total * POINTS_PER_BRL)
}

export function calcDiscount(points: number): number {
  return Math.floor(points / MIN_REDEEM) * (MIN_REDEEM * REDEMPTION_RATE)
}

export async function awardPoints(userId: string, orderId: string, total: number) {
  const db     = createClient()
  const earned = calcEarned(total)
  if (earned === 0) return

  await Promise.all([
    db.from('points_transactions').insert({
      user_id:     userId,
      order_id:    orderId,
      delta:       earned,
      type:        'earn',
      description: `Compra #${orderId.slice(0,8)}`,
    }),
    db.rpc('increment_points', { user_id: userId, amount: earned }),
    // Stored procedure — evita race condition:
    // UPDATE profiles SET points = points + amount WHERE id = user_id
  ])
}

export async function redeemPoints(userId: string, orderId: string, points: number) {
  const db = createClient()

  // Verifica saldo suficiente
  const { data: profile } = await db
    .from('profiles').select('points').eq('id', userId).single()

  if (!profile || profile.points < points)
    throw new Error('Pontos insuficientes')
  if (points < MIN_REDEEM)
    throw new Error(`Mínimo de ${MIN_REDEEM} pontos para resgate`)

  const discount = calcDiscount(points)

  await Promise.all([
    db.from('points_transactions').insert({
      user_id:     userId,
      order_id:    orderId,
      delta:       -points,
      type:        'redeem',
      description: `Resgate — R$${discount.toFixed(2)} de desconto`,
    }),
    db.rpc('increment_points', { user_id: userId, amount: -points }),
  ])

  return discount
}