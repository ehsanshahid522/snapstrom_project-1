import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api.js'

export default function Profile() {
  const { username } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [activeTab, setActiveTab] = useState('all') // 'all', 'public', 'private'
  const [hoveredPost, setHoveredPost] = useState(null)

  useEffect(()=>{
    (async()=>{
      setMsg('')
      setLoading(true)
      try{
        const res = await api(`/api/feed/user/${encodeURIComponent(username)}`)
        console.log('Profile data received:', res) // Debug log
        
        // Ensure res is an array
        if (!Array.isArray(res)) {
          console.error('Profile data is not an array:', res);
          setMsg('Invalid data format received');
          return;
        }
        
        setData({ posts: res, username })
      }catch(e){ 
        console.error('Error fetching profile:', e)
        setMsg(e.message || 'Failed to load profile') 
      }
      finally{ setLoading(false) }
    })()
  },[username])

  // Check if this is the user's own profile
  const currentUsername = localStorage.getItem('username')
  const isOwnProfile = currentUsername === username
  
  // Separate posts by privacy
  const publicPosts = data?.posts?.filter(post => !post.isPrivate) || []
  const privatePosts = data?.posts?.filter(post => post.isPrivate) || []
  const allPosts = data?.posts || []

  // Get posts based on active tab
  const getDisplayPosts = () => {
    switch(activeTab) {
      case 'public': return publicPosts
      case 'private': return privatePosts
      default: return allPosts
    }
  }

  const displayPosts = getDisplayPosts()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        {/* Rainbow Progress Bar */}
        <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 via-yellow-500 via-green-500 to-blue-500 animate-pulse"></div>
        
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 rounded-full mx-auto mb-6 animate-spin"></div>
            <div className="absolute inset-0 w-24 h-24 bg-gradient-to-r from-yellow-400 via-green-400 to-cyan-400 rounded-full mx-auto animate-spin" style={{animationDirection: 'reverse'}}></div>
          </div>
          <p className="text-slate-700 text-xl font-semibold mb-4">Loading profile...</p>
          <div className="flex space-x-3 justify-center">
            <div className="w-3 h-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
            <div className="w-3 h-3 bg-gradient-to-r from-cyan-500 to-green-500 rounded-full animate-bounce" style={{animationDelay: '0.6s'}}></div>
            <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-yellow-500 rounded-full animate-bounce" style={{animationDelay: '0.8s'}}></div>
          </div>
        </div>
      </div>
    )
  }

  if (msg) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-24 h-24 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-3">Oops! Something went wrong</h3>
          <p className="text-slate-600 mb-8 text-lg">{msg}</p>
          <a href="/" className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-red-500 via-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:from-red-600 hover:via-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Feed 🏠
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 left-32 w-28 h-28 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-3xl"></div>
      </div>
      
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg border-b border-purple-300">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Profile Picture */}
            <div className="relative group">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex-shrink-0 shadow-2xl ring-4 ring-white ring-opacity-50 transform group-hover:scale-110 transition-all duration-300">
                <div className="w-full h-full bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 flex items-center justify-center">
                  <span className="text-orange-600 font-bold text-3xl md:text-4xl drop-shadow-lg">
                    {username?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              {/* Online indicator with pulse animation */}
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-lg animate-pulse"></div>
              {/* Decorative elements */}
              <div className="absolute -top-2 -left-2 w-4 h-4 bg-pink-400 rounded-full opacity-70 animate-bounce"></div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full opacity-70 animate-bounce" style={{animationDelay: '0.5s'}}></div>
            </div>

            {/* Profile Info */}
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 drop-shadow-lg">
                @{username}
              </h1>
              
              {/* Main Stats Row - Posts, Following, Followers */}
              <div className="flex justify-center md:justify-start space-x-8 mb-6">
                <div className="text-center group cursor-pointer transform hover:scale-110 transition-all duration-300 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  <div className="relative">
                    <div className="text-5xl font-bold text-white mb-2 group-hover:text-yellow-300 transition-colors drop-shadow-lg animate-pulse">
                      {allPosts.length}
                    </div>
                    <div className="text-sm text-yellow-200 font-medium uppercase tracking-wider group-hover:text-yellow-100">
                      Posts 📸
                    </div>
                  </div>
                </div>
                
                <div className="text-center group cursor-pointer transform hover:scale-110 transition-all duration-300 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-purple-400/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  <div className="relative">
                    <div className="text-5xl font-bold text-white mb-2 group-hover:text-pink-300 transition-colors drop-shadow-lg animate-pulse" style={{animationDelay: '0.5s'}}>
                      0
                    </div>
                    <div className="text-sm text-pink-200 font-medium uppercase tracking-wider group-hover:text-pink-100">
                      Following 👥
                    </div>
                  </div>
                </div>
                
                <div className="text-center group cursor-pointer transform hover:scale-110 transition-all duration-300 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  <div className="relative">
                    <div className="text-5xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors drop-shadow-lg animate-pulse" style={{animationDelay: '1s'}}>
                      0
                    </div>
                    <div className="text-sm text-cyan-200 font-medium uppercase tracking-wider group-hover:text-cyan-100">
                      Followers 👤
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-white max-w-md text-lg drop-shadow-md">
                {isOwnProfile ? (
                  <>Welcome to <span className="font-semibold text-yellow-300">your</span> creative space on Snapstream ✨</>
                ) : (
                  <>Welcome to <span className="font-semibold text-yellow-300">@{username}</span>'s creative space on Snapstream ✨</>
                )}
              </p>
              {!isOwnProfile && (
                <div className="mt-3 inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm">
                  <span className="mr-2">👁️</span>
                  Viewing public profile
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-8 relative">
        {/* Floating Action Button - Only show for own profile */}
        {isOwnProfile && (
          <div className="fixed bottom-8 right-8 z-50">
            <button className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 transform hover:scale-110 hover:rotate-12 flex items-center justify-center text-white text-2xl animate-bounce">
              📸
            </button>
          </div>
        )}
        
        {/* Decorative Background Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-40 left-20 w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        
        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-3 shadow-2xl border border-slate-600">
            <div className="flex space-x-3">
              {[
                { id: 'all', label: 'All Posts', count: allPosts.length, color: 'cyan', icon: '🌟' },
                { id: 'public', label: 'Public', count: publicPosts.length, color: 'emerald', icon: '🌍' },
                // Only show private tab for own profile
                ...(isOwnProfile ? [{ id: 'private', label: 'Private', count: privatePosts.length, color: 'violet', icon: '🔒' }] : [])
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-3 transform hover:scale-105 ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r from-${tab.color}-400 to-${tab.color}-600 text-white shadow-lg scale-105`
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold bg-${tab.color}-500 text-white shadow-md`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Posts Display */}
        {displayPosts.length > 0 ? (
          <>
            {/* Section Header */}
            <div className="mb-8 text-center">
              <div className="inline-block p-6 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-2xl shadow-xl mb-4">
                <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                  {activeTab === 'all' && (isOwnProfile ? '🌟 All Posts' : '🌟 Posts')}
                  {activeTab === 'public' && '🌍 Public Posts'}
                  {activeTab === 'private' && '🔒 Private Posts'}
                </h2>
              </div>
              <p className="text-lg text-slate-700 font-medium">
                {activeTab === 'all' && (isOwnProfile ? `✨ Showing all ${allPosts.length} posts` : `✨ Showing ${publicPosts.length} public posts`)}
                {activeTab === 'public' && `🌍 Showing ${publicPosts.length} public posts`}
                {activeTab === 'private' && `🔒 Showing ${privatePosts.length} private posts`}
              </p>
              {!isOwnProfile && (
                <p className="text-sm text-slate-500 mt-2">
                  🔒 Private posts are only visible to the profile owner
                </p>
              )}
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 relative">
              {/* Grid Decorative Elements */}
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-60 animate-bounce"></div>
              <div className="absolute -top-4 -right-4 w-6 h-6 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full opacity-60 animate-bounce" style={{animationDelay: '0.5s'}}></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full opacity-60 animate-bounce" style={{animationDelay: '1s'}}></div>
              <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full opacity-60 animate-bounce" style={{animationDelay: '1.5s'}}></div>
              
              {displayPosts.map(post => (
                <div 
                  key={post._id} 
                  className="group relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:rotate-1 cursor-pointer border-2 border-transparent hover:border-pink-300"
                  onMouseEnter={() => setHoveredPost(post._id)}
                  onMouseLeave={() => setHoveredPost(null)}
                >
                  {/* Post Image */}
                  <img 
                    src={`/uploads/${post.filename}`} 
                    alt={post.originalName || ''} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  
                  {/* Privacy Badge */}
                  <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${
                    post.isPrivate 
                      ? 'bg-gradient-to-r from-violet-500 to-purple-600' 
                      : 'bg-gradient-to-r from-emerald-500 to-green-600'
                  }`}>
                    {post.isPrivate ? '🔒 Private' : '🌍 Public'}
                  </div>
                  
                  {/* Hover Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t from-pink-600/90 via-purple-500/50 to-transparent transition-opacity duration-500 ${
                    hoveredPost === post._id ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      {/* Caption */}
                      {post.caption && (
                        <p className="text-sm font-medium mb-3 line-clamp-2 text-pink-100">{post.caption}</p>
                      )}
                      
                      {/* Engagement Stats */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1 bg-red-500/80 px-2 py-1 rounded-full">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                            <span className="text-xs font-bold">{post.likes?.length || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1 bg-blue-500/80 px-2 py-1 rounded-full">
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="text-xs font-bold">{post.comments?.length || 0}</span>
                          </div>
                        </div>
                        
                        {/* Upload Time */}
                        <div className="text-xs text-pink-200 bg-black/30 px-2 py-1 rounded-full">
                          {new Date(post.uploadTime).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-32 h-32 bg-gradient-to-br from-yellow-200 via-orange-300 to-red-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <svg className="w-16 h-16 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-3">No posts found</h3>
            <p className="text-slate-600 mb-8 text-lg">
              {activeTab === 'all' && (isOwnProfile ? `@${username} hasn't shared any photos yet. ✨` : `@${username} hasn't shared any public photos yet. ✨`)}
              {activeTab === 'public' && `@${username} doesn't have any public posts yet. 🌍`}
              {activeTab === 'private' && `@${username} doesn't have any private posts yet. 🔒`}
            </p>
            {isOwnProfile && (
              <a href="/upload" className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-pink-600 hover:via-purple-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 hover:rotate-1 shadow-2xl">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Share Your First Photo 🚀
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

