import { shiftDay, shiftMonth, todayDayKey } from '../lib/date'
import { textDocument } from '../lib/rich-text'
import type { DiaryNote, RichDocument } from '../types/diary'

export const MOCK_MEMBER = { uid: 'mock-you', name: 'Bạn' }
export const MOCK_DIARY = { name: 'Những ngày bên nhau', description: 'Gom một chút hôm nay, để mai còn nhớ.' }

// Deliberately fictional fixtures. No real identities, invite tokens or diary content.
export function createMockNotes(today = todayDayKey()): DiaryNote[] {
  const richSample: RichDocument = { type: 'doc', content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Có những ngày bình thường mà thật dễ thương. ', marks: [{ type: 'bold' }] }, { type: 'text', text: 'Một bữa sáng chậm, một câu chuyện dài và cảm giác được ở cạnh nhau. 🌿' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Những điều nhỏ mình muốn giữ lại:', marks: [{ type: 'italic' }] }] },
    { type: 'bulletList', content: [
      { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Cốc cà phê vẫn còn ấm ☕' }] }] },
      { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Cả nhà cùng hẹn một buổi đi dạo.' }] }] },
    ] },
  ] }
  const fixtures = [
    { dayKey: today, name: 'An Nhiên', content: richSample },
    { dayKey: today, name: 'Minh Anh', content: textDocument('Đọc những dòng này thấy một ngày nhẹ hơn hẳn.\nCuối tuần mình lại cùng nấu một bữa thật ngon nhé! 💛') },
    { dayKey: shiftDay(today, -2), name: 'An Nhiên', content: textDocument('Chiều nay trời dịu. Cả nhóm đi bộ một vòng, nói đủ thứ chuyện không đầu không cuối. 🍃') },
    { dayKey: `${today.slice(0, 7)}-12`, name: 'Minh Anh', content: textDocument('Một buổi tối không vội. Mình thử một món mới và mọi người đều xin thêm phần. 🍲') },
    { dayKey: `${today.slice(0, 7)}-18`, name: 'Gia Hân', content: textDocument('Gửi nhau một bài hát, rồi cứ thế nói chuyện đến khuya. 🎵') },
    { dayKey: `${today.slice(0, 7)}-24`, name: 'An Nhiên', content: textDocument('Hẹn một buổi cùng ngắm hoàng hôn. Những cuộc hẹn nhỏ làm ngày dài thêm vui. 🌅') },
    { dayKey: shiftMonth(today, -1).slice(0, 7) + '-15', name: 'Gia Hân', content: textDocument('Một kỷ niệm của tháng trước. Mỗi lần quay lại trang này, mọi điều vẫn ở đúng ngày của nó. ✨') },
  ]
  return fixtures.map((fixture, index) => ({
    id: `sample-${index + 1}`, dayKey: fixture.dayKey, authorUid: `mock-member-${index % 3}`,
    authorName: fixture.name, content: fixture.content,
    createdAt: `${fixture.dayKey}T${index % 2 ? '10' : '08'}:30:00.000Z`,
    updatedAt: `${fixture.dayKey}T${index % 2 ? '10' : '08'}:30:00.000Z`,
    revision: 1, deleted: false, revisions: [],
  }))
}
