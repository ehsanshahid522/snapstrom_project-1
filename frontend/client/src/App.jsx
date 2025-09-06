import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import LoadingSpinner from './components/LoadingSpinner.jsx'

// Lazy load components for better performance
const Feed = lazy(() => import('./pages/Feed.jsx'))
const Following = lazy(() => import('./pages/Following.jsx'))
const Settings = lazy(() => import('./pages/Settings.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const Register = lazy(() => import('./pages/Register.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const Upload = lazy(() => import('./pages/Upload.jsx'))
const Trending = lazy(() => import('./pages/Trending.jsx'))
const Nav = lazy(() => import('./components/Nav.jsx'))
const Share = lazy(() => import('./pages/Share.jsx'))
const Chat = lazy(() => import('./pages/Chat.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

function isAuthed() {
  return !!localStorage.getItem('token')
}

function PrivateRoute({ children }) {
  return isAuthed() ? children : <Navigate to="/login" replace />
}

function WithNav({ children }) {
  return (
    <div className="flex">
      <Nav />
      <main className="flex-1 md:ml-64 min-h-screen bg-gray-50 md:pt-20 pt-16">
        {children}
      </main>
    </div>
  )
}

function WithoutNav({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/share/:id" element={<Share />} />
        <Route path="/" element={<PrivateRoute><WithNav><Feed /></WithNav></PrivateRoute>} />
        <Route path="/following" element={<PrivateRoute><WithNav><Following /></WithNav></PrivateRoute>} />
        <Route path="/trending" element={<PrivateRoute><WithNav><Trending /></WithNav></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><WithNav><Settings /></WithNav></PrivateRoute>} />
        <Route path="/profile/:username" element={<PrivateRoute><WithNav><Profile /></WithNav></PrivateRoute>} />
        <Route path="/upload" element={<PrivateRoute><WithNav><Upload /></WithNav></PrivateRoute>} />
        <Route path="/messages" element={<PrivateRoute><WithNav><Chat /></WithNav></PrivateRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

