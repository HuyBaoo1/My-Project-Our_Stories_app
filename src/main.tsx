import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { MockDiaryProvider } from './features/notes/context'
import { router } from './app/router'
import './index.css'
import './features/stickers/stickers.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode><MockDiaryProvider><RouterProvider router={router} /></MockDiaryProvider></StrictMode>,
)
