export type RichMark = { type: 'bold' | 'italic' } | { type: 'link'; attrs: { href: string } }
export interface RichNode {
  type: 'doc' | 'paragraph' | 'text' | 'hardBreak' | 'bulletList' | 'orderedList' | 'listItem'
  content?: RichNode[]
  text?: string
  marks?: RichMark[]
  attrs?: { start: number }
}
export interface RichDocument extends RichNode { type: 'doc'; content: RichNode[] }
export interface NoteRevision {
  revision: number
  content: RichDocument
  editedAt: string
  action: 'edit' | 'delete'
}
export interface DiaryNote {
  id: string
  dayKey: string
  authorUid: string
  authorName: string
  content: RichDocument
  createdAt: string
  updatedAt: string
  revision: number
  deleted: boolean
  revisions: NoteRevision[]
}
export interface DaySummary { dayKey: string; count: number; preview: string; representativeStickerId: string | null; legacyUnknown: boolean }
