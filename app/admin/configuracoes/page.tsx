'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Settings {
  store_name: string; store_email: string; free_shipping_above: string
  default_weight_g: string; pix_discount_pct: string; max_installments: string
  whatsapp_number: string; store_active: boolean
}

const DEFAULTS: Settings = {
  store_name: 'Gelo & Fogo Tabacaria', store_email: 'contato@geloefogo.com.br',
  free_shipping_above: '300', default_weight_g: '500',
  pix_discount_pct: '5', max_installments: '12',
  whatsapp_number: '', store_active: true,
}

const INPUT = `bg-white border border-[#E8DCC8] rounded-xl text-[#1C1008] px-4 py-2.5 text-sm
  focus:outline-none focus:border-[#C08D3A] transition-colors placeholder:text-[#B0916A] w-full`

export default function ConfiguracoesPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      // Try to load from configuracoes table; silently fallback to defaults if table doesn't exist
      try {
        const { data } = await supabase.from('configuracoes').select('key, value')
        if (data && data.length > 0) {
          const map: Record<string, string> = {}
          data.forEach(({ key, value }: any) => { map[key] = value })
          setSettings(prev => ({
            ...prev,
            store_name: map.store_name ?? prev.store_name,
            store_email: map.store_email ?? prev.store_email,
            free_shipping_above: map.free_shipping_above ?? prev.free_shipping_above,
            default_weight_g: map.default_weight_g ?? prev.default_weight_g,
            pix_discount_pct: map.pix_discount_pct ?? prev.pix_discount_pct,
            max_installments: map.max_installments ?? prev.max_installments,
            whatsapp_number: map.whatsapp_number ?? prev.whatsapp_number,
            store_active: map.store_active === 'true',
          }))
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  function set(key: keyof Settings, value: string | boolean) {
    setSettings(s => ({ ...s, [key]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null)
    try {
      const entries = Object.entries(settings).map(([key, value]) => ({
        key, value: String(value), updated_at: new Date().toISOString(),
      }))
      const { error: err } = await supabase.from('configuracoes').upsert(entries, { onConflict: 'key' })
      if (err) throw err
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch (err: any) { setError(err.message ?? 'Erro ao salvar.') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><p className="text-[#B0916A] text-sm animate-pulse">Carregando...</p></div>

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-playfair text-2xl text-[#1C1008]">Configurações</h1>
        <p className="text-[#8C6D3F] text-sm mt-1">Ajustes gerais da loja</p>
      </div>

      {saved  && <div className="mb-6 bg-green-50 border border-green-200 rounded-xl px-5 py-3 text-green-700 text-sm">✅ Configurações salvas!</div>}
      {error  && <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-red-600 text-sm">❌ {error}</div>}

      <form onSubmit={handleSave} className="space-y-6">
        <Section title="Informações da Loja">
          <Row label="Nome da Loja"><input value={settings.store_name} onChange={e => set('store_name', e.target.value)} className={INPUT} /></Row>
          <Row label="E-mail"><input type="email" value={settings.store_email} onChange={e => set('store_email', e.target.value)} className={INPUT} /></Row>
          <Row label="WhatsApp" help="DDI+DDD+número: 5581999990000"><input value={settings.whatsapp_number} onChange={e => set('whatsapp_number', e.target.value)} placeholder="5581999990000" className={INPUT} /></Row>
          <Row label="Status da Loja">
            <Toggle checked={settings.store_active} onChange={v => set('store_active', v)} label={settings.store_active ? 'Online e funcionando' : 'Temporariamente fechada'} />
          </Row>
        </Section>

        <Section title="Frete">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Row label="Frete grátis acima de (R$)"><input type="number" min="0" value={settings.free_shipping_above} onChange={e => set('free_shipping_above', e.target.value)} className={INPUT} /></Row>
            <Row label="Peso padrão por produto (g)"><input type="number" min="0" value={settings.default_weight_g} onChange={e => set('default_weight_g', e.target.value)} className={INPUT} /></Row>
          </div>
        </Section>

        <Section title="Pagamentos">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Row label="Desconto Pix (%)"><input type="number" min="0" max="30" step="0.5" value={settings.pix_discount_pct} onChange={e => set('pix_discount_pct', e.target.value)} className={INPUT} /></Row>
            <Row label="Máx. parcelas (cartão)"><input type="number" min="1" max="18" value={settings.max_installments} onChange={e => set('max_installments', e.target.value)} className={INPUT} /></Row>
          </div>
        </Section>

        <button type="submit" disabled={saving}
          className="px-8 py-3 bg-[#1C1008] hover:bg-[#3D2010] disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors">
          {saving ? 'Salvando...' : '✓ Salvar Configurações'}
        </button>
      </form>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-[#E8DCC8] rounded-2xl shadow-sm p-6 space-y-4">
      <h2 className="text-[#8C6D3F] text-[10px] uppercase tracking-[0.25em] mb-2">{title}</h2>
      {children}
    </section>
  )
}
function Row({ label, children, help }: { label: string; children: React.ReactNode; help?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <label className="text-[#8C6D3F] text-[10px] uppercase tracking-widest font-medium">{label}</label>
        {help && <span className="text-[#B0916A] text-[10px]">— {help}</span>}
      </div>
      {children}
    </div>
  )
}
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer" onClick={() => onChange(!checked)}>
      <div className={`w-10 h-5 rounded-full relative transition-colors ${checked ? 'bg-[#C08D3A]' : 'bg-[#D9C9A8]'}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
      <span className="text-[#6B4F2A] text-sm">{checked ? label : label}</span>
    </label>
  )
}