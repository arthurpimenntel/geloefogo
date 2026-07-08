'use client'

import { useState, useEffect } from 'react'
import { ReviewModerationCard } from '@/components/admin/ReviewModerationCard'
import { CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react'

type StatusFilter = 'pending' | 'approved' | 'rejected'

interface Review {
  id: string
  video_url: string
  thumbnail_url: string | null
  rating: number
  caption: string | null
  created_at: string
  status: string
  product: { name: string; images: string[] } | null
  user: { full_name: string; avatar_url: string | null } | null
}

export default function AdminAvaliacoesPage() {
  const [reviews,   setReviews]   = useState<Review[]>([])
  const [filter,    setFilter]    = useState<StatusFilter>('pending')
  const [loading,   setLoading]   = useState(true)
  const [counts,    setCounts]    = useState({ pending: 0, approved: 0, rejected: 0 })

  async function loadReviews(status: StatusFilter) {
    setLoading(true)
    try {
      const res  = await fetch(`/api/reviews?status=${status}&limit=50`)
      const data = await res.json()
      setReviews(data.reviews ?? [])
    } catch {}
    finally { setLoading(false) }
  }

  async function loadCounts() {
    try {
      const [p, a, r] = await Promise.all([
        fetch('/api/reviews?status=pending&limit=1').then(r => r.json()),
        fetch('/api/reviews?status=approved&limit=1').then(r => r.json()),
        fetch('/api/reviews?status=rejected&limit=1').then(r => r.json()),
      ])
      setCounts({
        pending:  p.total ?? p.reviews?.length ?? 0,
        approved: a.total ?? a.reviews?.length ?? 0,
        rejected: r.total ?? r.reviews?.length ?? 0,
      })
    } catch {}
  }

  useEffect(() => { loadReviews(filter) }, [filter])
  useEffect(() => { loadCounts() }, [])

  async function handleApprove(id: string) {
    const res  = await fetch(`/api/reviews/${id}/approve`, { method: 'PATCH' })
    const data = await res.json()
    if (res.ok) {
      setReviews(prev => prev.filter(r => r.id !== id))
      if (data.coupon_code) {
        // Toast-like: poderia usar um toast real aqui
        alert(`✅ Aprovado! Cupom gerado: ${data.coupon_code}`)
      }
    }
  }

  async function handleReject(id: string, reason: string) {
    const res = await fetch(`/api/reviews/${id}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    if (res.ok) {
      setReviews(prev => prev.filter(r => r.id !== id))
    }
  }

  const TABS: { id: StatusFilter; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'pending',  label: 'Pendentes',  icon: <Clock size={14} />,        count: counts.pending },
    { id: 'approved', label: 'Aprovadas',  icon: <CheckCircle size={14} />,  count: counts.approved },
    { id: 'rejected', label: 'Rejeitadas', icon: <XCircle size={14} />,      count: counts.rejected },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="font-playfair text-2xl text-[#1C1008]">Avaliações em Vídeo</h1>
          <p className="text-[#8C6D3F] text-sm mt-1">Modere os vídeos antes de publicar no feed</p>
        </div>
        <button
          onClick={() => loadReviews(filter)}
          className="flex items-center gap-2 px-4 py-2 border border-[#D9C9A8] rounded-xl
            text-[#6B4F2A] hover:border-[#C08D3A] hover:bg-[#F5EFE6] text-xs uppercase tracking-widest transition-all"
        >
          <RefreshCw size={13} />
          Atualizar
        </button>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex flex-col sm:flex-row items-center sm:items-start gap-3 p-4 rounded-2xl border
              text-left transition-all ${
                filter === tab.id
                  ? 'border-[#C08D3A] bg-[#F5EFE6] shadow-sm'
                  : 'border-[#E8DCC8] bg-white hover:border-[#C08D3A]/40'
              }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
              tab.id === 'pending'  ? 'bg-amber-50 text-amber-600' :
              tab.id === 'approved' ? 'bg-green-50 text-green-600' :
              'bg-red-50 text-red-500'
            }`}>
              {tab.icon}
            </div>
            <div>
              <p className="font-playfair text-2xl text-[#1C1008]">{tab.count}</p>
              <p className="text-[#8C6D3F] text-xs uppercase tracking-widest">{tab.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-20 text-[#B0916A] text-sm animate-pulse">Carregando avaliações...</div>
      ) : reviews.length === 0 ? (
        <div className="bg-white border border-[#E8DCC8] rounded-2xl shadow-sm p-16 text-center">
          <div className="text-5xl mb-4">🎬</div>
          <p className="text-[#8C6D3F] font-playfair text-xl mb-1">
            Nenhuma avaliação {filter === 'pending' ? 'pendente' : filter === 'approved' ? 'aprovada' : 'rejeitada'}
          </p>
          <p className="text-[#B0916A] text-sm">
            {filter === 'pending' ? 'Tudo em dia! Nenhum vídeo aguardando moderação.' : ''}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map(review => (
            <ReviewModerationCard
              key={review.id}
              review={review}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  )
}