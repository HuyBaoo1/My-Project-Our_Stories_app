import { useEffect, useState } from 'react'
import { getSticker } from './stickerCatalog'
import { getStickerEmoji, isPersonalStickerId } from './sticker-reference'
import { getPersonalSticker, type PersonalSticker } from './personal-stickers'

interface PersonalResolution { id: string; status: 'loaded' | 'missing'; src?: string; thumbnailSrc?: string }

export function useResolvedSticker(id: string | null | undefined, draft?: PersonalSticker | null) {
  const [personal, setPersonal] = useState<PersonalResolution | null>(null)
  const catalog = getSticker(id)
  const emoji = getStickerEmoji(id)
  useEffect(() => {
    if (!isPersonalStickerId(id)) return
    let cancelled = false
    const urls: string[] = []
    const source = draft?.id === id ? Promise.resolve(draft) : getPersonalSticker(id)
    void source.then((sticker) => {
      if (cancelled) return
      if (!sticker) { setPersonal({ id, status: 'missing' }); return }
      const src = URL.createObjectURL(sticker.blob)
      urls.push(src)
      const thumbnailSrc = URL.createObjectURL(sticker.thumbnailBlob)
      urls.push(thumbnailSrc)
      setPersonal({ id, status: 'loaded', src, thumbnailSrc })
    }).catch(() => { if (!cancelled) setPersonal({ id, status: 'missing' }) })
    return () => { cancelled = true; urls.forEach((url) => URL.revokeObjectURL(url)) }
  }, [id, draft])

  if (catalog) return { status: 'loaded' as const, name: catalog.name, src: catalog.src, thumbnailSrc: catalog.thumbnailSrc, emoji: undefined }
  if (emoji) return { status: 'loaded' as const, name: `Emoji ${emoji}`, src: undefined, thumbnailSrc: undefined, emoji }
  if (isPersonalStickerId(id)) {
    const current = personal?.id === id ? personal : null
    return { status: current?.status ?? 'loading', name: 'Sticker của bạn', src: current?.src, thumbnailSrc: current?.thumbnailSrc, emoji: undefined }
  }
  return { status: 'empty' as const, name: '', src: undefined, thumbnailSrc: undefined, emoji: undefined }
}
