import { describe, expect, it } from 'vitest'
import { MockDiaryStore, MOCK_STORAGE_KEY } from '../../src/features/notes/mock-store'
import { textDocument } from '../../src/lib/rich-text'
import { createMockNotes } from '../../src/mocks/fixtures'

const day = '2024-02-29'
const actorA = { uid: 'actor-a', name: 'Writer A' }
const actorB = { uid: 'actor-b', name: 'Writer B' }

function persistence() {
  const values = new Map<string, string>()
  let failWrites = false
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { if (failWrites) throw new Error('Storage full'); values.set(key, value) },
    fail: () => { failWrites = true },
  }
}

describe('day sticker public interface — local mock only, not Firestore concurrency', () => {
  it('assigns the first successful note author once and starts without a random sticker', () => {
    const store = new MockDiaryStore(undefined, [], actorA)
    expect(store.getDayMetadata(day)).toBeUndefined()
    const first = store.save(day, textDocument('A first note'))
    expect(store.getDayMetadata(day)).toMatchObject({ firstWriterUserId: actorA.uid, firstWriterDisplayName: actorA.name,
      firstNoteId: first.id, representativeStickerId: null, stickerAssignedAt: null, provenance: 'local-commit' })
  })

  it('keeps exactly one first writer for sequential actors using the same persisted mock diary', () => {
    const disk = persistence()
    const writerA = new MockDiaryStore(disk, [], actorA)
    const writerB = new MockDiaryStore(disk, [], actorB)
    const first = writerA.save(day, textDocument('A commits first'))
    writerB.save(day, textDocument('B commits later'))
    const reloaded = new MockDiaryStore(disk, [])
    expect(reloaded.getSnapshot()).toHaveLength(2)
    expect(reloaded.getDayMetadata(day)).toMatchObject({ firstWriterUserId: actorA.uid, firstNoteId: first.id })
  })

  it('allows the first writer to select a valid catalog sticker once and persists it on reload', () => {
    const disk = persistence()
    const store = new MockDiaryStore(disk, [], actorA)
    store.save(day, textDocument('A note'))
    store.assignDaySticker(day, 'sticker-005', actorA.uid)
    const metadata = store.getDayMetadata(day)
    expect(metadata).toMatchObject({ representativeStickerId: 'sticker-005', firstWriterUserId: actorA.uid })
    expect(metadata?.stickerAssignedAt).toEqual(expect.any(String))
    expect(metadata?.stickerUpdatedAt).toBe(metadata?.stickerAssignedAt)
    expect(new MockDiaryStore(disk, []).getDayMetadata(day)).toEqual(metadata)
    expect(() => store.assignDaySticker(day, 'sticker-006', actorA.uid)).toThrow()
    expect(store.getDayMetadata(day)?.representativeStickerId).toBe('sticker-005')
  })

  it('denies another writer and a caller attempting to impersonate the first writer', () => {
    const disk = persistence()
    const writerA = new MockDiaryStore(disk, [], actorA)
    writerA.save(day, textDocument('A starts the day'))
    const writerB = new MockDiaryStore(disk, [], actorB)
    writerB.save(day, textDocument('B joins the page'))
    expect(() => writerB.assignDaySticker(day, 'sticker-003', actorB.uid)).toThrow()
    expect(() => writerB.assignDaySticker(day, 'sticker-003', actorA.uid)).toThrow()
    expect(new MockDiaryStore(disk, []).getDayMetadata(day)?.representativeStickerId).toBeNull()
  })

  it.each(['unknown', 'sticker-000', 'sticker-016', '../sticker-001', 'https://example.com/a.png'])('rejects invalid sticker ID %s', (id) => {
    const store = new MockDiaryStore(undefined, [], actorA)
    store.save(day, textDocument('A note'))
    expect(() => store.assignDaySticker(day, id, actorA.uid)).toThrow()
    expect(store.getDayMetadata(day)?.representativeStickerId).toBeNull()
  })

  it('retains attribution and sticker after hiding the first and last note, including after reload', () => {
    const disk = persistence()
    const store = new MockDiaryStore(disk, [], actorA)
    const first = store.save(day, textDocument('A note'))
    store.assignDaySticker(day, 'sticker-014', actorA.uid)
    const metadata = store.getDayMetadata(day)
    store.softDelete(first.id, 1)
    store.save(day, textDocument('A later note'))
    const later = store.getSnapshot().find((note) => note.id !== first.id)!
    store.softDelete(later.id, 1)
    const reloaded = new MockDiaryStore(disk, [])
    expect(reloaded.getSnapshot().every((note) => note.deleted)).toBe(true)
    expect(reloaded.getDayMetadata(day)).toEqual(metadata)
    expect(reloaded.getSnapshot()[0]?.content).toEqual(textDocument('A note'))
  })

  it('does not publish a note or attribution when the first persistence write fails', () => {
    const disk = persistence()
    const store = new MockDiaryStore(disk, [], actorA)
    disk.fail()
    expect(() => store.save(day, textDocument('Unsaved'))).toThrow('Storage full')
    expect(store.getSnapshot()).toEqual([])
    expect(store.getDayMetadata(day)).toBeUndefined()
  })

  it('keeps sticker selection pending when its persistence write fails', () => {
    const disk = persistence()
    const store = new MockDiaryStore(disk, [], actorA)
    store.save(day, textDocument('Saved note'))
    const metadata = store.getDayMetadata(day)
    disk.fail()
    expect(() => store.assignDaySticker(day, 'sticker-001', actorA.uid)).toThrow('Storage full')
    expect(store.getDayMetadata(day)).toEqual(metadata)
    expect(new MockDiaryStore(disk, []).getDayMetadata(day)?.representativeStickerId).toBeNull()
  })

  it('migrates v1 notes losslessly without inventing a historical first writer', () => {
    const disk = persistence()
    const notes = createMockNotes('2026-11-05')
    disk.setItem(MOCK_STORAGE_KEY, JSON.stringify(notes))
    const store = new MockDiaryStore(disk, [], actorA)
    expect(store.getSnapshot()).toEqual(notes)
    expect(store.getDayMetadata('2026-11-05')).toMatchObject({ firstWriterUserId: null, firstWriterDisplayName: null,
      firstNoteId: null, representativeStickerId: null, provenance: 'legacy-unknown' })
    expect(() => store.assignDaySticker('2026-11-05', 'sticker-001', actorA.uid)).toThrow()
    store.save(day, textDocument('New day after migration'))
    const reloaded = new MockDiaryStore(disk, [])
    expect(reloaded.getSnapshot().slice(0, notes.length)).toEqual(notes)
    expect(reloaded.getDayMetadata('2026-11-05')?.provenance).toBe('legacy-unknown')
    expect(reloaded.getDayMetadata(day)?.firstWriterUserId).toBe(actorA.uid)
  })
})
