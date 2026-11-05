import { useEffect, useState } from 'react'
import { getSticker } from './stickerCatalog'
import { getStickerEmoji, isPersonalStickerId } from './sticker-reference'
import { getPersonalSticker } from './personal-stickers'

interface PersonalResolution { id: string; status: 'loaded' | 'missing'; src?: string; thumbnailSrc?: string }

export function useResolvedSticker(id: string | null | undefined) {
  const [personal, setPersonal] = useState<PersonalResolution | null>(null)
  const catalog = getSticker(id)
  const emoji = getStickerEmoji(id)
  useEffect(() => {
    if (!isPersonalStickerId(id)) return
    let cancelled = false
    const urls: string[] = []
    void getPersonalSticker(id).then((sticker) => {
      if (cancelled) return
      if (!sticker) { setPersonal({ id, status: 'missing' }); return }
      const src = URL.createObjectURL(sticker.blob)
      const thumbnailSrc = URL.createObjectURL(sticker.thumbnailBlob)
      urls.push(src, thumbnailSrc)
      setPersonal({ id, status: 'loaded', src, thumbnailSrc })
    }).catch(() => { if (!cancelled) setPersonal({ id, status: 'missing' }) })
    return () => { cancelled = true; urls.forEach((url) => URL.revokeObjectURL(url)) }
  }, [id])

  if (catalog) return { status: 'loaded' as const, name: catalog.name, src: catalog.src, thumbnailSrc: catalog.thumbnailSrc, emoji: undefined }
  if (emoji) return { status: 'loaded' as const, name: `Emoji ${emoji}`, src: undefined, thumbnailSrc: undefined, emoji }
  if (isPersonalStickerId(id)) {
    const current = personal?.id === id ? personal : null
    return { status: current?.status ?? 'loading', name: 'Sticker của bạn', src: current?.src, thumbnailSrc: current?.thumbnailSrc, emoji: undefined }
  }
  return { status: 'empty' as const, name: '', src: undefined, thumbnailSrc: undefined, emoji: undefined }
}
