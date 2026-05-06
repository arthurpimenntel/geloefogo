'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart, selectSubtotal } from '@/hooks/useCart'

type Step = 'dados' | 'entrega' | 'pagamento'
interface FormData {
  nome: string; email: string; cpf: string; telefone: string
  cep: string; rua: string; numero: string; complemento: string
  bairro: string; cidade: string; estado: string
  metodo: 'pix' | 'boleto' | 'cartao'
  cupom: string
}

const INITIAL: FormData = {
  nome: '', email: '', cpf: '', telefone: '',
  cep: '', rua: '', numero: '', complemento: '',
  bairro: '', cidade: '', estado: '',
  metodo: 'pix', cupom: '',
}

const STEPS: Step[] = ['dados', 'entrega', 'pagamento']
const STEP_LABELS: Record<Step, string> = { dados:'Seus Dados', entrega:'Entrega', pagamento:'Pagamento' }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-amber-700 text-xs uppercase tracking-widest">{label}</label>
      {children}
    </div>
  )
}

const INPUT = `bg-[#1A0F08] border border-amber-900/40 text-amber-100 px-4 py-2.5
  text-sm focus:outline-none focus:border-amber-600 transition-colors placeholder:text-amber-900 w-full`

export default function CheckoutPage() {
  const router   = useRouter()
  const items    = useCart(s => s.items)
  const subtotal = useCart(selectSubtotal)
  const clear    = useCart(s => s.clear)

  const [step, setStep]       = useState<Step>('dados')
  const [form, setForm]       = useState<FormData>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [frete, setFrete]     = useState<number | null>(null)
  const [freteLoading, setFreteLoading] = useState(false)
  const [cupomData, setCupomData]       = useState<{ discount: number; type: string } | null>(null)
  const [cupomError, setCupomError]     = useState<string | null>(null)
  const [cupomLoading, setCupomLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const idx = STEPS.indexOf(step)

  function set(key: keyof FormData, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  const discount = cupomData
    ? (cupomData.type === 'percent'
        ? subtotal * (cupomData.discount / 100)
        : cupomData.discount)
    : 0

  const pixDiscount = form.metodo === 'pix' ? subtotal * 0.05 : 0
  const total = subtotal - discount - pixDiscount + (frete ?? 0)

  async function buscarCep() {
    const clean = form.cep.replace(/\D/g, '')
    if (clean.length < 8) return
    try {
      setFreteLoading(true)
      const [viacep, freteRes] = await Promise.all([
        fetch(`https://viacep.com.br/ws/${clean}/json/`).then(r => r.json()),
        fetch(`/api/frete?cep=${clean}&subtotal=${subtotal}&peso=500`).then(r => r.json()),
      ])
      if (!viacep.erro) {
        setForm(f => ({
          ...f,
          rua: viacep.logradouro, bairro: viacep.bairro,
          cidade: viacep.localidade, estado: viacep.uf,
        }))
        setFrete(freteRes.preco ?? 19.90)
      }
    } catch { setFrete(19.90) }
    finally { setFreteLoading(false) }
  }

  async function validarCupom() {
    if (!form.cupom) return
    setCupomLoading(true); setCupomError(null)
    try {
      const res = await fetch('/api/cupons/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: form.cupom.toUpperCase(), subtotal }),
      })
      const data = await res.json()
      if (!res.ok) { setCupomError(data.error ?? 'Cupom inválido'); setCupomData(null) }
      else { setCupomData({ discount: data.value, type: data.type }) }
    } catch { setCupomError('Erro ao validar cupom') }
    finally { setCupomLoading(false) }
  }

  async function finalizarPedido() {
    setLoading(true); setCheckoutError(null)
    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            productId: i.product.id, qty: i.quantity,
            unitPrice: i.product.salePrice, name: i.product.name,
          })),
          shippingAddress: {
            nome: form.nome, cep: form.cep, rua: form.rua,
            numero: form.numero, complemento: form.complemento,
            bairro: form.bairro, cidade: form.cidade, estado: form.estado,
          },
          shippingCost: frete ?? 0,
          subtotal,
          discount: discount + pixDiscount,
          total,
          paymentMethod: form.metodo,
          couponCode: cupomData ? form.cupom : null,
          customerData: { nome: form.nome, email: form.email, cpf: form.cpf, telefone: form.telefone },
        }),
      })
      const data = await res.json()
      if (!res.ok) { setCheckoutError(data.error ?? 'Erro ao criar pedido'); return }
      if (data.orderId) {
        clear()
        router.push(`/checkout/confirmacao?orderId=${data.orderId}&metodo=${form.metodo}`)
      }
    } catch { setCheckoutError('Erro de conexão. Tente novamente.') }
    finally { setLoading(false) }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="text-amber-500 text-lg mb-4">Seu carrinho está vazio.</p>
        <a href="/catalogo" className="text-amber-600 hover:text-amber-300 text-sm transition-colors">Ir ao catálogo →</a>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 ${i <= idx ? 'opacity-100' : 'opacity-30'}`}>
              <div className={`w-7 h-7 flex items-center justify-center text-xs font-bold
                ${i < idx ? 'bg-amber-600 text-[#0D0805]' :
                  i === idx ? 'border-2 border-amber-500 text-amber-300' :
                  'border border-amber-800 text-amber-700'}`}>
                {i < idx ? '✓' : i + 1}
              </div>
              <span className={`text-xs uppercase tracking-widest hidden sm:block
                ${i === idx ? 'text-amber-300' : 'text-amber-700'}`}>
                {STEP_LABELS[s]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 sm:w-16 h-px ${i < idx ? 'bg-amber-600' : 'bg-amber-900/40'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          {step === 'dados' && (
            <>
              <h2 className="font-playfair text-xl text-amber-200 mb-6">Seus Dados</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nome completo">
                  <input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="João Silva" required className={INPUT} />
                </Field>
                <Field label="E-mail">
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="joao@email.com" required className={INPUT} />
                </Field>
                <Field label="CPF">
                  <input value={form.cpf} onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" className={INPUT} />
                </Field>
                <Field label="Telefone">
                  <input value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(81) 99999-0000" className={INPUT} />
                </Field>
              </div>
            </>
          )}

          {step === 'entrega' && (
            <>
              <h2 className="font-playfair text-xl text-amber-200 mb-6">Endereço de Entrega</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 flex gap-3">
                  <Field label="CEP">
                    <input
                      value={form.cep}
                      onChange={e => set('cep', e.target.value)}
                      onBlur={buscarCep}
                      placeholder="00000-000"
                      className={INPUT}
                    />
                  </Field>
                  <button
                    onClick={buscarCep}
                    disabled={freteLoading}
                    className="self-end px-4 py-2.5 border border-amber-700 text-amber-500
                      hover:border-amber-400 text-xs uppercase tracking-widest transition-colors
                      disabled:opacity-50 whitespace-nowrap flex-shrink-0">
                    {freteLoading ? '...' : 'Buscar'}
                  </button>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Rua"><input value={form.rua} onChange={e => set('rua', e.target.value)} className={INPUT} /></Field>
                </div>
                <Field label="Número"><input value={form.numero} onChange={e => set('numero', e.target.value)} className={INPUT} /></Field>
                <Field label="Complemento"><input value={form.complemento} onChange={e => set('complemento', e.target.value)} placeholder="Apto, bloco..." className={INPUT} /></Field>
                <Field label="Bairro"><input value={form.bairro} onChange={e => set('bairro', e.target.value)} className={INPUT} /></Field>
                <Field label="Cidade"><input value={form.cidade} onChange={e => set('cidade', e.target.value)} className={INPUT} /></Field>
                <Field label="Estado"><input value={form.estado} onChange={e => set('estado', e.target.value)} placeholder="PE" className={INPUT} /></Field>
              </div>
              {frete !== null && (
                <p className="text-amber-500 text-sm mt-1">
                  Frete: {frete === 0 ? <span className="text-green-400">Grátis!</span>
                    : frete.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              )}
            </>
          )}

          {step === 'pagamento' && (
            <>
              <h2 className="font-playfair text-xl text-amber-200 mb-6">Pagamento</h2>
              <div className="space-y-3 mb-8">
                {([
                  { id:'pix',    label:'Pix', desc:'5% de desconto · Confirmação instantânea', icon:'⚡' },
                  { id:'boleto', label:'Boleto Bancário', desc:'Vence em 3 dias úteis', icon:'📄' },
                  { id:'cartao', label:'Cartão de Crédito', desc:'Até 12x sem juros', icon:'💳' },
                ] as const).map(({ id, label, desc, icon }) => (
                  <label key={id}
                    className={`flex items-center gap-4 p-4 border cursor-pointer transition-all ${
                      form.metodo === id
                        ? 'border-amber-600 bg-amber-900/20'
                        : 'border-amber-900/30 hover:border-amber-800'
                    }`}>
                    <input type="radio" name="metodo" value={id} checked={form.metodo === id}
                      onChange={() => set('metodo', id)} className="accent-amber-500" />
                    <span className="text-xl">{icon}</span>
                    <div>
                      <p className="text-amber-200 text-sm font-medium">{label}</p>
                      <p className="text-amber-700 text-xs">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Cupom */}
              <div className="border-t border-amber-900/20 pt-6">
                <p className="text-amber-600 text-xs uppercase tracking-widest mb-3">Cupom de Desconto</p>
                <div className="flex gap-2">
                  <input
                    value={form.cupom}
                    onChange={e => { set('cupom', e.target.value.toUpperCase()); setCupomData(null); setCupomError(null) }}
                    placeholder="CÓDIGO DO CUPOM"
                    className={INPUT}
                  />
                  <button
                    onClick={validarCupom}
                    disabled={!form.cupom || cupomLoading}
                    className="px-4 border border-amber-700 text-amber-500 hover:border-amber-500
                      text-xs uppercase tracking-widest transition-colors disabled:opacity-40 flex-shrink-0">
                    {cupomLoading ? '...' : 'Aplicar'}
                  </button>
                </div>
                {cupomData && (
                  <p className="text-green-400 text-xs mt-2">
                    ✓ Cupom aplicado! Desconto de {cupomData.type === 'percent'
                      ? `${cupomData.discount}%`
                      : cupomData.discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                )}
                {cupomError && <p className="text-red-400 text-xs mt-2">✕ {cupomError}</p>}
              </div>
            </>
          )}

          {checkoutError && (
            <div className="bg-red-900/20 border border-red-700/40 px-4 py-3 text-red-300 text-sm">
              ❌ {checkoutError}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            {idx > 0 ? (
              <button onClick={() => setStep(STEPS[idx - 1])}
                className="text-amber-600 hover:text-amber-300 text-xs uppercase tracking-widest transition-colors">
                ← Voltar
              </button>
            ) : <div />}

            {idx < STEPS.length - 1 ? (
              <button onClick={() => setStep(STEPS[idx + 1])}
                disabled={step === 'dados' && !form.nome}
                className="px-8 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50
                  text-[#0D0805] text-xs font-bold uppercase tracking-widest transition-colors">
                Continuar →
              </button>
            ) : (
              <button onClick={finalizarPedido} disabled={loading}
                className="px-8 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50
                  text-[#0D0805] text-xs font-bold uppercase tracking-widest transition-colors">
                {loading ? 'Processando...' : '🔒 Finalizar Pedido'}
              </button>
            )}
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-[#1A0F08] border border-amber-900/20 p-6 h-fit sticky top-24">
          <h3 className="font-playfair text-lg text-amber-200 mb-5">Resumo</h3>
          <ul className="space-y-3 mb-5 max-h-64 overflow-y-auto">
            {items.map(({ product, quantity }) => (
              <li key={product.id} className="flex gap-3">
                {product.images?.[0] && (
                  <img src={product.images[0]} alt={product.name}
                    className="w-12 h-12 object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-amber-200 text-xs truncate">{product.name}</p>
                  <p className="text-amber-700 text-xs">×{quantity}</p>
                </div>
                <p className="text-amber-400 text-xs font-medium whitespace-nowrap">
                  {(Number(product.salePrice) * quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </li>
            ))}
          </ul>
          <div className="border-t border-amber-900/20 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-amber-700">Subtotal</span>
              <span className="text-amber-300">{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            {frete !== null && (
              <div className="flex justify-between">
                <span className="text-amber-700">Frete</span>
                <span className={frete === 0 ? 'text-green-400' : 'text-amber-300'}>
                  {frete === 0 ? 'Grátis' : frete.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between">
                <span className="text-amber-700">Desconto cupom</span>
                <span className="text-green-400">-{discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            )}
            {pixDiscount > 0 && (
              <div className="flex justify-between">
                <span className="text-amber-700">Desconto Pix (5%)</span>
                <span className="text-green-400">-{pixDiscount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            )}
            <div className="flex justify-between font-medium pt-2 border-t border-amber-900/20">
              <span className="text-amber-400">Total</span>
              <span className="text-amber-300 font-playfair text-lg">
                {Math.max(0, total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}