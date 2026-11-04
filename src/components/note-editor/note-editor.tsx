import { useEffect, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, List, ListOrdered, Link2, Undo2, Redo2, X, Check, AlertTriangle } from 'lucide-react'
import { Button } from '../ui/button'
import { RichText } from './rich-text'
import { EMPTY_DOCUMENT, isSafeUrl, parseRichText, plainText } from '../../lib/rich-text'
import { RevisionConflict } from '../../features/notes/mock-store'
import type { DiaryNote, RichDocument } from '../../types/diary'

interface Props {
  dayKey: string
  note?: DiaryNote
  onSave: (content: RichDocument, expectedRevision?: number) => void
  onClose: () => void
}

export function NoteEditor({ dayKey, note, onSave, onClose }: Props) {
  const draftKey = `our-stories:mock-draft:${dayKey}:${note?.id ?? 'new'}`
  const [initial] = useState(() => {
    try {
      const raw = sessionStorage.getItem(draftKey)
      if (raw && raw.length < 100_000) {
        const draft = JSON.parse(raw) as { content: unknown; baseRevision?: number }
        if (note && (!Number.isInteger(draft.baseRevision) || (draft.baseRevision ?? 0) < 1)) throw new Error('Invalid draft revision')
        return { content: parseRichText(draft.content), baseRevision: draft.baseRevision, recovered: true }
      }
    } catch { /* Unavailable or malformed local drafts start with the current mock note. */ }
    return { content: note?.content ?? EMPTY_DOCUMENT, baseRevision: note?.revision, recovered: false }
  })
  const [baseRevision, setBaseRevision] = useState(initial.baseRevision)
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState<DiaryNote | null>(null)
  const [textLength, setTextLength] = useState(plainText(initial.content).length)
  const [dirty, setDirty] = useState(initial.recovered)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const editor = useEditor({
    extensions: [StarterKit.configure({
      blockquote: false, code: false, codeBlock: false, heading: false,
      horizontalRule: false, strike: false, underline: false,
      link: { openOnClick: false, autolink: false, defaultProtocol: 'https', protocols: ['http', 'https'], isAllowedUri: isSafeUrl },
    })],
    content: initial.content,
    shouldRerenderOnTransaction: true,
    editorProps: { attributes: { class: 'rich-text note-input', role: 'textbox', 'aria-label': 'Nội dung ghi chú', 'aria-multiline': 'true', 'data-placeholder': 'Hôm nay có điều gì bạn muốn giữ lại?' } },
    onUpdate: ({ editor: activeEditor }) => {
      setDirty(true)
      setTextLength(activeEditor.getText().length)
      try {
        sessionStorage.setItem(draftKey, JSON.stringify({ content: activeEditor.getJSON(), baseRevision }))
      } catch { setError('Không lưu được bản nháp trong trình duyệt. Hãy sao chép nội dung trước khi đóng.') }
    },
  })

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault() }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const save = () => {
    if (!editor) return
    setError('')
    try {
      const content = parseRichText(editor.getJSON())
      onSave(content, baseRevision)
      try { sessionStorage.removeItem(draftKey) } catch { /* The note is already saved. */ }
      setDirty(false)
      onClose()
    } catch (failure) {
      if (failure instanceof RevisionConflict) setConflict(failure.current)
      setError(failure instanceof Error ? failure.message : 'Không lưu được ghi chú. Bản nháp vẫn ở đây.')
    }
  }

  return <section className="editor-card" aria-label={note ? 'Chỉnh sửa ghi chú' : 'Ghi chú mới'}>
    <div className="flex items-center justify-between gap-2 px-4 pt-4">
      <h3 className="font-semibold">{note ? 'Chỉnh sửa ghi chú' : 'Một điều muốn kể'}</h3>
      <Button type="button" variant="ghost" size="icon" aria-label="Đóng, giữ bản nháp" onClick={onClose}><X /></Button>
    </div>
    <div className="editor-toolbar" role="toolbar" aria-label="Định dạng ghi chú">
      <Button type="button" variant="ghost" size="icon" aria-label="Chữ đậm" aria-pressed={editor?.isActive('bold') ?? false} onClick={() => editor?.chain().focus().toggleBold().run()}><Bold /></Button>
      <Button type="button" variant="ghost" size="icon" aria-label="Chữ nghiêng" aria-pressed={editor?.isActive('italic') ?? false} onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic /></Button>
      <span className="toolbar-separator" />
      <Button type="button" variant="ghost" size="icon" aria-label="Danh sách chấm" aria-pressed={editor?.isActive('bulletList') ?? false} onClick={() => editor?.chain().focus().toggleBulletList().run()}><List /></Button>
      <Button type="button" variant="ghost" size="icon" aria-label="Danh sách số" aria-pressed={editor?.isActive('orderedList') ?? false} onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered /></Button>
      <Button type="button" variant="ghost" size="icon" aria-label="Chèn liên kết" aria-pressed={editor?.isActive('link') ?? false} onClick={() => { setLinkOpen(!linkOpen); setLinkUrl('') }}><Link2 /></Button>
      <span className="toolbar-separator" />
      <Button type="button" variant="ghost" size="icon" aria-label="Hoàn tác" disabled={!editor?.can().undo()} onClick={() => editor?.chain().focus().undo().run()}><Undo2 /></Button>
      <Button type="button" variant="ghost" size="icon" aria-label="Làm lại" disabled={!editor?.can().redo()} onClick={() => editor?.chain().focus().redo().run()}><Redo2 /></Button>
    </div>
    {linkOpen && <div className="link-form">
      <label className="text-sm" htmlFor="note-link">Liên kết (https:// hoặc http://)</label>
      <input id="note-link" type="url" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://example.com" />
      <div className="flex gap-2"><Button type="button" size="sm" onClick={() => {
        if (!isSafeUrl(linkUrl)) { setError('Liên kết cần bắt đầu bằng https:// hoặc http://.'); return }
        editor?.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
        setLinkOpen(false); setError('')
      }}>Áp dụng</Button><Button type="button" variant="ghost" size="sm" onClick={() => { editor?.chain().focus().unsetLink().run(); setLinkOpen(false) }}>Bỏ liên kết</Button></div>
    </div>}
    <EditorContent editor={editor} />
    {initial.recovered && <p className="px-4 text-xs text-muted-foreground">Đã khôi phục bản nháp trên thiết bị này.</p>}
    {error && <p role="alert" className="px-4 py-2 text-sm text-destructive">{error}</p>}
    {conflict && <div className="conflict-box">
      <p className="flex items-center gap-2 font-medium"><AlertTriangle size={16} />Bản mới · phiên bản {conflict.revision}</p>
      <RichText content={conflict.content} />
      {!conflict.deleted && <Button type="button" variant="outline" size="sm" onClick={() => {
        setBaseRevision(conflict.revision)
        try { sessionStorage.setItem(draftKey, JSON.stringify({ content: editor?.getJSON(), baseRevision: conflict.revision })) } catch { /* Keep editor content in memory. */ }
        setConflict(null); setError('Đã chọn bản mới làm mốc. Hãy chỉnh bản nháp phía trên rồi lưu lại.')
      }}>Đã xem, dùng bản mới làm mốc</Button>}
      {conflict.deleted && <p className="text-sm">Ghi chú đã được ẩn. Bản nháp vẫn được giữ trên thiết bị này.</p>}
    </div>}
    <div className="editor-footer">
      <span className={textLength > 10_000 ? 'text-destructive' : 'text-muted-foreground'}>{textLength.toLocaleString('vi-VN')}/10.000 ký tự</span>
      <Button type="button" size="sm" onClick={save} disabled={!editor || !textLength || textLength > 10_000 || !!conflict}><Check />Lưu ghi chú</Button>
    </div>
    <p className="px-4 pb-3 text-xs text-muted-foreground">Bản thử nghiệm · chỉ lưu trong trình duyệt này.</p>
  </section>
}
