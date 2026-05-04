'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type SupplierType = 'rest_api' | 'csv_ftp' | 'webhook' | 'manual'

const TYPE_INFO: Record<SupplierType, { label: string; desc: string; fields: string[] }> = {
  rest_api: {
    label: 'REST API',
    desc: 'Fornecedor com API HTTP que retorna produtos em JSON.',
    fields: ['api_url', 'api_key', 'auth_header'],
  },
  csv_ftp: {
    label: 'CSV / FTP',
    desc: 'Arquivo CSV enviado periodicamente via FTP ou URL pública.',
    fields: ['csv_url', 'ftp_host', 'ftp_user', 'ftp_pass', 'ftp_path'],
  },
  webhook: {
    label: 'Webhook Push',
    desc: 'O fornecedor envia atualizações via webhook para nossa API.',
    fields: ['secret_key'],
  },
  manual: {
    label: 'Manual',
    desc: 'Produtos adicionados manualmente via painel ou importação CSV.',
    fields: [],
  },
}

const INPUT = `bg-[#0D0805] border border-amber-900/40 text-amber-100 px-4 py-2.5 text-sm
  focus:outline-none focus:border-amber-600 transition-colors placeholder:text-amber-900 w-full`

export default function NovoFornecedorPage() {
  const router   = useRouter()
  const supabase =  createClient()

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    name:       '',
    type:       'manual' as SupplierType,
    markup_pct: '40',
    priority:   '10',
    active:     true,
    // Config fields (will be stored as JSONB)
    api_url:     '',
    api_key:     '',
    auth_header: '',
    csv_url:     '',
    ftp_host:    '',
    ftp_user:    '',
    ftp_pass:    '',
    ftp_path:    '',
    secret_key:  '',
  })

  function set(key: keyof typeof form, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Build config object based on type
      const config: Record<string, string> = {}
      const typeInfo = TYPE_INFO[form.type]
      typeInfo.fields.forEach(field => {
        const val = (form as any)[field]
        if (val) config[field] = val
      })

      const { error: err } = await supabase.from('suppliers').insert({
        name:       form.name,
        type:       form.type,
        config,
        markup_pct: parseFloat(form.markup_pct) || 40,
        priority:   parseInt(form.priority) || 10,
        active:     form.active,
      })

      if (err) throw err
      setSuccess(true)
      setTimeout(() => router.push('/admin/fornecedores'), 1500)
    } catch (err: any) {
      setError(err.message ?? 'Erro ao salvar fornecedor.')
    } finally {
      setLoading(false)
    }
  }

  const currentTypeInfo = TYPE_INFO[form.type]

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()}
          className="text-amber-700 hover:text-amber-400 text-xs uppercase tracking-widest transition-colors">
          ← Voltar
        </button>
        <div>
          <h1 className="font-playfair text-2xl text-amber-100">Novo Fornecedor</h1>
          <p className="text-amber-700 text-xs mt-0.5">Cadastrar fonte de produtos</p>
        </div>
      </div>

      {success && (
        <div className="mb-6 bg-green-900/20 border border-green-700/40 px-5 py-3 text-green-300 text-sm">
          ✅ Fornecedor cadastrado! Redirecionando...
        </div>
      )}
      {error && (
        <div className="mb-6 bg-red-900/20 border border-red-700/40 px-5 py-3 text-red-300 text-sm">
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados básicos */}
        <div className="bg-[#1A0F08] border border-amber-900/20 p-6 space-y-4">
          <h2 className="text-amber-500 text-[10px] uppercase tracking-[0.25em] mb-5">Dados do Fornecedor</h2>

          <div>
            <label className="text-amber-700 text-[11px] uppercase tracking-widest block mb-1.5">
              Nome *
            </label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Ex: Importadora Havana LTDA"
              required
              className={INPUT}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-amber-700 text-[11px] uppercase tracking-widest block mb-1.5">
                Markup (%) *
              </label>
              <input
                type="number"
                min="0"
                max="500"
                step="0.5"
                value={form.markup_pct}
                onChange={e => set('markup_pct', e.target.value)}
                className={INPUT}
              />
              <p className="text-amber-900 text-[10px] mt-1">Margem sobre o custo do fornecedor</p>
            </div>
            <div>
              <label className="text-amber-700 text-[11px] uppercase tracking-widest block mb-1.5">
                Prioridade
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={form.priority}
                onChange={e => set('priority', e.target.value)}
                className={INPUT}
              />
              <p className="text-amber-900 text-[10px] mt-1">Menor = maior prioridade</p>
            </div>
          </div>
        </div>

        {/* Tipo de integração */}
        <div className="bg-[#1A0F08] border border-amber-900/20 p-6">
          <h2 className="text-amber-500 text-[10px] uppercase tracking-[0.25em] mb-5">
            Tipo de Integração
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {(Object.entries(TYPE_INFO) as [SupplierType, typeof TYPE_INFO[SupplierType]][]).map(([key, info]) => (
              <button
                key={key}
                type="button"
                onClick={() => set('type', key)}
                className={`p-3 border text-left transition-colors ${
                  form.type === key
                    ? 'border-amber-600 bg-amber-900/20'
                    : 'border-amber-900/30 hover:border-amber-800'
                }`}
              >
                <p className={`text-xs font-medium uppercase tracking-widest ${
                  form.type === key ? 'text-amber-300' : 'text-amber-700'
                }`}>
                  {info.label}
                </p>
              </button>
            ))}
          </div>

          <p className="text-amber-700 text-xs mb-6">{currentTypeInfo.desc}</p>

          {/* Config fields for REST API */}
          {form.type === 'rest_api' && (
            <div className="space-y-4">
              <div>
                <label className="text-amber-700 text-[11px] uppercase tracking-widest block mb-1.5">URL da API</label>
                <input value={form.api_url} onChange={e => set('api_url', e.target.value)}
                  placeholder="https://api.fornecedor.com/v1/products" className={INPUT} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-amber-700 text-[11px] uppercase tracking-widest block mb-1.5">API Key</label>
                  <input value={form.api_key} onChange={e => set('api_key', e.target.value)}
                    placeholder="sk-..." type="password" className={INPUT} />
                </div>
                <div>
                  <label className="text-amber-700 text-[11px] uppercase tracking-widest block mb-1.5">Header de Auth</label>
                  <input value={form.auth_header} onChange={e => set('auth_header', e.target.value)}
                    placeholder="Authorization" className={INPUT} />
                </div>
              </div>
            </div>
          )}

          {/* Config fields for CSV/FTP */}
          {form.type === 'csv_ftp' && (
            <div className="space-y-4">
              <div>
                <label className="text-amber-700 text-[11px] uppercase tracking-widest block mb-1.5">URL do CSV (se público)</label>
                <input value={form.csv_url} onChange={e => set('csv_url', e.target.value)}
                  placeholder="https://fornecedor.com/produtos.csv" className={INPUT} />
              </div>
              <p className="text-amber-800 text-[11px] uppercase tracking-widest">Ou configuração FTP:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-amber-700 text-[11px] uppercase tracking-widest block mb-1.5">Host FTP</label>
                  <input value={form.ftp_host} onChange={e => set('ftp_host', e.target.value)}
                    placeholder="ftp.fornecedor.com" className={INPUT} />
                </div>
                <div>
                  <label className="text-amber-700 text-[11px] uppercase tracking-widest block mb-1.5">Usuário FTP</label>
                  <input value={form.ftp_user} onChange={e => set('ftp_user', e.target.value)} className={INPUT} />
                </div>
                <div>
                  <label className="text-amber-700 text-[11px] uppercase tracking-widest block mb-1.5">Senha FTP</label>
                  <input value={form.ftp_pass} onChange={e => set('ftp_pass', e.target.value)}
                    type="password" className={INPUT} />
                </div>
                <div>
                  <label className="text-amber-700 text-[11px] uppercase tracking-widest block mb-1.5">Caminho do arquivo</label>
                  <input value={form.ftp_path} onChange={e => set('ftp_path', e.target.value)}
                    placeholder="/exports/produtos.csv" className={INPUT} />
                </div>
              </div>
            </div>
          )}

          {/* Config for Webhook */}
          {form.type === 'webhook' && (
            <div>
              <label className="text-amber-700 text-[11px] uppercase tracking-widest block mb-1.5">
                Chave Secreta do Webhook
              </label>
              <input value={form.secret_key} onChange={e => set('secret_key', e.target.value)}
                type="password" placeholder="Chave para validar requisições" className={INPUT} />
              <div className="mt-4 bg-[#0D0805] border border-amber-900/30 p-4">
                <p className="text-amber-600 text-xs uppercase tracking-widest mb-2">Endpoint do Webhook</p>
                <code className="text-amber-400 text-xs font-mono">
                  POST /api/webhooks/suppliers
                </code>
                <p className="text-amber-800 text-[11px] mt-2">
                  Envie para este endpoint com o header <code className="text-amber-700">X-Supplier-Secret</code>
                </p>
              </div>
            </div>
          )}

          {/* Manual = no config needed */}
          {form.type === 'manual' && (
            <div className="bg-[#0D0805] border border-amber-900/20 p-4">
              <p className="text-amber-700 text-xs">
                Fornecedor manual não requer configuração de integração.
                Produtos serão adicionados via painel admin ou importação de CSV.
              </p>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="bg-[#1A0F08] border border-amber-900/20 p-6">
          <h2 className="text-amber-500 text-[10px] uppercase tracking-[0.25em] mb-4">Status</h2>
          <label className="flex items-center gap-3 cursor-pointer" onClick={() => set('active', !form.active)}>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${form.active ? 'bg-amber-600' : 'bg-amber-900/40'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-amber-400 text-sm">{form.active ? 'Fornecedor ativo' : 'Fornecedor inativo'}</span>
          </label>
        </div>

        <div className="flex gap-4 pt-2">
          <button type="submit" disabled={loading}
            className="px-8 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50
              text-[#0D0805] text-xs font-bold uppercase tracking-widest transition-colors">
            {loading ? 'Salvando...' : '✓ Cadastrar Fornecedor'}
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
