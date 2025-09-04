import { Link, useLocation } from 'react-router-dom'
import { getUsername } from '../lib/api.js'

export default function SimpleNav() {
  const location = useLocation()
  const username = getUsername()

  return (
    <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 border-b border-gray-200 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Snapstream
          </h1>
          <p className="text-white/90 text-lg font-medium">
            Discover amazing moments from around the world
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex justify-center space-x-4 mb-4">
          <Link
            to="/"
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              location.pathname === '/'
                ? 'bg-white text-purple-600 shadow-lg'
                : 'text-white hover:bg-white/20'
            }`}
          >
            🌍 For You
          </Link>
          <Link
            to="/following"
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              location.pathname === '/following'
                ? 'bg-white text-purple-600 shadow-lg'
                : 'text-white hover:bg-white/20'
            }`}
          >
            👥 Following
          </Link>
        </div>

        {/* User Menu */}
        <div className="flex justify-center items-center space-x-4">
          <Link
            to="/upload"
            className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white font-semibold hover:bg-white/30 transition-all duration-300"
          >
            📸 Upload
          </Link>
          <Link
            to="/trending"
            className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white font-semibold hover:bg-white/30 transition-all duration-300"
          >
            🔥 Trending
          </Link>
          <Link
            to={`/profile/${username}`}
            className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white font-semibold hover:bg-white/30 transition-all duration-300"
          >
            👤 Profile
          </Link>
          <Link
            to="/settings"
            className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white font-semibold hover:bg-white/30 transition-all duration-300"
          >
            ⚙️ Settings
          </Link>
        </div>
      </div>
    </div>
  )
}
