import { describe, expect, it } from 'vitest'
import { MockDiaryStore } from '../../src/features/notes/mock-store'
import { textDocument } from '../../src/lib/rich-text'
import { emojiStickerId, getStickerEmoji, isPersonalStickerId, isSingleEmoji, isStickerReferenceId } from '../../src/features/stickers/sticker-reference'

describe('personal sticker references', () => {
  it.each(['🌿', '☕', '👨‍👩‍👧‍👦', '👍🏽', '🇻🇳', '1️⃣'])('round-trips one keyboard emoji %s', (emoji) => {
    expect(isSingleEmoji(emoji)).toBe(true)
    expect(getStickerEmoji(emojiStickerId(emoji))).toBe(emoji)
    expect(isStickerReferenceId(emojiStickerId(emoji))).toBe(true)
  })
  it.each(['', 'hello', '☕🌿', ' ☕', '<img src=x>', 'javascript:alert(1)'])('rejects non-sticker input %s', (input) => {
    expect(isSingleEmoji(input)).toBe(false)
    expect(() => emojiStickerId(input)).toThrow()
  })
  it('rejects malformed IDs and accepts the old catalog alongside local references', () => {
    expect(getStickerEmoji('emoji:%E0%A4%A')).toBeUndefined()
    expect(getStickerEmoji('emoji:hello')).toBeUndefined()
    expect(isPersonalStickerId('personal-1')).toBe(false)
    expect(isPersonalStickerId('personal-123e4567-e89b-42d3-a456-426614174000')).toBe(true)
    expect(isStickerReferenceId('sticker-014')).toBe(true)
    expect(isStickerReferenceId('https://example.com/sticker.png')).toBe(false)
  })
  it('preserves keyboard emoji metadata through a reload and a soft-delete', () => {
    const data = new Map<string, string>()
    const persistence = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value) } }
    const actor = { uid: 'mock-owner', name: 'Writer' }
    const store = new MockDiaryStore(persistence, [], actor)
    const note = store.save('2024-02-29', textDocument('Keyboard memory'))
    const id = emojiStickerId('🌿')
    store.assignDaySticker('2024-02-29', id, actor.uid)
    store.softDelete(note.id, 1)
    const reloaded = new MockDiaryStore(persistence, [], actor)
    expect(reloaded.getDayMetadata('2024-02-29')?.representativeStickerId).toBe(id)
    expect(reloaded.getDayMetadata('2024-02-29')?.firstWriterUserId).toBe(actor.uid)
    expect(() => reloaded.assignDaySticker('2024-02-29', emojiStickerId('💛'), actor.uid)).toThrow()
  })
})
