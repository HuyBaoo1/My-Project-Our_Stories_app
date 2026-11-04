import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, describe, it } from 'vitest'
import { assertFails, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore'

// These tests prove ONLY the Phase 1 deny-all baseline. They do not test the future
// membership/invitation/revision proposal, which is intentionally not deployed.
let environment: RulesTestEnvironment | undefined
const paths = ['diaries/demo', 'diaries/demo/members/mock-member', 'diaries/demo/invites/mock-invite-not-a-token',
  'diaries/demo/days/2026-11-05', 'diaries/demo/days/2026-11-05/notes/note', 'diaries/demo/days/2026-11-05/notes/note/revisions/1']

beforeAll(async () => {
  const address = process.env.FIRESTORE_EMULATOR_HOST
  if (!address) throw new Error('Run npm run test:rules; a Firestore Emulator is required.')
  const [host, port] = address.split(':')
  if (host !== '127.0.0.1' || port !== '8080') throw new Error('Only the configured local emulator is permitted.')
  environment = await initializeTestEnvironment({ projectId: 'demo-our-stories', firestore: { host, port: Number(port), rules: readFileSync('firestore.rules', 'utf8') } })
  await environment.withSecurityRulesDisabled(async (context) => {
    for (const path of paths) await setDoc(doc(context.firestore(), path), { fixture: true })
    await setDoc(doc(context.firestore(), 'diaries/demo'), { ownerUid: 'mock-owner', name: 'Mock diary', timeZone: 'Asia/Ho_Chi_Minh' })
    for (const role of ['member', 'owner']) await setDoc(doc(context.firestore(), `diaries/demo/members/mock-${role}`), { uid: `mock-${role}`, role, status: 'active', displayName: 'Mock identity' })
  })
})
afterAll(async () => { await environment?.cleanup() })

describe.each(['anonymous', 'nonmember', 'member', 'owner'])('Phase 1 deny-all: %s', (role) => {
  it.each(paths)('denies get/list/create/update/delete for %s', async (path) => {
    if (!environment) throw new Error('Emulator is not initialized.')
    const context = role === 'anonymous' ? environment.unauthenticatedContext() : environment.authenticatedContext(`mock-${role}`, { email_verified: true, firebase: { sign_in_provider: 'google.com' } })
    const db = context.firestore()
    const reference = doc(db, path)
    await assertFails(getDoc(reference))
    await assertFails(getDocs(collection(db, path.split('/').slice(0, -1).join('/'))))
    await assertFails(setDoc(doc(db, `${path}-new`), { fixture: true }))
    await assertFails(updateDoc(reference, { fixture: false }))
    await assertFails(deleteDoc(reference))
  })
})
