// lib/payments/stripe.ts
import Stripe from 'stripe'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key, {
    apiVersion: '2026-04-22.basil' as any,
  })
}

export async function createPaymentIntent(
  amount: number,
  orderId: string,
  customerEmail: string
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const stripe = getStripe()
  if (!stripe) throw new Error('Stripe não configurado')

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'brl',
    metadata: { order_id: orderId },
    receipt_email: customerEmail,
    automatic_payment_methods: { enabled: true },
  })

  if (!paymentIntent.client_secret) {
    throw new Error('Stripe não retornou client_secret')
  }

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  }
}

export async function confirmPaymentIntent(
  paymentIntentId: string
): Promise<boolean> {
  const stripe = getStripe()
  if (!stripe) return false
  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId)
    return pi.status === 'succeeded'
  } catch (err) {
    console.error('[Stripe] confirmPaymentIntent error:', err)
    return false
  }
}

export const stripe = getStripe()