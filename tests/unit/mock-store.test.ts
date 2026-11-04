import { describe, expect, it } from 'vitest'
import { MockDiaryStore, RevisionConflict } from '../../src/features/notes/mock-store'
import { textDocument } from '../../src/lib/rich-text'
import { createMockNotes } from '../../src/mocks/fixtures'

function storage() {
  const data = new Map<string, string>()
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value) } }
}

describe('local mock adapter (not Firestore concurrency)', () => {
  it('creates independent notes pinned to the selected historical date after reload', () => {
    const disk = storage()
    const store = new MockDiaryStore(disk, [])
    const first = store.save('2024-02-29', textDocument('Một'))
    const second = store.save('2024-02-29', textDocument('Hai'))
    expect(first.id).not.toBe(second.id)
    expect(new MockDiaryStore(disk).getSnapshot().filter((note) => note.dayKey === '2024-02-29')).toHaveLength(2)
  })
  it('detects sequential stale edits and preserves the prior snapshot', () => {
    const store = new MockDiaryStore(undefined, createMockNotes('2026-11-05'))
    const note = store.getSnapshot()[0]!
    const draft = textDocument('My retained draft')
    store.save(note.dayKey, textDocument('Remote edit'), note.id, 1)
    expect(() => store.save(note.dayKey, draft, note.id, 1)).toThrow(RevisionConflict)
    expect(draft).toEqual(textDocument('My retained draft'))
    const updated = store.getSnapshot().find((item) => item.id === note.id)!
    expect(updated.revision).toBe(2)
    expect(updated.revisions[0]?.content).toEqual(note.content)
  })
  it('edits different notes without replacing another note and retains soft-deleted content', () => {
    const store = new MockDiaryStore(undefined, createMockNotes('2026-11-05'))
    const first = store.getSnapshot()[0]!
    const second = store.getSnapshot()[1]!
    store.save(first.dayKey, textDocument('A'), first.id, 1)
    store.save(second.dayKey, textDocument('B'), second.id, 1)
    store.softDelete(first.id, 2)
    expect(store.getSnapshot().find((note) => note.id === first.id)).toMatchObject({ deleted: true, revision: 3, content: textDocument('A') })
    expect(store.getSnapshot().find((note) => note.id === second.id)?.content).toEqual(textDocument('B'))
  })
  it('rejects empty content, wrong dates and prevents a successful save after storage failure', () => {
    const store = new MockDiaryStore({ getItem: () => null, setItem: () => { throw new Error('Disk full') } }, [])
    expect(() => store.save('2026-11-05', textDocument(' '))).toThrow()
    expect(() => store.save('2026-11-31', textDocument('X'))).toThrow()
    expect(() => store.save('2026-11-05', textDocument('X'))).toThrow('Disk full')
    expect(store.getSnapshot()).toEqual([])
  })
})
