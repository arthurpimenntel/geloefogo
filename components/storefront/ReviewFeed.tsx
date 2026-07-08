'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { Heart, Volume2, VolumeX, Star, ShoppingBag, Share2, Play } from 'lucide-react'

interface Review {
  id: string
  video_url: string
  thumbnail_url: string | null
  rating: number
  caption: string | null
  views: number
  likes: number
  created_at: string
  product: { id: string; name: string; slug: string; images: string[] } | null
  user: { id: string; full_name: string; avatar_url: string | null } | null
}

interface ReviewFeedProps {
  reviews: Review[]
  initialIndex?: number
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={11}
          className={s <= rating ? 'text-[#C9A96E] fill-[#C9A96E]' : 'text-white/30'} />
      ))}
    </div>
  )
}

function VideoCard({
  review,
  isActive,
  globalMuted,
  onToggleMute,
}: {
  review: Review
  isActive: boolean
  globalMuted: boolean
  onToggleMute: () => void
}) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying]   = useState(false)
  const [liked,   setLiked]     = useState(false)
  const [likes,   setLikes]     = useState(review.likes)
  const [shared,  setShared]    = useState(false)
  const [progress, setProgress] = useState(0)

  // Autoplay when active
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (isActive) {
      v.currentTime = 0
      v.play().then(() => setPlaying(true)).catch(() => {})
    } else {
      v.pause()
      v.currentTime = 0
      setPlaying(false)
    }
  }, [isActive])

  // Sync mute
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = globalMuted
  }, [globalMuted])

  // Progress bar
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const update = () => setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0)
    v.addEventListener('timeupdate', update)
    return () => v.removeEventListener('timeupdate', update)
  }, [])

  function togglePlay() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPlaying(true) }
    else          { v.pause(); setPlaying(false) }
  }

  async function handleLike() {
    setLiked(l => !l)
    setLikes(n => liked ? n - 1 : n + 1)
    try {
      await fetch(`/api/reviews/${review.id}/like`, { method: 'POST' })
    } catch {}
  }

  async function handleShare() {
    const url = `${window.location.origin}/produto/${review.product?.slug}`
    if (navigator.share) {
      try { await navigator.share({ title: review.product?.name, url }) } catch {}
    } else {
      await navigator.clipboard.writeText(url).catch(() => {})
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none">
      {/* Video */}
      <video
        ref={videoRef}
        src={review.video_url}
        poster={review.thumbnail_url ?? undefined}
        loop
        muted={globalMuted}
        playsInline
        onClick={togglePlay}
        className="absolute inset-0 w-full h-full object-cover cursor-pointer"
      />

      {/* Play overlay */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Play size={28} className="text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20">
        <div
          className="h-full bg-[#C9A96E] transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent" />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-4 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#C9A96E]/20 border border-[#C9A96E]/40 overflow-hidden flex-shrink-0">
            {review.user?.avatar_url ? (
              <img src={review.user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#C9A96E] text-xs font-bold">
                {(review.user?.full_name ?? 'U')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="text-white text-xs font-semibold leading-tight">
              {review.user?.full_name ?? 'Cliente'}
            </p>
            <StarRating rating={review.rating} />
          </div>
        </div>
        <button onClick={onToggleMute}
          className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
          {globalMuted
            ? <VolumeX size={14} className="text-white" />
            : <Volume2 size={14} className="text-white" />}
        </button>
      </div>

      {/* Right actions */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-10">
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all
            ${liked ? 'bg-rose-500/90' : 'bg-black/40 backdrop-blur-sm'}`}>
            <Heart size={18} className={liked ? 'text-white fill-white' : 'text-white'} />
          </div>
          <span className="text-white text-[10px] font-medium">{likes.toLocaleString()}</span>
        </button>

        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all
            ${shared ? 'bg-green-500/90' : 'bg-black/40 backdrop-blur-sm'}`}>
            <Share2 size={16} className="text-white" />
          </div>
          <span className="text-white text-[10px] font-medium">{shared ? 'Copiado!' : 'Partilhar'}</span>
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-6 left-4 right-16 z-10">
        {review.product && (
          <Link href={`/produto/${review.product.slug}`}
            className="flex items-center gap-2 mb-3 group w-fit">
            {review.product.images?.[0] && (
              <img src={review.product.images[0]} alt={review.product.name}
                className="w-10 h-10 object-cover rounded-lg border border-white/20 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-white/60 text-[9px] uppercase tracking-widest">Produto avaliado</p>
              <p className="text-white text-xs font-semibold truncate max-w-[180px] group-hover:text-[#C9A96E] transition-colors">
                {review.product.name}
              </p>
            </div>
            <div className="w-7 h-7 rounded-full bg-[#C9A96E] flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <ShoppingBag size={12} className="text-[#1C1C1C]" />
            </div>
          </Link>
        )}
        {review.caption && (
          <p className="text-white/85 text-sm leading-snug line-clamp-3">
            {review.caption}
          </p>
        )}
      </div>
    </div>
  )
}

export function ReviewFeed({ reviews, initialIndex = 0 }: ReviewFeedProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const [muted, setMuted]             = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  // Intersection Observer para detectar qual vídeo está visível
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const cards = container.querySelectorAll('[data-review-index]')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const idx = parseInt((entry.target as HTMLElement).dataset.reviewIndex ?? '0')
            setActiveIndex(idx)
          }
        })
      },
      { threshold: 0.5 }
    )
    cards.forEach(card => observer.observe(card))
    return () => observer.disconnect()
  }, [reviews])

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-[#8B7355]">
        <div className="text-5xl mb-4">🎬</div>
        <p className="font-serif text-lg">Nenhum vídeo ainda</p>
        <p className="text-sm mt-1 text-[#B8A898]">Seja o primeiro a avaliar!</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-none"
      style={{ scrollbarWidth: 'none' }}
    >
      {reviews.map((review, i) => (
        <div
          key={review.id}
          data-review-index={i}
          className="w-full h-full snap-start snap-always flex-shrink-0"
        >
          <VideoCard
            review={review}
            isActive={i === activeIndex}
            globalMuted={muted}
            onToggleMute={() => setMuted(m => !m)}
          />
        </div>
      ))}
    </div>
  )
}