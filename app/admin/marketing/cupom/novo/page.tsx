'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const INPUT = `bg-[#0D0805] border border-amber-900/40 text-amber-100 px-4 py-2.5 text-sm
  focus:outline-none focus:border-amber-600 transition-colors placeholder:text-amber-900 w-full`

export default function NovoCupomPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const [form, setForm] = useState({
    code:        '',
    type:        'percent' as 'percent' | 'fixed' | 'shipping',
    value:       '',
    min_order:   '',
    max_uses:    '',
    valid_from:  '',
    valid_until: '',
    active:      true,
  })

  function set(key: keyof typeof form, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    set('code', code)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error: err } = await supabase.from('coupons').insert({
        code:        form.code.toUpperCase(),
        type:        form.type,
        value:       parseFloat(form.value) || 0,
        min_order:   form.min_order ? parseFloat(form.min_order) : 0,
        max_uses:    form.max_uses  ? parseInt(form.max_uses)    : null,
        valid_from:  form.valid_from  ? new Date(form.valid_from).toISOString()  : null,
        valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
        active:      form.active,
      })
      if (err) throw err
      router.push('/admin/marketing')
    } catch (err: any) {
      setError(err.message ?? 'Erro ao criar cupom.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="text-amber-700 hover:text-amber-400 text-xs uppercase tracking-widest transition-colors">← Voltar</button>
        <h1 className="font-playfair text-2xl text-amber-100">Novo Cupom</h1>
      </div>

      {error && <div className="mb-6 bg-red-900/20 border border-red-700/40 px-5 py-3 text-red-300 text-sm">❌ {error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-[#1A0F08] border border-amber-900/20 p-6 space-y-4">
          <h2 className="text-amber-500 text-[10px] uppercase tracking-[0.25em]">Código</h2>
          <div>
            <label className="text-amber-700 text-[11px] uppercase tracking-widest block mb-1.5">Código do Cupom *</label>
            <div className="flex gap-2">
              <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())}
                placeholder="VERAO20" required className={INPUT} />
              <button type="button" onClick={generateCode}
                className="px-3 border border-amber-800 text-amber-600 hover:border-amber-600
                  text-xs uppercase tracking-widest transition-colors flex-shrink-0">
                Gerar
              </button>
            </div>
          </div>
        </section>

        <section className="bg-[#1A0F08] border border-amber-900/20 p-6 space-y-4">
          <h2 className="text-amber-500 text-[10px] uppercase tracking-[0.25em]">Desconto</h2>
          <div>
            <label className="text-amber-700 text-[11px] uppercase tracking-widest block mb-1.5">Tipo de Desconto</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id:'percent', label:'% Percentual' },
                { id:'fixed',   label:'R$ Fixo' },
                { id:'shipping',label:'Frete Grátis' },
              ] as const).map(({ id, label }) => (
                <button key={id} type="button" onClick={() => set('type', id)}
                  className={`py-2.5 text-xs uppercase tracking-widest border transition-colors ${
                    form.type === id ? 'border-amber-600 bg-amber-900/20 text-amber-300' : 'border-amber-900/30 text-amber-700 hover:border-amber-800'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {form.type !== 'shipping' && (
            <div>
              <label className="text-amber-700 text-[11px] uppercase tracking-widest block mb-1.5">
                Valor {form.type === 'percent' ? '(%)' : '(R$)'} *
              </label>
              <input type="number" step="0.01" min="0" value={form.value}
                onChange={e => set('value', e.target.value)} required className={INPUT} />
            </div>
          )}
          <div>
            <label className="text-amber-700 text-[11px] uppercase tracking-widest block mb-1.5">Pedido mínimo (R$)</label>
            <input type="number" step="0.01" min="0" value={form.min_order}
              onChange={e => set('min_order', e.target.value)} placeholder="0" className={INPUT} />
          </div>
          <div>
            <label className="text-amber-700 text-[11px] uppercase tracking-widest block mb-1.5">Limite de usos</label>
            <input type="number" min="1" value={form.max_uses}
              onChange={e => set('max_uses', e.target.value)} placeholder="Ilimitado" className={INPUT} />
          </div>
        </section>

        <section className="bg-[#1A0F08] border border-amber-900/20 p-6 space-y-4">
          <h2 className="text-amber-500 text-[10px] uppercase tracking-[0.25em]">Validade</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-amber-700 text-[11px] uppercase tracking-widest block mb-1.5">Válido a partir de</label>
              <input type="date" value={form.valid_from} onChange={e => set('valid_from', e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className="text-amber-700 text-[11px] uppercase tracking-widest block mb-1.5">Válido até</label>
              <input type="date" value={form.valid_until} onChange={e => set('valid_until', e.target.value)} className={INPUT} />
            </div>
          </div>
        </section>

        <section className="bg-[#1A0F08] border border-amber-900/20 p-6">
          <h2 className="text-amber-500 text-[10px] uppercase tracking-[0.25em] mb-4">Status</h2>
          <label className="flex items-center gap-3 cursor-pointer" onClick={() => set('active', !form.active)}>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${form.active ? 'bg-amber-600' : 'bg-amber-900/40'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-amber-400 text-sm">{form.active ? 'Cupom ativo' : 'Cupom inativo'}</span>
          </label>
        </section>

        <div className="flex gap-4 pt-2">
          <button type="submit" disabled={loading}
            className="px-8 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50
              text-[#0D0805] text-xs font-bold uppercase tracking-widest transition-colors">
            {loading ? 'Criando...' : '✓ Criar Cupom'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-3 border border-amber-900/40 text-amber-700 hover:border-amber-700 text-xs uppercase tracking-widest transition-colors">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
