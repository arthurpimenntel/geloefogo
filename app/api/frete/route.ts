// app/api/frete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { calcShipping } from '@/lib/shipping'

// Support both GET (from checkout page) and POST
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const cep    = searchParams.get('cep')    ?? ''
  const weight = searchParams.get('peso')   ?? '500'
  const sub    = searchParams.get('subtotal') ?? '0'

  const cleanCep = cep.replace(/\D/g, '')
  if (cleanCep.length !== 8) {
    return NextResponse.json({ error: 'CEP inválido' }, { status: 400 })
  }

  try {
    const options = await calcShipping(cleanCep, parseFloat(weight) / 1000, parseFloat(sub))
    // Return first option price for backwards compat
    const preco = options?.[0]?.price ?? 19.90
    return NextResponse.json({ preco, options })
  } catch {
    return NextResponse.json({ preco: 19.90, options: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cep, weightKg, subtotal } = body

    if (!cep || typeof subtotal !== 'number') {
      return NextResponse.json({ error: 'cep e subtotal são obrigatórios' }, { status: 400 })
    }

    const cleanCep = String(cep).replace(/\D/g, '')
    if (cleanCep.length !== 8) {
      return NextResponse.json({ error: 'CEP inválido' }, { status: 400 })
    }

    const options = await calcShipping(cleanCep, weightKg ?? 0.5, subtotal)
    return NextResponse.json(options)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao calcular frete'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
