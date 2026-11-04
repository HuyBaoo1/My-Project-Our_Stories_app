import { getApps, initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

// Not imported by the mock UI. An explicit call may initialize demo emulators only.
// There is no production fallback, even when .env.local contains real credentials.
export function initializeEmulatorFirebase() {
  if (import.meta.env.VITE_DATA_MODE !== 'emulator' || import.meta.env.VITE_FIREBASE_PROJECT_ID !== 'demo-our-stories') {
    throw new Error('Phase 1 chỉ cho phép mock hoặc Firebase Emulator demo-our-stories.')
  }
  const existing = getApps().find((app) => app.name === 'our-stories-emulator')
  if (existing) return { app: existing, auth: getAuth(existing), db: getFirestore(existing) }
  const app = initializeApp({
    apiKey: 'demo-key-not-a-production-credential', authDomain: 'demo-our-stories.firebaseapp.com',
    projectId: 'demo-our-stories', appId: 'demo-app',
  }, 'our-stories-emulator')
  const auth = getAuth(app)
  const db = getFirestore(app)
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  return { app, auth, db }
}
