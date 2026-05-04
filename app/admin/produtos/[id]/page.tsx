'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const INPUT = `bg-[#0D0805] border border-amber-900/40 text-amber-100 px-4 py-2.5 text-sm
  focus:outline-none focus:border-amber-600 transition-colors placeholder:text-amber-900 w-full`

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1A0F08] border border-amber-900/20 p-6">
      <h2 className="text-amber-500 text-[10px] uppercase tracking-[0.25em] mb-5">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, children, help }: { label: string; children: React.ReactNode; help?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <label className="text-amber-700 text-[11px] uppercase tracking-widest">{label}</label>
        {help && <span className="text-amber-900 text-[10px]">— {help}</span>}
      </div>
      {children}
    </div>
  )
}

export default function EditarProdutoPage() {
  const router   = useRouter()
  const params   = useParams()
  const id       = params.id as string
  const supabase = createClient()

  const [categories, setCategories] = useState<Array<{id: string; name: string}>>([])
  const [suppliers,  setSuppliers]  = useState<Array<{id: string; name: string}>>([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [success,    setSuccess]    = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  const [form, setForm] = useState({
    name: '', slug: '', sku: '', brand: '', description: '',
    category_id: '', supplier_id: '', sale_price: '', compare_price: '',
    cost_price: '', stock: '0', weight_g: '', intensity: '',
    origin_country: '', tags: '', images: '', active: true,
  })

  useEffect(() => {
    async function load() {
      const [productRes, catRes, supRes] = await Promise.all([
        supabase.from('products').select('*').eq('id', id).single(),
        supabase.from('categories').select('id, name').order('name'),
        supabase.from('suppliers').select('id, name').eq('active', true).order('name'),
      ])
      if (productRes.data) {
        const p = productRes.data
        setForm({
          name:           p.name ?? '',
          slug:           p.slug ?? '',
          sku:            p.sku ?? '',
          brand:          p.brand ?? '',
          description:    p.description ?? '',
          category_id:    p.category_id ?? '',
          supplier_id:    p.supplier_id ?? '',
          sale_price:     String(p.sale_price ?? ''),
          compare_price:  p.compare_price ? String(p.compare_price) : '',
          cost_price:     String(p.cost_price ?? ''),
          stock:          String(p.stock ?? 0),
          weight_g:       p.weight_g ? String(p.weight_g) : '',
          intensity:      p.intensity ?? '',
          origin_country: p.origin_country ?? '',
          tags:           (p.tags ?? []).join(', '),
          images:         (p.images ?? []).join(', '),
          active:         p.active ?? true,
        })
      }
      setCategories(catRes.data ?? [])
      setSuppliers(supRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [id])

  function set(key: keyof typeof form, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const images = form.images ? form.images.split(',').map(s => s.trim()).filter(Boolean) : []
      const tags   = form.tags   ? form.tags.split(',').map(s => s.trim()).filter(Boolean)   : []
      const { error: err } = await supabase.from('products').update({
        name:           form.name,
        slug:           form.slug,
        sku:            form.sku,
        brand:          form.brand || null,
        description:    form.description || null,
        category_id:    form.category_id || null,
        supplier_id:    form.supplier_id || null,
        sale_price:     parseFloat(form.sale_price) || 0,
        compare_price:  form.compare_price ? parseFloat(form.compare_price) : null,
        cost_price:     parseFloat(form.cost_price) || 0,
        stock:          parseInt(form.stock) || 0,
        weight_g:       form.weight_g ? parseInt(form.weight_g) : null,
        intensity:      form.intensity || null,
        origin_country: form.origin_country || null,
        tags, images,
        active:         form.active,
        updated_at:     new Date().toISOString(),
      }).eq('id', id)
      if (err) throw err
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Tem certeza? Esta ação é irreversível.')) return
    setDeleting(true)
    await supabase.from('products').update({ deleted_at: new Date().toISOString(), active: false }).eq('id', id)
    router.push('/admin/produtos')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-amber-700 text-sm animate-pulse">Carregando produto...</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-amber-700 hover:text-amber-400 text-xs uppercase tracking-widest transition-colors">← Voltar</button>
          <div>
            <h1 className="font-playfair text-2xl text-amber-100">Editar Produto</h1>
            <p className="text-amber-700 text-xs mt-0.5 font-mono">{id.slice(0, 8)}...</p>
          </div>
        </div>
        <button onClick={handleDelete} disabled={deleting}
          className="px-4 py-2 border border-red-900/40 text-red-700 hover:border-red-700
            hover:text-red-400 text-xs uppercase tracking-widest transition-colors disabled:opacity-40">
          {deleting ? 'Removendo...' : '🗑 Remover'}
        </button>
      </div>

      {success && <div className="mb-6 bg-green-900/20 border border-green-700/40 px-5 py-3 text-green-300 text-sm">✅ Produto atualizado com sucesso!</div>}
      {error   && <div className="mb-6 bg-red-900/20 border border-red-700/40 px-5 py-3 text-red-300 text-sm">❌ {error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Section title="Identificação">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome *"><input value={form.name} onChange={e => set('name', e.target.value)} required className={INPUT} /></Field>
            <Field label="SKU *"><input value={form.sku} onChange={e => set('sku', e.target.value)} required className={INPUT} /></Field>
            <Field label="Slug"><input value={form.slug} onChange={e => set('slug', e.target.value)} className={INPUT} /></Field>
            <Field label="Marca"><input value={form.brand} onChange={e => set('brand', e.target.value)} className={INPUT} /></Field>
          </div>
          <Field label="Descrição">
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} className={INPUT + ' resize-none'} />
          </Field>
        </Section>

        <Section title="Categorização">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Categoria">
              <select value={form.category_id} onChange={e => set('category_id', e.target.value)} className={INPUT}>
                <option value="">Sem categoria</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Fornecedor">
              <select value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)} className={INPUT}>
                <option value="">Nenhum</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Intensidade">
              <select value={form.intensity} onChange={e => set('intensity', e.target.value)} className={INPUT}>
                <option value="">—</option>
                <option value="suave">Suave</option>
                <option value="medio">Médio</option>
                <option value="forte">Forte</option>
                <option value="muito_forte">Muito Forte</option>
              </select>
            </Field>
            <Field label="Origem"><input value={form.origin_country} onChange={e => set('origin_country', e.target.value)} placeholder="Cuba" className={INPUT} /></Field>
            <Field label="Tags" help="vírgula"><input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="Importado, Premium" className={INPUT} /></Field>
          </div>
        </Section>

        <Section title="Preços">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Preço Venda *"><input type="number" step="0.01" min="0" value={form.sale_price} onChange={e => set('sale_price', e.target.value)} required className={INPUT} /></Field>
            <Field label="Preço Comparação"><input type="number" step="0.01" min="0" value={form.compare_price} onChange={e => set('compare_price', e.target.value)} className={INPUT} /></Field>
            <Field label="Custo"><input type="number" step="0.01" min="0" value={form.cost_price} onChange={e => set('cost_price', e.target.value)} className={INPUT} /></Field>
          </div>
        </Section>

        <Section title="Estoque">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Estoque"><input type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)} className={INPUT} /></Field>
            <Field label="Peso (g)"><input type="number" min="0" value={form.weight_g} onChange={e => set('weight_g', e.target.value)} placeholder="250" className={INPUT} /></Field>
          </div>
        </Section>

        <Section title="Imagens">
          <Field label="URLs das imagens" help="vírgula">
            <textarea value={form.images} onChange={e => set('images', e.target.value)} rows={3} className={INPUT + ' resize-none'} />
          </Field>
          {form.images && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {form.images.split(',').map(u => u.trim()).filter(Boolean).map((url, i) => (
                <div key={i} className="w-16 h-16 border border-amber-900/40 overflow-hidden">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Status">
          <label className="flex items-center gap-3 cursor-pointer" onClick={() => set('active', !form.active)}>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${form.active ? 'bg-amber-600' : 'bg-amber-900/40'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-amber-400 text-sm">{form.active ? 'Ativo' : 'Inativo'}</span>
          </label>
        </Section>

        <div className="flex gap-4 pt-4">
          <button type="submit" disabled={saving}
            className="px-8 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50
              text-[#0D0805] text-xs font-bold uppercase tracking-widest transition-colors">
            {saving ? 'Salvando...' : '✓ Salvar Alterações'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-3 border border-amber-900/40 text-amber-700
              hover:border-amber-700 text-xs uppercase tracking-widest transition-colors">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
