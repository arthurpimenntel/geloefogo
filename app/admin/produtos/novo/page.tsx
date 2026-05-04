'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Category { id: string; name: string; slug: string }
interface Supplier  { id: string; name: string; type: string }

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function NovoProdutoPage() {
  const router = useRouter()
  const supabase = createClient()

  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers,  setSuppliers]  = useState<Supplier[]>([])
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [success,    setSuccess]    = useState(false)

  const [form, setForm] = useState({
    name:           '',
    slug:           '',
    sku:            '',
    brand:          '',
    description:    '',
    category_id:    '',
    supplier_id:    '',
    sale_price:     '',
    compare_price:  '',
    cost_price:     '',
    stock:          '0',
    weight_g:       '',
    intensity:      '',
    origin_country: '',
    tags:           '',
    images:         '',
    active:         true,
  })

  useEffect(() => {
    async function load() {
      const [catRes, supRes] = await Promise.all([
        supabase.from('categories').select('id, name, slug').order('name'),
        supabase.from('suppliers').select('id, name, type').eq('active', true).order('name'),
      ])
      setCategories(catRes.data ?? [])
      setSuppliers(supRes.data ?? [])
    }
    load()
  }, [])

  function set(key: keyof typeof form, value: string | boolean) {
    setForm(f => {
      const next = { ...f, [key]: value }
      // Auto slug from name
      if (key === 'name' && typeof value === 'string') {
        next.slug = slugify(value)
      }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Parse images from comma-separated URLs
      const images = form.images
        ? form.images.split(',').map(s => s.trim()).filter(Boolean)
        : []

      const tags = form.tags
        ? form.tags.split(',').map(s => s.trim()).filter(Boolean)
        : []

      const { error: insertError } = await supabase.from('products').insert({
        name:           form.name,
        slug:           form.slug || slugify(form.name),
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
        tags,
        images,
        active:         form.active,
      })

      if (insertError) throw insertError
      setSuccess(true)
      setTimeout(() => router.push('/admin/produtos'), 1500)
    } catch (err: any) {
      setError(err.message ?? 'Erro ao salvar produto.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="text-amber-700 hover:text-amber-400 text-xs uppercase tracking-widest transition-colors"
        >
          ← Voltar
        </button>
        <div>
          <h1 className="font-playfair text-2xl text-amber-100">Novo Produto</h1>
          <p className="text-amber-700 text-xs mt-0.5">Cadastro manual de produto</p>
        </div>
      </div>

      {success && (
        <div className="mb-6 bg-green-900/20 border border-green-700/40 px-5 py-3 text-green-300 text-sm">
          ✅ Produto cadastrado com sucesso! Redirecionando...
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-900/20 border border-red-700/40 px-5 py-3 text-red-300 text-sm">
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identificação */}
        <Section title="Identificação">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome do Produto *" required>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Cohiba Siglo VI"
                required
                className={INPUT}
              />
            </Field>
            <Field label="SKU *" required>
              <input
                value={form.sku}
                onChange={e => set('sku', e.target.value)}
                placeholder="CUB-001"
                required
                className={INPUT}
              />
            </Field>
            <Field label="Slug (URL)" help="Gerado automaticamente">
              <input
                value={form.slug}
                onChange={e => set('slug', e.target.value)}
                placeholder="cohiba-siglo-vi"
                className={INPUT}
              />
            </Field>
            <Field label="Marca">
              <input
                value={form.brand}
                onChange={e => set('brand', e.target.value)}
                placeholder="Cohiba"
                className={INPUT}
              />
            </Field>
          </div>
          <Field label="Descrição">
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Descreva o produto em detalhes..."
              rows={4}
              className={INPUT + ' resize-none'}
            />
          </Field>
        </Section>

        {/* Categorização */}
        <Section title="Categorização">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Categoria">
              <select
                value={form.category_id}
                onChange={e => set('category_id', e.target.value)}
                className={INPUT}
              >
                <option value="">Selecionar categoria</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Fornecedor">
              <select
                value={form.supplier_id}
                onChange={e => set('supplier_id', e.target.value)}
                className={INPUT}
              >
                <option value="">Nenhum / Manual</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Intensidade">
              <select
                value={form.intensity}
                onChange={e => set('intensity', e.target.value)}
                className={INPUT}
              >
                <option value="">Selecionar</option>
                <option value="suave">Suave</option>
                <option value="medio">Médio</option>
                <option value="forte">Forte</option>
                <option value="muito_forte">Muito Forte</option>
              </select>
            </Field>
            <Field label="País de Origem">
              <input
                value={form.origin_country}
                onChange={e => set('origin_country', e.target.value)}
                placeholder="Cuba"
                className={INPUT}
              />
            </Field>
            <Field label="Tags" help="Separar por vírgula">
              <input
                value={form.tags}
                onChange={e => set('tags', e.target.value)}
                placeholder="Importado, Premium, Mais Vendido"
                className={INPUT}
              />
            </Field>
          </div>
        </Section>

        {/* Preços */}
        <Section title="Preços">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Preço de Venda (R$) *" required>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.sale_price}
                onChange={e => set('sale_price', e.target.value)}
                placeholder="890.00"
                required
                className={INPUT}
              />
            </Field>
            <Field label="Preço Comparação (R$)" help="Riscado">
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.compare_price}
                onChange={e => set('compare_price', e.target.value)}
                placeholder="1050.00"
                className={INPUT}
              />
            </Field>
            <Field label="Custo (R$)">
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.cost_price}
                onChange={e => set('cost_price', e.target.value)}
                placeholder="400.00"
                className={INPUT}
              />
            </Field>
          </div>
        </Section>

        {/* Estoque e Logística */}
        <Section title="Estoque e Logística">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Estoque Inicial">
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={e => set('stock', e.target.value)}
                placeholder="0"
                className={INPUT}
              />
            </Field>
            <Field label="Peso (gramas)">
              <input
                type="number"
                min="0"
                value={form.weight_g}
                onChange={e => set('weight_g', e.target.value)}
                placeholder="250"
                className={INPUT}
              />
            </Field>
          </div>
        </Section>

        {/* Imagens */}
        <Section title="Imagens">
          <Field label="URLs das imagens" help="Separar por vírgula">
            <textarea
              value={form.images}
              onChange={e => set('images', e.target.value)}
              placeholder="https://exemplo.com/img1.jpg, https://exemplo.com/img2.jpg"
              rows={3}
              className={INPUT + ' resize-none'}
            />
          </Field>
          {form.images && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {form.images.split(',').map(url => url.trim()).filter(Boolean).map((url, i) => (
                <div key={i} className="w-16 h-16 border border-amber-900/40 overflow-hidden">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Status */}
        <Section title="Status">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set('active', !form.active)}
              className={`w-10 h-5 rounded-full relative transition-colors ${
                form.active ? 'bg-amber-600' : 'bg-amber-900/40'
              }`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white
                transition-transform ${form.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-amber-400 text-sm">
              {form.active ? 'Produto ativo (visível na loja)' : 'Produto inativo (oculto)'}
            </span>
          </label>
        </Section>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50
              text-[#0D0805] text-xs font-bold uppercase tracking-widest transition-colors"
          >
            {loading ? 'Salvando...' : '✓ Salvar Produto'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-amber-900/40 text-amber-700
              hover:border-amber-700 hover:text-amber-400 text-xs uppercase
              tracking-widest transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

const INPUT = `bg-[#0D0805] border border-amber-900/40 text-amber-100 px-4 py-2.5 text-sm
  focus:outline-none focus:border-amber-600 transition-colors
  placeholder:text-amber-900 w-full`

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1A0F08] border border-amber-900/20 p-6">
      <h2 className="text-amber-500 text-[10px] uppercase tracking-[0.25em] mb-5">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({
  label, children, help, required,
}: {
  label: string
  children: React.ReactNode
  help?: string
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <label className="text-amber-700 text-[11px] uppercase tracking-widest">
          {label}
        </label>
        {help && (
          <span className="text-amber-900 text-[10px]">— {help}</span>
        )}
      </div>
      {children}
    </div>
  )
}
