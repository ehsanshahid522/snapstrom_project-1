import { useState, useEffect } from 'react'
import { clearAuth, getUsername, api } from '../lib/api.js'
import Logo from './Logo.jsx'

export default function Nav() {
  const username = getUsername()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [followingStatus, setFollowingStatus] = useState({})

  function logout() {
    clearAuth()
    window.location.href = '/login'
  }

  return (
    <>
      {/* Top Header with Logo */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 shadow-2xl border-b border-pink-300 z-40 backdrop-blur-sm">
        <div className="flex items-center justify-between h-full px-4 md:px-6">
          {/* Logo with enhanced styling */}
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-white/30">
                <Logo size="md" showText={false} />
              </div>
              <div className="hidden md:block">
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                  SNAPSTROM
                </h1>
                <p className="text-xs text-pink-100 font-medium">Share Your Story</p>
              </div>
            </div>
          </div>
          
          {/* Center Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search users..."
                className="w-full pl-12 pr-4 py-3 bg-white/90 backdrop-blur-sm border border-white/30 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200 shadow-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <svg className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <button className="p-3 text-white hover:text-pink-200 hover:bg-white/10 rounded-xl transition-all duration-200 backdrop-blur-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </button>
            <button className="p-3 text-white hover:text-pink-200 hover:bg-white/10 rounded-xl transition-all duration-200 backdrop-blur-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </button>
            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-white/30">
              <span className="text-white font-bold text-sm">
                {username?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-3 text-white hover:text-pink-200 hover:bg-white/10 rounded-xl transition-all duration-200 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(true)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Vertical Sidebar Navigation */}
      <nav className={`fixed left-0 top-20 h-full w-64 bg-gradient-to-b from-white via-pink-50 to-purple-50 shadow-xl border-r border-pink-200 z-30 transform transition-transform duration-300 ease-in-out ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Navigation Links - Scrollable */}
        <div className="h-full overflow-y-auto scrollbar-hide">
          <div className="p-6 space-y-4">
            {/* Main Navigation Section */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-pink-600 uppercase tracking-wider px-3 mb-4 flex items-center">
                <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
                Main Menu
              </h3>
            </div>
            
            <a href="/" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-pink-600 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 rounded-xl transition-all duration-200 group shadow-sm hover:shadow-md" onClick={() => setIsMobileOpen(false)}>
              <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className="font-medium">Home</span>
            </a>

            <a href="/following" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-pink-600 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 rounded-xl transition-all duration-200 group shadow-sm hover:shadow-md" onClick={() => setIsMobileOpen(false)}>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="font-medium">Following</span>
            </a>

            <a href="/upload" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-pink-600 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 rounded-xl transition-all duration-200 group shadow-sm hover:shadow-md" onClick={() => setIsMobileOpen(false)}>
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <span className="font-medium">Upload</span>
            </a>

            <a href={`/profile/${username}`} className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-pink-600 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 rounded-xl transition-all duration-200 group shadow-sm hover:shadow-md" onClick={() => setIsMobileOpen(false)}>
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="font-medium">Profile</span>
            </a>

            <a href="/settings" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-pink-600 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 rounded-xl transition-all duration-200 group shadow-sm hover:shadow-md" onClick={() => setIsMobileOpen(false)}>
              <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="font-medium">Settings</span>
            </a>

            {/* Additional Navigation Section */}
            <div className="mb-6 mt-8">
              <h3 className="text-xs font-semibold text-pink-600 uppercase tracking-wider px-3 mb-4 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Discover
              </h3>
            </div>

            <a href="/trending" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-pink-600 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 rounded-xl transition-all duration-200 group shadow-sm hover:shadow-md" onClick={() => setIsMobileOpen(false)}>
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-medium">Trending</span>
            </a>

            <a href="/explore" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-pink-600 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 rounded-xl transition-all duration-200 group shadow-sm hover:shadow-md" onClick={() => setIsMobileOpen(false)}>
              <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <span className="font-medium">Explore</span>
            </a>

            <a href="/messages" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-pink-600 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 rounded-xl transition-all duration-200 group shadow-sm hover:shadow-md" onClick={() => setIsMobileOpen(false)}>
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="font-medium">Messages</span>
            </a>

            <a href="/notifications" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-pink-600 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 rounded-xl transition-all duration-200 group shadow-sm hover:shadow-md" onClick={() => setIsMobileOpen(false)}>
              <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-pink-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-medium">Notifications</span>
            </a>

            {/* Help & Support Section */}
            <div className="mb-6 mt-8">
              <h3 className="text-xs font-semibold text-pink-600 uppercase tracking-wider px-3 mb-4 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Support
              </h3>
            </div>

            <a href="/help" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-pink-600 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 rounded-xl transition-all duration-200 group shadow-sm hover:shadow-md" onClick={() => setIsMobileOpen(false)}>
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-medium">Help Center</span>
            </a>

            <a href="/feedback" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-pink-600 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 rounded-xl transition-all duration-200 group shadow-sm hover:shadow-md" onClick={() => setIsMobileOpen(false)}>
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <span className="font-medium">Feedback</span>
            </a>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-pink-100 bg-gradient-to-r from-pink-50 to-purple-50">
          <button 
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-white/50 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
              <span className="text-white font-bold text-sm">
                {username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-gray-900 truncate">{username}</p>
              <p className="text-xs text-pink-600">Click for options</p>
            </div>
            <svg className={`w-4 h-4 text-pink-500 transition-transform duration-200 ${showAccountMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Account Menu */}
          {showAccountMenu && (
            <div className="mt-3 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              <button
                onClick={logout}
                className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
              >
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        <button 
          className="md:hidden absolute top-4 right-4 p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          onClick={() => setIsMobileOpen(false)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </nav>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .smooth-scroll {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
        .no-select {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        @media (max-width: 640px) {
          button, a {
            min-height: 44px;
            min-width: 44px;
          }
        }
      `}</style>
    </>
  )
}
