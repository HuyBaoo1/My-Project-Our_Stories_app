import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { MockDiaryStore, MOCK_STORAGE_KEY } from './mock-store'

const Context = createContext<MockDiaryStore | null>(null)

export function MockDiaryProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => {
    try { return new MockDiaryStore(window.localStorage) } catch { return new MockDiaryStore() }
  })
  useEffect(() => {
    const refresh = (event: StorageEvent) => { if (event.key === MOCK_STORAGE_KEY) store.refreshFromStorage() }
    window.addEventListener('storage', refresh)
    return () => window.removeEventListener('storage', refresh)
  }, [store])
  return <Context.Provider value={store}>{children}</Context.Provider>
}

export function useDiary() {
  const store = useContext(Context)
  if (!store) throw new Error('Mock diary provider is missing.')
  const notes = useSyncExternalStore(store.subscribe, store.getSnapshot)
  return { store, notes }
}
