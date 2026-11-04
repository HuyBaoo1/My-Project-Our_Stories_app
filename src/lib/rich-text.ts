import type { RichDocument, RichMark, RichNode } from '../types/diary'

export const MAX_TEXT_LENGTH = 10_000
export const MAX_DOCUMENT_BYTES = 60_000
export const EMPTY_DOCUMENT: RichDocument = { type: 'doc', content: [{ type: 'paragraph' }] }

export function isSafeUrl(value: string): boolean {
  if (value !== value.trim() || Array.from(value).some((character) => character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127)) return false
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) && !!url.hostname && !url.username && !url.password
  } catch { return false }
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Cấu trúc ghi chú không hợp lệ.')
  return value as Record<string, unknown>
}

function onlyKeys(object: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(object).some((key) => !allowed.includes(key))) throw new Error('Ghi chú chứa trường không được hỗ trợ.')
}

// Validate the entire tree before storing or rendering. This is a client safety measure,
// not a replacement for Firestore authorization or server-side schema constraints.
export function parseRichText(input: unknown): RichDocument {
  const serialized = JSON.stringify(input)
  if (!serialized || new TextEncoder().encode(serialized).byteLength > MAX_DOCUMENT_BYTES) throw new Error('Ghi chú vượt giới hạn 60 KB.')
  let nodes = 0
  let textLength = 0
  const parseMark = (inputMark: unknown): RichMark => {
    const mark = record(inputMark)
    if (mark.type === 'bold' || mark.type === 'italic') {
      onlyKeys(mark, ['type'])
      return { type: mark.type }
    }
    if (mark.type === 'link') {
      onlyKeys(mark, ['type', 'attrs'])
      const attrs = record(mark.attrs)
      onlyKeys(attrs, ['href', 'target', 'rel', 'class'])
      if (typeof attrs.href !== 'string' || !isSafeUrl(attrs.href)) throw new Error('Liên kết chỉ hỗ trợ http:// hoặc https:// an toàn.')
      return { type: 'link', attrs: { href: attrs.href } }
    }
    throw new Error('Định dạng chữ không được hỗ trợ.')
  }
  const parseNode = (inputNode: unknown, parent: string, depth: number): RichNode => {
    if (++nodes > 1500 || depth > 12) throw new Error('Ghi chú có quá nhiều định dạng lồng nhau.')
    const node = record(inputNode)
    onlyKeys(node, ['type', 'text', 'content', 'marks', 'attrs'])
    const allowed: Record<string, string[]> = {
      root: ['doc'], doc: ['paragraph', 'bulletList', 'orderedList'],
      paragraph: ['text', 'hardBreak'], bulletList: ['listItem'], orderedList: ['listItem'],
      listItem: ['paragraph', 'bulletList', 'orderedList'],
    }
    if (typeof node.type !== 'string' || !allowed[parent]?.includes(node.type)) throw new Error('Loại nội dung không được hỗ trợ.')
    const type = node.type as RichNode['type']
    if (type === 'text') {
      if (typeof node.text !== 'string' || !node.text.length || node.content !== undefined || node.attrs !== undefined) throw new Error('Đoạn chữ không hợp lệ.')
      textLength += node.text.length
      if (textLength > MAX_TEXT_LENGTH) throw new Error('Mỗi ghi chú tối đa 10.000 ký tự.')
      if (node.marks !== undefined && (!Array.isArray(node.marks) || node.marks.length > 3)) throw new Error('Định dạng không hợp lệ.')
      const marks = node.marks === undefined ? [] : (node.marks as unknown[]).map(parseMark)
      if (new Set(marks.map((mark) => mark.type)).size !== marks.length) throw new Error('Định dạng bị lặp.')
      return { type, text: node.text, ...(marks.length ? { marks } : {}) }
    }
    if (node.text !== undefined || node.marks !== undefined) throw new Error('Cấu trúc nội dung không hợp lệ.')
    if (type === 'hardBreak') {
      if (node.content !== undefined || node.attrs !== undefined) throw new Error('Xuống dòng không hợp lệ.')
      return { type }
    }
    let attrs: { start: number } | undefined
    if (node.attrs !== undefined) {
      if (type !== 'orderedList') throw new Error('Thuộc tính không được hỗ trợ.')
      const inputAttrs = record(node.attrs)
      onlyKeys(inputAttrs, ['start', 'type'])
      const start = inputAttrs.start ?? 1
      if (!Number.isInteger(start) || (start as number) < 1 || (start as number) > 9999) throw new Error('Số thứ tự không hợp lệ.')
      attrs = { start: start as number }
    }
    if (node.content !== undefined && !Array.isArray(node.content)) throw new Error('Nội dung không hợp lệ.')
    const content = ((node.content ?? []) as unknown[]).map((child) => parseNode(child, type, depth + 1))
    if (type !== 'paragraph' && content.length === 0) throw new Error('Nội dung khối bị trống.')
    if (type === 'listItem' && content[0]?.type !== 'paragraph') throw new Error('Danh sách cần bắt đầu bằng một đoạn văn.')
    return { type, ...(attrs ? { attrs } : {}), ...(content.length ? { content } : {}) }
  }
  return parseNode(input, 'root', 0) as RichDocument
}

export function plainText(node: RichNode): string {
  if (node.type === 'text') return node.text ?? ''
  if (node.type === 'hardBreak') return '\n'
  return (node.content ?? []).map(plainText).join(node.type === 'paragraph' ? '' : '\n')
}

export function textDocument(text: string): RichDocument {
  return { type: 'doc', content: text.split('\n').map((line) => ({ type: 'paragraph', ...(line ? { content: [{ type: 'text', text: line }] } : {}) })) }
}
