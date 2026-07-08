'use client'

import { useState, useRef } from 'react'
import { CheckCircle, XCircle, Star, Eye, Play } from 'lucide-react'

interface ReviewModerationCardProps {
  review: {
    id: string
    video_url: string
    thumbnail_url: string | null
    rating: number
    caption: string | null
    created_at: string
    product: { name: string; images: string[] } | null
    user: { full_name: string; avatar_url: string | null } | null
  }
  onApprove: (id: string) => void
  onReject:  (id: string, reason: string) => void
}

export function ReviewModerationCard({ review, onApprove, onReject }: ReviewModerationCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing,    setPlaying]    = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [reason,     setReason]     = useState('')
  const [loading,    setLoading]    = useState<'approve' | 'reject' | null>(null)

  function togglePlay() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPlaying(true) }
    else          { v.pause(); setPlaying(false) }
  }

  async function handleApprove() {
    setLoading('approve')
    await onApprove(review.id)
    setLoading(null)
  }

  async function handleReject() {
    if (!reason.trim()) return
    setLoading('reject')
    await onReject(review.id, reason)
    setLoading(null)
  }

  return (
    <div className="bg-white border border-[#E8DCC8] rounded-2xl shadow-sm overflow-hidden">
      {/* Vídeo */}
      <div className="relative aspect-[9/14] sm:aspect-video bg-black cursor-pointer" onClick={togglePlay}>
        <video
          ref={videoRef}
          src={review.video_url}
          poster={review.thumbnail_url ?? undefined}
          className="w-full h-full object-contain"
          onEnded={() => setPlaying(false)}
        />
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-black/50 flex items-center justify-center">
              <Play size={24} className="text-white fill-white ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        {/* User + produto */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#F5EFE6] border border-[#E8DCC8] flex items-center justify-center text-[#C08D3A] text-xs font-bold flex-shrink-0">
              {(review.user?.full_name ?? 'U')[0].toUpperCase()}
            </div>
            <div>
              <p className="text-[#1C1008] text-xs font-semibold">{review.user?.full_name ?? '—'}</p>
              <p className="text-[#B0916A] text-[10px]">{new Date(review.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={11}
                className={s <= review.rating ? 'text-[#C08D3A] fill-[#C08D3A]' : 'text-[#D9C9A8]'} />
            ))}
          </div>
        </div>

        {review.product && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-[#FAF7F2] rounded-xl border border-[#F0E8D8]">
            {review.product.images?.[0] && (
              <img src={review.product.images[0]} alt={review.product.name}
                className="w-8 h-8 object-cover rounded-lg border border-[#E8DCC8] flex-shrink-0" />
            )}
            <p className="text-[#6B4F2A] text-xs truncate">{review.product.name}</p>
          </div>
        )}

        {review.caption && (
          <p className="text-[#6B4F2A] text-xs mb-4 leading-relaxed line-clamp-3 italic">
            "{review.caption}"
          </p>
        )}

        {/* Ações */}
        {!showReject ? (
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={loading !== null}
              className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white
                text-xs font-bold uppercase tracking-widest rounded-xl transition-colors
                flex items-center justify-center gap-1.5"
            >
              {loading === 'approve' ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle size={14} />
              )}
              Aprovar
            </button>
            <button
              onClick={() => setShowReject(true)}
              disabled={loading !== null}
              className="flex-1 py-2.5 border border-red-200 text-red-500 hover:bg-red-50
                text-xs font-bold uppercase tracking-widest rounded-xl transition-colors
                flex items-center justify-center gap-1.5"
            >
              <XCircle size={14} />
              Rejeitar
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Motivo da rejeição (será enviado ao cliente)..."
              rows={2}
              className="w-full bg-white border border-[#E8DCC8] rounded-xl text-[#1C1008] px-3 py-2
                text-xs focus:outline-none focus:border-red-300 transition-colors placeholder:text-[#B0916A] resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleReject}
                disabled={loading !== null || !reason.trim()}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white
                  text-xs font-bold uppercase tracking-widest rounded-xl transition-colors"
              >
                {loading === 'reject' ? 'Rejeitando...' : 'Confirmar rejeição'}
              </button>
              <button
                onClick={() => { setShowReject(false); setReason('') }}
                className="px-3 py-2 border border-[#D9C9A8] rounded-xl text-[#6B4F2A] hover:bg-[#F5EFE6] text-xs transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}