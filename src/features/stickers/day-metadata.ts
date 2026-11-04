import { isDayKey } from '../../lib/date'
import type { DiaryNote } from '../../types/diary'
import { isStickerId, type StickerId } from './stickerCatalog'

export interface DayMetadata {
  readonly dayKey: string
  readonly firstWriterUserId: string | null
  readonly firstWriterDisplayName: string | null
  readonly firstNoteId: string | null
  readonly representativeStickerId: StickerId | null
  readonly stickerAssignedAt: string | null
  readonly stickerUpdatedAt: string | null
  readonly provenance: 'local-commit' | 'fixture-order' | 'legacy-unknown'
}

export type DayMetadataMap = Record<string, DayMetadata>
export interface MockActor { readonly uid: string; readonly name: string }

export function metadataForFirstNote(note: DiaryNote, provenance: 'local-commit' | 'fixture-order'): DayMetadata {
  return {
    dayKey: note.dayKey,
    firstWriterUserId: note.authorUid,
    firstWriterDisplayName: note.authorName,
    firstNoteId: note.id,
    representativeStickerId: null,
    stickerAssignedAt: null,
    stickerUpdatedAt: null,
    provenance,
  }
}

function unknownLegacyDay(dayKey: string): DayMetadata {
  return {
    dayKey, firstWriterUserId: null, firstWriterDisplayName: null, firstNoteId: null,
    representativeStickerId: null, stickerAssignedAt: null, stickerUpdatedAt: null,
    provenance: 'legacy-unknown',
  }
}

// Explicit fixture order illustrates a first writer. Existing v1 saved notes have
// no commit-order record: migration must not elect one from a timestamp or sort.
export function metadataForExistingNotes(notes: DiaryNote[], provenance: 'fixture-order' | 'legacy-unknown'): DayMetadataMap {
  const metadata: DayMetadataMap = {}
  for (const note of notes) {
    if (!metadata[note.dayKey]) metadata[note.dayKey] = provenance === 'fixture-order'
      ? metadataForFirstNote(note, provenance) : unknownLegacyDay(note.dayKey)
  }
  return metadata
}

function validTimestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

function parseDayMetadata(input: unknown, dayKey: string, notes: DiaryNote[]): DayMetadata | undefined {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return undefined
  const value = input as Record<string, unknown>
  if (value.dayKey !== dayKey || !isDayKey(dayKey)) return undefined
  if (value.provenance === 'legacy-unknown') {
    if (value.firstWriterUserId !== null || value.firstWriterDisplayName !== null || value.firstNoteId !== null ||
      value.representativeStickerId !== null || value.stickerAssignedAt !== null || value.stickerUpdatedAt !== null) return undefined
    return unknownLegacyDay(dayKey)
  }
  if (value.provenance !== 'local-commit' && value.provenance !== 'fixture-order') return undefined
  const firstNote = notes.find((note) => note.id === value.firstNoteId && note.dayKey === dayKey)
  if (!firstNote || firstNote.authorUid !== value.firstWriterUserId || firstNote.authorName !== value.firstWriterDisplayName) return undefined
  const sticker = value.representativeStickerId
  if (sticker === null) {
    if (value.stickerAssignedAt !== null || value.stickerUpdatedAt !== null) return undefined
  } else if (!isStickerId(sticker) || !validTimestamp(value.stickerAssignedAt) || value.stickerAssignedAt !== value.stickerUpdatedAt) return undefined
  return {
    dayKey,
    firstWriterUserId: firstNote.authorUid,
    firstWriterDisplayName: firstNote.authorName,
    firstNoteId: firstNote.id,
    representativeStickerId: sticker,
    stickerAssignedAt: value.stickerAssignedAt as string | null,
    stickerUpdatedAt: value.stickerUpdatedAt as string | null,
    provenance: value.provenance,
  }
}

export function parseDayMetadataMap(input: unknown, notes: DiaryNote[]): DayMetadataMap {
  const metadata = metadataForExistingNotes(notes, 'legacy-unknown')
  if (!input || typeof input !== 'object' || Array.isArray(input)) return metadata
  for (const [dayKey, value] of Object.entries(input)) {
    const parsed = parseDayMetadata(value, dayKey, notes)
    if (parsed) metadata[dayKey] = parsed
  }
  return metadata
}
