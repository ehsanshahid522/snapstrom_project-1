import { useState, useEffect } from 'react'
import { api } from '../lib/api.js'
import { config } from '../config.js'

export default function Following() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [followingStatus, setFollowingStatus] = useState({})
  const [interactingPosts, setInteractingPosts] = useState({})
  const [currentUserId, setCurrentUserId] = useState(null)
  const [expandedComments, setExpandedComments] = useState({})

  // Function to fetch following posts
  const fetchFollowingPosts = async () => {
    try {
      setLoading(true)
      
      // Get current user info
      const username = localStorage.getItem('username')
      if (username) {
        setCurrentUser({ username })
      }

      // Get current user ID from token
      const currentUserId = (() => {
        try {
          const token = localStorage.getItem('token')
          if (!token) return null
          const payload = JSON.parse(atob(token.split('.')[1]))
          return payload.id
        } catch (error) {
          return null
        }
      })()
      
      setCurrentUserId(currentUserId)

      // Fetch following feed data
      const response = await api('/feed/following')
      
      console.log('🔍 Following feed response:', response);
      
      // Handle both direct array response and wrapped response
      const postsData = response.success ? response.data : (Array.isArray(response) ? response : []);
      
      console.log('🔍 Following posts data:', postsData);
      
      if (!postsData || !Array.isArray(postsData)) {
        throw new Error('Failed to fetch following feed data')
      }
      
      // Map the data to match expected structure
      const mapPosts = (data) => data.map(p => {
        console.log('🔍 Processing following post:', p);
        
        const mappedPost = {
          ...p,
          _id: p.id || p._id,
          uploadTime: p.uploadTime || p.createdAt,
          uploader: {
            username: p.uploadedBy?.username || p.uploaderUsername || p.uploader?.username || p.username || 'Anonymous User',
            profilePicture: p.uploadedBy?.profilePicture || p.uploader?.profilePicture || null,
            _id: p.uploadedBy?.id || p.uploadedBy?._id || p.uploader?._id || p.uploader || p.uploadedBy
          },
          __liked: Array.isArray(p.likes) ? p.likes.some(l => (typeof l === 'string' ? l : l._id)?.toString() === currentUserId) : false,
          __likesCount: p.likeCount || p.likes?.length || 0,
          comments: p.comments || []
        };
        
        return mappedPost;
      });
      
      const mappedPosts = mapPosts(postsData);
      setPosts(mappedPosts);
      
      // Initialize following status for all users in the feed
      const allUsers = mappedPosts
        .map(p => {
          const userId = p.uploader?._id;
          return typeof userId === 'object' ? userId._id || userId.id : userId;
        })
        .filter(id => id && id !== 'undefined' && id !== null)
        .filter((id, index, arr) => arr.indexOf(id) === index);
      
      // Check follow status for each user
      const followStatus = {};
      for (const userId of allUsers) {
        try {
          const statusResponse = await api(`/auth/follow-status/${userId}`)
          followStatus[userId] = statusResponse.isFollowing || false
        } catch (error) {
          console.error('Error checking follow status for user:', userId, error)
          followStatus[userId] = false
        }
      }
      
      setFollowingStatus(followStatus)
      
    } catch (error) {
      console.error('Error fetching following posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFollowingPosts()
  }, [])

  const like = async (id) => {
    try {
      setInteractingPosts(prev => ({ ...prev, [`like-${id}`]: true }))
      
      const response = await api(`/post/${id}/like`, { method: 'POST' })
      
      setPosts(prev => prev.map(p => {
        if (p._id === id) {
          return {
            ...p,
            __liked: !p.__liked,
            __likesCount: p.__liked ? p.__likesCount - 1 : p.__likesCount + 1
          }
        }
        return p
      }))
    } catch (error) {
      console.error('Error liking post:', error)
    } finally {
      setInteractingPosts(prev => ({ ...prev, [`like-${id}`]: false }))
    }
  }

  const comment = async (id, text) => {
    try {
      setInteractingPosts(prev => ({ ...prev, [`comment-${id}`]: true }))
      
      const response = await api(`/post/${id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      
      setPosts(prev => prev.map(p => {
        if (p._id === id) {
          return {
            ...p,
            comments: [...(p.comments || []), response.comment]
          }
        }
        return p
      }))
    } catch (error) {
      console.error('Error commenting on post:', error)
    } finally {
      setInteractingPosts(prev => ({ ...prev, [`comment-${id}`]: false }))
    }
  }

  const deletePost = async (id) => {
    try {
      console.log('🔍 Deleting post:', id)
      
      const confirmed = window.confirm('Are you sure you want to delete this post? This action cannot be undone.')
      if (!confirmed) return
      
      setInteractingPosts(prev => ({ ...prev, [`delete-${id}`]: true }))
      
      const response = await api(`/post/${id}`, { method: 'DELETE' })
      
      console.log('✅ Delete response:', response)
      
      setPosts(prev => prev.filter(p => p._id !== id))
      
      alert('Post deleted successfully!')
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post. Please try again.')
    } finally {
      setInteractingPosts(prev => ({ ...prev, [`delete-${id}`]: false }))
    }
  }

  const toggleComments = (postId) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  }

  const share = (postId, post) => {
    const shareUrl = `${window.location.origin}/post/${postId}`
    
    if (navigator.share) {
      navigator.share({
        title: 'Check out this post on Snapstream',
        text: post.caption || 'Amazing content on Snapstream',
        url: shareUrl
      })
    } else {
      navigator.clipboard.writeText(shareUrl)
      alert('Link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading posts from people you follow...</p>
        </div>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Posts Yet</h2>
            <p className="text-gray-600 mb-6">
              You're not following anyone yet, or the people you follow haven't posted anything.
            </p>
            <div className="space-y-3">
              <a 
                href="/"
                className="block w-full px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-2xl"
              >
                🌍 Explore All Posts
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 left-32 w-28 h-28 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-2">
          <div className="text-center mb-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-0">
              Following Feed
            </h1>
            <p className="text-slate-600 text-xs">
              Posts from people you follow ✨
            </p>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="max-w-2xl mx-auto px-4 py-2 relative">
        {/* Floating Action Button */}
        <div className="fixed bottom-8 right-8 z-50">
          <a href="/upload" className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 transform hover:scale-110 hover:rotate-12 flex items-center justify-center text-white text-2xl animate-bounce">
            📸
          </a>
        </div>

        {/* Grid Decorative Elements */}
        <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-60 animate-bounce"></div>
        <div className="absolute -top-4 -right-4 w-6 h-6 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full opacity-60 animate-bounce" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full opacity-60 animate-bounce" style={{animationDelay: '1s'}}></div>
        <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full opacity-60 animate-bounce" style={{animationDelay: '1.5s'}}></div>

        <div className="space-y-8">
          {posts.map((p, index) => (
            <div 
              key={p._id} 
              className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 overflow-hidden animate-slide-up"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              {/* Post Header */}
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between">
                  {/* Left Side - Username and Profile Info */}
                  <div className="flex items-center space-x-4">
                    {/* Profile Picture */}
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 ring-2 ring-pink-200">
                      {p.uploader?.profilePicture ? (
                        <img 
                          src={`/uploads/${p.uploader.profilePicture}`} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
                          <span className="text-pink-600 font-bold text-lg">
                            {p.uploader?.username?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Username and Time */}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {p.uploader?.username || 'Unknown User'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {p.uploadTime ? new Date(p.uploadTime).toLocaleDateString() : 'Recently'}
                      </p>
                    </div>
                  </div>

                  {/* Right Side - Badges and Actions */}
                  <div className="flex items-center space-x-2">
                    {/* Private Badge */}
                    {p.isPrivate && (
                      <div className="px-3 py-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold rounded-full">
                        🔒 Private
                      </div>
                    )}
                    
                    {/* Your Post Badge */}
                    {currentUserId && p.uploader?._id === currentUserId && (
                      <div className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full">
                        ✨ Your Post
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Post Image */}
              <div className="relative group">
                <img 
                  src={`${config.API_BASE_URL}/api/images/${p._id}`} 
                  alt={p.originalName || ''} 
                  className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  onError={(e) => {
                    console.error('❌ Image failed to load:', e.target.src);
                    e.target.style.display = 'none';
                  }}
                />
                {/* Image overlay with gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Floating action buttons for user's own posts */}
                {currentUserId && p.uploader?._id === currentUserId && (
                  <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                      onClick={() => share(p._id, p)}
                      disabled={interactingPosts[`share-${p._id}`]}
                      className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-200 transform hover:scale-110 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {interactingPosts[`share-${p._id}`] ? (
                        <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                      )}
                    </button>
                    
                    <button 
                      onClick={() => deletePost(p._id)}
                      disabled={interactingPosts[`delete-${p._id}`]}
                      className="w-10 h-10 bg-red-500/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-500 transition-all duration-200 transform hover:scale-110 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete post"
                    >
                      {interactingPosts[`delete-${p._id}`] ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Caption - Now below image */}
              {p.caption && (
                <div className="px-6 py-4 border-b border-gray-100">
                  <p className="text-gray-800 text-base leading-relaxed">
                    {p.caption}
                  </p>
                </div>
              )}

              {/* Post Actions */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-6">
                    <button 
                      onClick={() => like(p._id)}
                      disabled={interactingPosts[`like-${p._id}`]}
                      className="flex items-center space-x-3 text-gray-700 hover:text-red-500 transition-all duration-300 transform hover:scale-110 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {interactingPosts[`like-${p._id}`] ? (
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : p.__liked ? (
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200 transition-colors shadow-lg">
                          <svg className="w-7 h-7 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors shadow-lg">
                          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </div>
                      )}
                      <span className="font-bold text-xl">{p.__likesCount || 0}</span>
                    </button>
                    
                    <button 
                      onClick={() => toggleComments(p._id)}
                      disabled={interactingPosts[`comment-${p._id}`]}
                      className="flex items-center space-x-3 text-gray-700 hover:text-blue-500 transition-all duration-300 transform hover:scale-110 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {interactingPosts[`comment-${p._id}`] ? (
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors shadow-lg">
                          <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                      )}
                      <span className="font-bold text-xl">{p.comments?.length || 0}</span>
                    </button>
                  </div>
                  
                  {/* Share button - only for other users' posts */}
                  {(!currentUserId || p.uploader?._id !== currentUserId) && (
                    <button 
                      onClick={() => share(p._id, p)}
                      disabled={interactingPosts[`share-${p._id}`]}
                      className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all duration-300 transform hover:scale-110 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {interactingPosts[`share-${p._id}`] ? (
                        <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>

                {/* Comments - Only show when expanded */}
                {p.comments && p.comments.length > 0 && expandedComments[p._id] && (
                  <div className="space-y-3 mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl animate-slide-up border border-blue-100">
                    <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center">
                      <span className="mr-2">💬</span>
                      Comments ({p.comments.length})
                    </h4>
                    {p.comments.slice(0, 5).map((c, i) => (
                      <div key={i} className="text-sm p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <span className="font-bold text-gray-900 mr-2">
                          {c.username || c.user?.username || 'User'}:
                        </span>
                        <span className="text-gray-700">{c.text}</span>
                      </div>
                    ))}
                    {p.comments.length > 5 && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        +{p.comments.length - 5} more comments
                      </p>
                    )}
                  </div>
                )}

                {/* Add Comment Form */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault()
                    const text = e.currentTarget[`comment-${p._id}`].value.trim()
                    if (!text) return
                    comment(p._id, text)
                    e.currentTarget.reset()
                  }}
                  className="flex space-x-3 mt-4"
                >
                  <input 
                    name={`comment-${p._id}`}
                    placeholder="💭 Add a comment..." 
                    disabled={interactingPosts[`comment-${p._id}`]}
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  />
                  <button 
                    type="submit" 
                    disabled={interactingPosts[`comment-${p._id}`]}
                    className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-2xl hover:from-pink-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {interactingPosts[`comment-${p._id}`] ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Posting...</span>
                      </div>
                    ) : (
                      'Post'
                    )}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
