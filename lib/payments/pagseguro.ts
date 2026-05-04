// lib/payments/pagseguro.ts

const PAGSEGURO_BASE_URL = 'https://api.pagseguro.com'

interface PagSeguroError {
  error_messages?: Array<{ code: string; description: string }>
  message?: string
}

async function pagSeguroFetch<T>(
  path: string,
  options: RequestInit
): Promise<T> {
  const res = await fetch(`${PAGSEGURO_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.PAGSEGURO_TOKEN!}`,
      ...options.headers,
    },
  })

  if (!res.ok) {
    let message = `PagSeguro HTTP ${res.status}`
    try {
      const body: PagSeguroError = await res.json()
      if (body.error_messages?.length) {
        message = body.error_messages.map((e) => e.description).join('; ')
      } else if (body.message) {
        message = body.message
      }
    } catch {
      // sem body JSON
    }
    throw new Error(`[PagSeguro] ${message}`)
  }

  return res.json() as Promise<T>
}

interface PagSeguroOrderResponse {
  id: string
  links: Array<{ rel: string; href: string; media?: string; type?: string }>
}

export async function createCheckoutSession(params: {
  orderId: string
  amount: number
  customerEmail: string
  items: Array<{ name: string; quantity: number; unitAmount: number }>
}): Promise<{ checkoutUrl: string; sessionId: string }> {
  const amountCents = Math.round(params.amount * 100)

  const body = {
    reference_id: params.orderId,
    customer: {
      email: params.customerEmail,
    },
    items: params.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unit_amount: Math.round(item.unitAmount * 100),
    })),
    qr_codes: [
      {
        amount: { value: amountCents },
        expiration_date: new Date(
          Date.now() + 30 * 60 * 1000
        ).toISOString(),
      },
    ],
    charges: [
      {
        reference_id: params.orderId,
        description: `Pedido Gelo & Fogo #${params.orderId.slice(0, 8).toUpperCase()}`,
        amount: {
          value: amountCents,
          currency: 'BRL',
        },
        payment_method: {
          type: 'BOLETO',
          boleto: {
            due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            instruction_lines: {
              line_1: 'Pagamento processado pela Gelo & Fogo',
              line_2: 'Tabacaria Premium',
            },
          },
        },
      },
    ],
    redirect_urls: {
      success: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/confirmacao?ref=${params.orderId}`,
      failure: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout?error=pagseguro`,
    },
    notification_urls: [`${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/pagseguro`],
  }

  const order = await pagSeguroFetch<PagSeguroOrderResponse>('/orders', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  const checkoutLink = order.links.find(
    (l) => l.rel === 'PAY' || l.media === 'application/json'
  )

  if (!checkoutLink?.href) {
    throw new Error('[PagSeguro] Link de checkout não encontrado na resposta')
  }

  return {
    checkoutUrl: checkoutLink.href,
    sessionId: order.id,
  }
}