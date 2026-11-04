import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from './layout'
import { AboutPage, CalendarPage, DayPage, JoinPage, NotFound } from './pages'

export const router = createBrowserRouter([
  { element: <Layout />, errorElement: <NotFound message="Không mở được trang. Hãy tải lại hoặc quay về lịch." />, children: [
    { index: true, element: <Navigate to="/calendar" replace /> },
    { path: 'calendar', element: <CalendarPage /> },
    { path: 'day/:dateKey', element: <DayPage /> },
    { path: 'join', element: <JoinPage /> },
    { path: 'join/:diaryId/:inviteToken', element: <JoinPage /> },
    { path: 'about', element: <AboutPage /> },
    { path: '*', element: <NotFound /> },
  ] },
])
