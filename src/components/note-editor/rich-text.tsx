import { Fragment, type ReactNode } from 'react'
import { parseRichText } from '../../lib/rich-text'
import type { RichNode } from '../../types/diary'

function renderNode(node: RichNode, key: number): ReactNode {
  const children = node.content?.map(renderNode)
  switch (node.type) {
    case 'doc': return <Fragment key={key}>{children}</Fragment>
    case 'paragraph': return <p key={key}>{children || <br />}</p>
    case 'hardBreak': return <br key={key} />
    case 'bulletList': return <ul key={key}>{children}</ul>
    case 'orderedList': return <ol key={key} start={node.attrs?.start}>{children}</ol>
    case 'listItem': return <li key={key}>{children}</li>
    case 'text': {
      let text: ReactNode = node.text
      for (const mark of node.marks ?? []) {
        if (mark.type === 'bold') text = <strong>{text}</strong>
        if (mark.type === 'italic') text = <em>{text}</em>
        if (mark.type === 'link') text = <a href={mark.attrs.href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">{text}</a>
      }
      return <Fragment key={key}>{text}</Fragment>
    }
  }
}

export function RichText({ content }: { content: unknown }) {
  let safe
  try {
    safe = parseRichText(content)
  } catch {
    safe = null
  }
  if (!safe) return <p role="alert" className="text-sm text-destructive">Không thể hiển thị nội dung không hợp lệ.</p>
  return <div className="rich-text">{safe.content.map(renderNode)}</div>
}
