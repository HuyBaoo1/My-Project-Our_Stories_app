import { isStickerId } from './stickerCatalog'

export type PersonalStickerId = `personal-${string}`
export type EmojiStickerId = `emoji:${string}`

export function isPersonalStickerId(value: unknown): value is PersonalStickerId {
  return typeof value === 'string' && /^personal-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value)
}

export function isSingleEmoji(value: string): boolean {
  if (!value || value.length > 64 || value !== value.trim()) return false
  const parts = [...new Intl.Segmenter('vi', { granularity: 'grapheme' }).segment(value)]
  return parts.length === 1 && (/\p{Extended_Pictographic}/u.test(value) || /^\p{Regional_Indicator}{2}$/u.test(value) || /^[#*0-9]\ufe0f?\u20e3$/u.test(value))
}

export function emojiStickerId(emoji: string): EmojiStickerId {
  if (!isSingleEmoji(emoji)) throw new Error('Hãy nhập một emoji để làm sticker cho ngày.')
  return `emoji:${encodeURIComponent(emoji)}`
}

export function getStickerEmoji(id: unknown): string | undefined {
  if (typeof id !== 'string' || !id.startsWith('emoji:') || id.length > 600) return undefined
  try {
    const emoji = decodeURIComponent(id.slice(6))
    return isSingleEmoji(emoji) && emojiStickerId(emoji) === id ? emoji : undefined
  } catch { return undefined }
}

export function isStickerReferenceId(value: unknown): value is string {
  return isStickerId(value) || isPersonalStickerId(value) || getStickerEmoji(value) !== undefined
}
