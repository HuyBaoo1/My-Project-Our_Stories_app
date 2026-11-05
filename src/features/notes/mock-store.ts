import { isDayKey } from '../../lib/date'
import { parseRichText, plainText } from '../../lib/rich-text'
import { createMockNotes, MOCK_MEMBER } from '../../mocks/fixtures'
import type { DiaryNote, RichDocument } from '../../types/diary'
import { isStickerId } from '../stickers/stickerCatalog'
import { getStickerEmoji, isPersonalStickerId } from '../stickers/sticker-reference'
import { discardDayStickerImage, saveDayStickerImage, type PersonalSticker } from '../stickers/personal-stickers'
import { metadataForExistingNotes, metadataForFirstNote, parseDayMetadataMap, type DayMetadata, type DayMetadataMap, type MockActor } from '../stickers/day-metadata'

export const MOCK_STORAGE_KEY = 'our-stories:mock-notes:v1'
type Persistence = Pick<Storage, 'getItem' | 'setItem'>
interface StoredDiary { schemaVersion: 2; notes: DiaryNote[]; dayMetadata: DayMetadataMap }
export class RevisionConflict extends Error {
  readonly current: DiaryNote
  constructor(current: DiaryNote) { super('Ghi chú đã có bản mới. Bản nháp của bạn vẫn được giữ lại.'); this.current = current }
}

function validateNotes(input: unknown): DiaryNote[] {
  if (!Array.isArray(input) || input.length > 500) throw new Error('Dữ liệu mẫu không hợp lệ.')
  return input.map((value: unknown) => {
    if (!value || typeof value !== 'object') throw new Error('Dữ liệu mẫu không hợp lệ.')
    const note = value as DiaryNote
    if (typeof note.id !== 'string' || typeof note.authorUid !== 'string' || typeof note.authorName !== 'string' ||
      typeof note.dayKey !== 'string' || !isDayKey(note.dayKey) || !Number.isInteger(note.revision) || note.revision < 1 ||
      typeof note.createdAt !== 'string' || !Number.isFinite(Date.parse(note.createdAt)) ||
      typeof note.updatedAt !== 'string' || !Number.isFinite(Date.parse(note.updatedAt)) ||
      typeof note.deleted !== 'boolean' || !Array.isArray(note.revisions)) throw new Error('Dữ liệu mẫu không hợp lệ.')
    return { ...note, content: parseRichText(note.content), revisions: note.revisions.map((revision) => {
      if (!Number.isInteger(revision.revision) || typeof revision.editedAt !== 'string' || !Number.isFinite(Date.parse(revision.editedAt)) || !['edit', 'delete'].includes(revision.action)) throw new Error('Lịch sử mẫu không hợp lệ.')
      return { ...revision, content: parseRichText(revision.content) }
    }) }
  })
}

function parseStoredDiary(input: unknown): StoredDiary {
  // Keep the old key and accept its v1 array shape, without rewriting or losing notes.
  if (Array.isArray(input)) {
    const notes = validateNotes(input)
    return { schemaVersion: 2, notes, dayMetadata: metadataForExistingNotes(notes, 'legacy-unknown') }
  }
  if (!input || typeof input !== 'object') throw new Error('Dữ liệu mẫu không hợp lệ.')
  const stored = input as Record<string, unknown>
  if (stored.schemaVersion !== 2) throw new Error('Phiên bản dữ liệu mẫu không được hỗ trợ.')
  const notes = validateNotes(stored.notes)
  return { schemaVersion: 2, notes, dayMetadata: parseDayMetadataMap(stored.dayMetadata, notes) }
}

// A local prototype adapter only. No Firebase imports, writes, authentication or network.
export class MockDiaryStore {
  private notes: DiaryNote[]
  private dayMetadata: DayMetadataMap
  private actor: MockActor
  private persistence: Persistence | undefined
  private listeners = new Set<() => void>()
  constructor(persistence?: Persistence, initial = createMockNotes(), actor: MockActor = MOCK_MEMBER) {
    if (!actor.uid.trim() || !actor.name.trim()) throw new Error('Người viết mẫu không hợp lệ.')
    this.persistence = persistence
    this.actor = { uid: actor.uid, name: actor.name }
    this.notes = initial
    this.dayMetadata = metadataForExistingNotes(initial, 'fixture-order')
    try {
      const saved = persistence?.getItem(MOCK_STORAGE_KEY)
      if (saved && saved.length < 4_000_000) {
        const stored = parseStoredDiary(JSON.parse(saved))
        this.notes = stored.notes
        this.dayMetadata = stored.dayMetadata
      }
    } catch { /* Invalid/unavailable mock storage falls back to explicit fixtures. */ }
  }
  getSnapshot = () => this.notes
  getDayMetadata = (dayKey: string): DayMetadata | undefined => this.dayMetadata[dayKey]
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  private commit(next: DiaryNote[], dayMetadata = this.dayMetadata) {
    // Persist before publishing; quota/disabled-storage errors keep the unsaved editor open.
    const stored: StoredDiary = { schemaVersion: 2, notes: next, dayMetadata }
    this.persistence?.setItem(MOCK_STORAGE_KEY, JSON.stringify(stored))
    this.notes = next
    this.dayMetadata = dayMetadata
    this.listeners.forEach((listener) => listener())
  }
  refreshFromStorage() {
    const saved = this.persistence?.getItem(MOCK_STORAGE_KEY)
    if (!saved || saved.length >= 4_000_000) return
    try {
      const stored = parseStoredDiary(JSON.parse(saved))
      this.notes = stored.notes
      this.dayMetadata = stored.dayMetadata
      this.listeners.forEach((listener) => listener())
    } catch { /* Ignore malformed external local data. */ }
  }
  save(dayKey: string, input: RichDocument, id?: string, expectedRevision?: number): DiaryNote {
    if (!isDayKey(dayKey)) throw new Error('Ngày không hợp lệ.')
    const content = parseRichText(input)
    if (!plainText(content).trim()) throw new Error('Viết một chút gì đó trước khi lưu nhé.')
    this.refreshFromStorage()
    const now = new Date().toISOString()
    if (!id) {
      const note: DiaryNote = { id: crypto.randomUUID(), dayKey, authorUid: this.actor.uid, authorName: this.actor.name,
        content, createdAt: now, updatedAt: now, revision: 1, deleted: false, revisions: [] }
      const metadata = this.dayMetadata[dayKey] ? this.dayMetadata
        : { ...this.dayMetadata, [dayKey]: metadataForFirstNote(note, 'local-commit') }
      this.commit([...this.notes, note], metadata)
      return note
    }
    const current = this.notes.find((note) => note.id === id)
    if (!current) throw new Error('Không tìm thấy ghi chú.')
    if (current.revision !== expectedRevision || current.deleted) throw new RevisionConflict(current)
    if (current.dayKey !== dayKey) throw new Error('Không thể chuyển ngày của ghi chú.')
    const updated: DiaryNote = { ...current, content, updatedAt: now, revision: current.revision + 1,
      revisions: [...current.revisions, { revision: current.revision, content: current.content, editedAt: now, action: 'edit' }] }
    this.commit(this.notes.map((note) => note.id === id ? updated : note))
    return updated
  }
  assignDaySticker(dayKey: string, stickerId: string, actorUid: string): void {
    if (!isStickerId(stickerId) && !getStickerEmoji(stickerId)) throw new Error('Sticker hoặc emoji không hợp lệ.')
    this.commitDaySticker(dayKey, stickerId, actorUid)
  }
  async assignPersonalDaySticker(dayKey: string, sticker: PersonalSticker, actorUid: string): Promise<void> {
    if (!isPersonalStickerId(sticker.id)) throw new Error('Sticker cá nhân không hợp lệ.')
    this.requireFirstWriter(dayKey, actorUid)
    await saveDayStickerImage(sticker)
    try {
      // Recheck after the async image write before assigning the day.
      this.commitDaySticker(dayKey, sticker.id, actorUid)
    } catch (failure) {
      await discardDayStickerImage(sticker.id).catch(() => { /* Preserve the original save error. */ })
      throw failure
    }
  }
  private requireFirstWriter(dayKey: string, actorUid: string): DayMetadata {
    if (!isDayKey(dayKey)) throw new Error('Ngày không hợp lệ.')
    if (actorUid !== this.actor.uid) throw new Error('Người chọn sticker không khớp với phiên mẫu hiện tại.')
    this.refreshFromStorage()
    const current = this.dayMetadata[dayKey]
    if (!current || current.provenance === 'legacy-unknown' || !current.firstWriterUserId) throw new Error('Chưa xác định được người viết đầu tiên của ngày này.')
    if (actorUid !== current.firstWriterUserId) throw new Error('Chỉ người viết đầu tiên được chọn sticker cho ngày này.')
    if (current.representativeStickerId !== null) throw new Error('Sticker của ngày đã được chọn và được giữ lại trong lịch sử.')
    return current
  }
  private commitDaySticker(dayKey: string, stickerId: string, actorUid: string): void {
    const current = this.requireFirstWriter(dayKey, actorUid)
    const now = new Date().toISOString()
    const metadata: DayMetadata = { ...current, representativeStickerId: stickerId, stickerAssignedAt: now, stickerUpdatedAt: now }
    // One localStorage value atomically holds notes and metadata. A new array is
    // necessary for existing useSyncExternalStore note subscribers to see this change.
    this.commit([...this.notes], { ...this.dayMetadata, [dayKey]: metadata })
  }
  softDelete(id: string, expectedRevision: number) {
    this.refreshFromStorage()
    const current = this.notes.find((note) => note.id === id)
    if (!current || current.deleted) throw new Error('Không tìm thấy ghi chú.')
    if (current.revision !== expectedRevision) throw new RevisionConflict(current)
    const now = new Date().toISOString()
    const updated: DiaryNote = { ...current, deleted: true, revision: current.revision + 1, updatedAt: now,
      revisions: [...current.revisions, { revision: current.revision, content: current.content, editedAt: now, action: 'delete' }] }
    this.commit(this.notes.map((note) => note.id === id ? updated : note))
  }
}
