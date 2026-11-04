import { describe, expect, it } from 'vitest'
import { isSafeUrl, parseRichText, plainText, textDocument } from '../../src/lib/rich-text'
import { createMockNotes } from '../../src/mocks/fixtures'

describe('rich-text JSON contract', () => {
  it('preserves paragraphs, lists, bold, italic and emoji through JSON serialization', () => {
    const rich = createMockNotes('2026-11-05')[0]!.content
    expect(parseRichText(JSON.parse(JSON.stringify(rich)))).toEqual(rich)
    expect(plainText(rich)).toContain('☕')
    expect(plainText(textDocument('Một\n\nHai 🌿'))).toBe('Một\n\nHai 🌿')
  })
  it('preserves hard breaks, ordered list start and validated links', () => {
    const rich = { type: 'doc', content: [{ type: 'orderedList', attrs: { start: 3 }, content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [
      { type: 'text', text: 'Link', marks: [{ type: 'link', attrs: { href: 'https://example.com', target: '_blank', rel: 'noopener noreferrer', class: null } }] }, { type: 'hardBreak' }, { type: 'text', text: 'Dòng hai' },
    ] }] }] }] }
    const parsed = parseRichText(rich)
    expect(parsed.content[0]?.attrs?.start).toBe(3)
    expect(plainText(parsed)).toBe('Link\nDòng hai')
  })
  it.each(['javascript:alert(1)', 'data:text/html,<script>x</script>', '//evil.test', 'https://user:pass@example.com', ' https://example.com', 'https://exam\nple.com'])('rejects unsafe URL %s', (url) => {
    expect(isSafeUrl(url)).toBe(false)
    expect(() => parseRichText({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'click', marks: [{ type: 'link', attrs: { href: url } }] }] }] })).toThrow()
  })
  it('rejects image embeds, unknown fields, invalid nesting and oversized text', () => {
    for (const node of [{ type: 'image', attrs: { src: 'https://example.com/x.png' } }, { type: 'paragraph', onerror: 'alert(1)' }, { type: 'listItem', content: [{ type: 'text', text: 'invalid' }] }]) {
      expect(() => parseRichText({ type: 'doc', content: [node] })).toThrow()
    }
    expect(() => parseRichText(textDocument('x'.repeat(10_001)))).toThrow(/10.000/)
    expect(isSafeUrl('https://example.com/path?q=1')).toBe(true)
  })
})
