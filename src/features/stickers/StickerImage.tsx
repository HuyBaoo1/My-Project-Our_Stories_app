import { useState } from 'react'
import { ImageOff } from 'lucide-react'

interface Props {
  src: string
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
  onLoadSuccess?: () => void
  onLoadError?: () => void
}

function LoadingImage({ src, alt, className = '', loading = 'lazy', onLoadSuccess, onLoadError }: Props) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  return <span className={`sticker-image ${className}`} data-image-state={status}>
    {status === 'loading' && <span className="sticker-image-placeholder" aria-hidden="true" />}
    {status !== 'error' && <img src={src} alt={alt} loading={loading} decoding="async" width={96} height={96}
      onLoad={() => { setStatus('loaded'); onLoadSuccess?.() }}
      onError={() => { setStatus('error'); onLoadError?.() }} />}
    {status === 'error' && <span className="sticker-image-error" role={alt ? 'img' : undefined} aria-label={alt ? `Không tải được sticker: ${alt}` : undefined}><ImageOff aria-hidden="true" /><span>Ảnh chưa tải được</span></span>}
  </span>
}

export function StickerImage(props: Props) {
  return <LoadingImage key={props.src} {...props} />
}
