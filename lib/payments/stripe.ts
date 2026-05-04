// lib/payments/stripe.ts
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

export async function createPaymentIntent(
  amount: number,
  orderId: string,
  customerEmail: string
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // BRL reais → centavos
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
  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId)
    return pi.status === 'succeeded'
  } catch (err) {
    console.error('[Stripe] confirmPaymentIntent error:', err)
    return false
  }
}

export { stripe }