import { Routes, Route, Navigate } from 'react-router-dom'
import Feed from './pages/Feed.jsx'
import Settings from './pages/Settings.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Profile from './pages/Profile.jsx'
import Upload from './pages/Upload.jsx'
import Explore from './pages/Explore.jsx'
import Nav from './components/Nav.jsx'
import Share from './pages/Share.jsx'
import NotFound from './pages/NotFound.jsx'

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
      <main className="flex-1 md:ml-64 min-h-screen bg-gray-50">
        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/share/:id" element={<Share />} />
      <Route path="/" element={<PrivateRoute><WithNav><Feed /></WithNav></PrivateRoute>} />
      <Route path="/explore" element={<PrivateRoute><WithNav><Explore /></WithNav></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><WithNav><Settings /></WithNav></PrivateRoute>} />
      <Route path="/profile/:username" element={<PrivateRoute><WithNav><Profile /></WithNav></PrivateRoute>} />
      <Route path="/upload" element={<PrivateRoute><WithNav><Upload /></WithNav></PrivateRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

