import { isDayKey } from '../../lib/date'
import { parseRichText, plainText } from '../../lib/rich-text'
import { createMockNotes, MOCK_MEMBER } from '../../mocks/fixtures'
import type { DiaryNote, RichDocument } from '../../types/diary'

export const MOCK_STORAGE_KEY = 'our-stories:mock-notes:v1'
type Persistence = Pick<Storage, 'getItem' | 'setItem'>
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

// A local prototype adapter only. No Firebase imports, writes, authentication or network.
export class MockDiaryStore {
  private notes: DiaryNote[]
  private persistence: Persistence | undefined
  private listeners = new Set<() => void>()
  constructor(persistence?: Persistence, initial = createMockNotes()) {
    this.persistence = persistence
    this.notes = initial
    try {
      const saved = persistence?.getItem(MOCK_STORAGE_KEY)
      if (saved && saved.length < 4_000_000) this.notes = validateNotes(JSON.parse(saved))
    } catch { /* Invalid/unavailable mock storage falls back to explicit fixtures. */ }
  }
  getSnapshot = () => this.notes
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  private commit(next: DiaryNote[]) {
    // Persist before publishing; quota/disabled-storage errors keep the unsaved editor open.
    this.persistence?.setItem(MOCK_STORAGE_KEY, JSON.stringify(next))
    this.notes = next
    this.listeners.forEach((listener) => listener())
  }
  refreshFromStorage() {
    const saved = this.persistence?.getItem(MOCK_STORAGE_KEY)
    if (!saved || saved.length >= 4_000_000) return
    try { this.notes = validateNotes(JSON.parse(saved)); this.listeners.forEach((listener) => listener()) } catch { /* Ignore malformed external local data. */ }
  }
  save(dayKey: string, input: RichDocument, id?: string, expectedRevision?: number): DiaryNote {
    if (!isDayKey(dayKey)) throw new Error('Ngày không hợp lệ.')
    const content = parseRichText(input)
    if (!plainText(content).trim()) throw new Error('Viết một chút gì đó trước khi lưu nhé.')
    this.refreshFromStorage()
    const now = new Date().toISOString()
    if (!id) {
      const note: DiaryNote = { id: crypto.randomUUID(), dayKey, authorUid: MOCK_MEMBER.uid, authorName: MOCK_MEMBER.name,
        content, createdAt: now, updatedAt: now, revision: 1, deleted: false, revisions: [] }
      this.commit([...this.notes, note])
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
