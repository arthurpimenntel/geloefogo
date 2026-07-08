'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Star, Upload, X, Play, CheckCircle } from 'lucide-react'

interface EligibleProduct {
  product_id: string
  order_id: string
  product_name: string
  product_image: string | null
  order_date: string
  already_reviewed: boolean
}

interface ReviewUploadProps {
  eligibleProducts: EligibleProduct[]
  onSuccess?: () => void
}

const STARS = [1, 2, 3, 4, 5]

export function ReviewUpload({ eligibleProducts, onSuccess }: ReviewUploadProps) {
  const supabase = createClient()
  const fileRef  = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [step, setStep]         = useState<'select' | 'record' | 'done'>('select')
  const [selected, setSelected] = useState<EligibleProduct | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [rating, setRating]     = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [caption, setCaption]   = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError]       = useState<string | null>(null)

  const available = eligibleProducts.filter(p => !p.already_reviewed)
  const reviewed  = eligibleProducts.filter(p => p.already_reviewed)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 100 * 1024 * 1024) {
      setError('Vídeo muito grande. Máximo: 100MB.')
      return
    }
    if (!file.type.startsWith('video/')) {
      setError('Apenas arquivos de vídeo são aceitos.')
      return
    }

    setError(null)
    setVideoFile(file)
    const url = URL.createObjectURL(file)
    setVideoPreview(url)
  }

  function clearVideo() {
    setVideoFile(null)
    if (videoPreview) URL.revokeObjectURL(videoPreview)
    setVideoPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit() {
    if (!selected || !videoFile || rating === 0) {
      setError('Selecione o produto, o vídeo e a nota.')
      return
    }

    setUploading(true)
    setError(null)
    setUploadProgress(10)

    try {
      // 1. Upload do vídeo para Supabase Storage
      const ext      = videoFile.name.split('.').pop() ?? 'mp4'
      const filename = `${selected.product_id}/${Date.now()}.${ext}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('review-videos')
        .upload(filename, videoFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw new Error('Erro no upload: ' + uploadError.message)
      setUploadProgress(70)

      // 2. Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('review-videos')
        .getPublicUrl(uploadData.path)

      setUploadProgress(85)

      // 3. Criar avaliação via API
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selected.product_id,
          order_id:   selected.order_id,
          video_url:  publicUrl,
          rating,
          caption:    caption.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao enviar avaliação.')

      setUploadProgress(100)
      setStep('done')
      onSuccess?.()

    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  // ── Step: produto selecionado ──
  if (step === 'done') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mb-6">
          <CheckCircle size={36} className="text-green-500" />
        </div>
        <h3 className="font-playfair text-2xl text-[#1C1008] mb-2">Avaliação enviada!</h3>
        <p className="text-[#8C6D3F] text-sm mb-2 max-w-xs">
          Sua avaliação está em análise. Após aprovação, você receberá um cupom de <strong className="text-[#C08D3A]">15% de desconto</strong>.
        </p>
        <p className="text-[#B0916A] text-xs">Prazo de análise: até 48 horas.</p>
        <button
          onClick={() => { setStep('select'); setSelected(null); setVideoFile(null); setVideoPreview(null); setRating(0); setCaption('') }}
          className="mt-8 px-6 py-2.5 border border-[#D9C9A8] rounded-xl text-[#6B4F2A] hover:border-[#C08D3A] hover:bg-[#F5EFE6] text-xs uppercase tracking-widest transition-colors"
        >
          Avaliar outro produto
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Produtos disponíveis para avaliar */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <p className="text-[#8C6D3F] text-[10px] uppercase tracking-[0.25em] font-medium">
            Produtos que você pode avaliar
          </p>
          {available.length > 0 && (
            <span className="bg-[#C08D3A] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
              {available.length}
            </span>
          )}
        </div>

        {available.length === 0 ? (
          <div className="bg-[#FAF7F2] border border-[#E8DCC8] rounded-2xl p-8 text-center">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-[#8C6D3F] text-sm font-medium">Nenhum produto disponível</p>
            <p className="text-[#B0916A] text-xs mt-1">
              Você precisa ter comprado um produto (com pagamento confirmado) para poder avaliá-lo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {available.map(p => (
              <button
                key={p.product_id}
                onClick={() => setSelected(p)}
                className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                  selected?.product_id === p.product_id
                    ? 'border-[#C08D3A] bg-[#F5EFE6] shadow-sm'
                    : 'border-[#E8DCC8] bg-white hover:border-[#C08D3A]/50 hover:bg-[#FAF7F2]'
                }`}
              >
                {p.product_image ? (
                  <img src={p.product_image} alt={p.product_name}
                    className="w-12 h-12 object-cover rounded-xl border border-[#E8DCC8] flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 bg-[#F5EFE6] rounded-xl flex items-center justify-center text-[#C4A97A] flex-shrink-0">◆</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[#1C1008] text-xs font-semibold truncate">{p.product_name}</p>
                  <p className="text-[#B0916A] text-[10px] mt-0.5">
                    Comprado em {new Date(p.order_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                {selected?.product_id === p.product_id && (
                  <div className="w-5 h-5 rounded-full bg-[#C08D3A] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[10px]">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Formulário — só aparece se produto selecionado */}
      {selected && (
        <div className="bg-white border border-[#E8DCC8] rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-[#F0E8D8]">
            <div className="w-2 h-2 rounded-full bg-[#C08D3A]" />
            <p className="text-[#1C1008] text-sm font-medium">{selected.product_name}</p>
          </div>

          {/* Upload de vídeo */}
          <div>
            <label className="text-[#8C6D3F] text-[10px] uppercase tracking-widest font-medium block mb-3">
              Seu vídeo de avaliação *
            </label>

            {!videoPreview ? (
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-[#D9C9A8] hover:border-[#C08D3A] rounded-2xl
                  p-10 text-center cursor-pointer transition-colors group"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#FAF7F2] border border-[#E8DCC8] flex items-center
                  justify-center mx-auto mb-3 group-hover:border-[#C08D3A] transition-colors">
                  <Upload size={22} className="text-[#8C6D3F]" />
                </div>
                <p className="text-[#6B4F2A] text-sm font-medium mb-1">Clique para selecionar o vídeo</p>
                <p className="text-[#B0916A] text-xs">MP4, MOV, WEBM · Máximo 100MB · Até 60 segundos</p>
                <input ref={fileRef} type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-[#E8DCC8] bg-black">
                <video
                  ref={videoRef}
                  src={videoPreview}
                  controls
                  className="w-full max-h-72 object-contain"
                />
                <button
                  onClick={clearVideo}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <X size={14} className="text-white" />
                </button>
                <div className="absolute bottom-3 left-3 bg-black/60 rounded-lg px-2 py-1">
                  <p className="text-white text-[10px]">{videoFile?.name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Nota */}
          <div>
            <label className="text-[#8C6D3F] text-[10px] uppercase tracking-widest font-medium block mb-3">
              Sua nota *
            </label>
            <div className="flex gap-2">
              {STARS.map(s => (
                <button
                  key={s}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    size={28}
                    className={`transition-colors ${
                      s <= (hoverRating || rating)
                        ? 'text-[#C08D3A] fill-[#C08D3A]'
                        : 'text-[#D9C9A8]'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="text-[#8C6D3F] text-sm self-center ml-2">
                  {['', 'Muito ruim', 'Ruim', 'Regular', 'Bom', 'Excelente!'][rating]}
                </span>
              )}
            </div>
          </div>

          {/* Legenda */}
          <div>
            <label className="text-[#8C6D3F] text-[10px] uppercase tracking-widest font-medium block mb-2">
              Legenda (opcional)
            </label>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              maxLength={280}
              rows={3}
              placeholder="Conte brevemente sua experiência com o produto..."
              className="w-full bg-white border border-[#E8DCC8] rounded-xl text-[#1C1008] px-4 py-2.5 text-sm
                focus:outline-none focus:border-[#C08D3A] transition-colors placeholder:text-[#B0916A] resize-none"
            />
            <p className="text-[#B0916A] text-[10px] mt-1 text-right">{caption.length}/280</p>
          </div>

          {/* Desconto info */}
          <div className="flex items-center gap-3 bg-[#FAF7F2] border border-[#E8DCC8] rounded-xl px-4 py-3">
            <span className="text-2xl">🎁</span>
            <div>
              <p className="text-[#1C1008] text-xs font-semibold">Ganhe 15% de desconto</p>
              <p className="text-[#8C6D3F] text-[10px]">Após aprovação da sua avaliação, um cupom será enviado automaticamente.</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
              ❌ {error}
            </div>
          )}

          {/* Botão enviar */}
          <button
            onClick={handleSubmit}
            disabled={uploading || !videoFile || rating === 0}
            className="w-full py-3.5 bg-[#1C1008] hover:bg-[#3D2010] disabled:opacity-40
              text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors
              flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enviando... {uploadProgress}%
              </>
            ) : (
              'Enviar avaliação'
            )}
          </button>
        </div>
      )}

      {/* Já avaliados */}
      {reviewed.length > 0 && (
        <div>
          <p className="text-[#B0916A] text-[10px] uppercase tracking-[0.25em] mb-3">Já avaliados por você</p>
          <div className="space-y-2">
            {reviewed.map(p => (
              <div key={p.product_id}
                className="flex items-center gap-3 p-3 rounded-xl border border-[#F0E8D8] bg-[#FAF7F2] opacity-60">
                {p.product_image && (
                  <img src={p.product_image} alt={p.product_name} className="w-9 h-9 object-cover rounded-lg border border-[#E8DCC8] flex-shrink-0" />
                )}
                <p className="text-[#6B4F2A] text-xs flex-1 truncate">{p.product_name}</p>
                <span className="text-[#C08D3A] text-[10px] font-medium">✓ Avaliado</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}