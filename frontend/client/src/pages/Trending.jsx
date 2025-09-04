import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { config } from '../config.js'

export default function Trending() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [followingStatus, setFollowingStatus] = useState({}) // Track follow status for each user
  const [interactingPosts, setInteractingPosts] = useState({}) // Track posts being interacted with
  const [currentUserId, setCurrentUserId] = useState(null) // Store current user ID
  const [expandedComments, setExpandedComments] = useState({}) // Track which posts have comments expanded
  const [overflowMenuOpen, setOverflowMenuOpen] = useState({}) // Track which posts have overflow menu open
  const [showKebabMenu, setShowKebabMenu] = useState({}) // Track which posts have kebab menu open
  const [activeFilter, setActiveFilter] = useState('all') // Filter: all, today, week, month

  // Close kebab menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.kebab-menu')) {
        setShowKebabMenu({})
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Function to fetch trending posts
  const fetchTrendingPosts = async () => {
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
      
      setCurrentUserId(currentUserId) // Store current user ID in state

      // Fetch trending data
      const response = await api('/trending')
      
      console.log('🔍 Full trending API response:', response);
      
      // Handle both direct array response and wrapped response
      const postsData = response.success ? response.data : (Array.isArray(response) ? response : []);
      
      console.log('🔍 Trending posts data:', postsData);
      
      if (!postsData || !Array.isArray(postsData)) {
        throw new Error('Failed to fetch trending data')
      }
      
      // Map the data to match expected structure
      const mapPosts = (data) => data.map(p => {
        console.log('🔍 Processing trending post:', p);
        console.log('🔍 uploadedBy object:', p.uploadedBy);
        console.log('🔍 Profile picture value:', p.uploadedBy?.profilePicture);
        
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
          comments: p.comments || [],
          engagementScore: p.engagementScore || 0
        };
        
        console.log('🔍 Mapped trending post result:', mappedPost);
        console.log('🔍 Username found:', mappedPost.uploader.username);
        console.log('🔍 Uploader ID:', mappedPost.uploader._id);
        console.log('🔍 Final profile picture:', mappedPost.uploader.profilePicture);
        return mappedPost;
      });
      
      const mappedPosts = mapPosts(postsData);
      
      // Set posts
      setPosts(mappedPosts);
      
      // Initialize following status for all users in the trending feed
      const allUsers = mappedPosts
        .map(p => {
          const userId = p.uploader?._id;
          // Ensure userId is a string, not an object
          return typeof userId === 'object' ? userId._id || userId.id : userId;
        })
        .filter(id => id && id !== 'undefined' && id !== null)
        .filter((id, index, arr) => arr.indexOf(id) === index);
      
      console.log('🔍 All users for follow status:', allUsers);
      
      // Check follow status for each user
      const followStatus = {};
      for (const userId of allUsers) {
        try {
          console.log('🔍 Checking follow status for:', userId);
          const response = await api(`/auth/follow-status/${userId}`).catch(() => ({ isFollowing: false }));
          followStatus[userId] = response.isFollowing || false;
        } catch (error) {
          console.error('❌ Error checking follow status for', userId, ':', error);
          followStatus[userId] = false;
        }
      }
      setFollowingStatus(followStatus);
      
    } catch (e) {
      console.error('Error fetching trending posts:', e)
      setPosts([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrendingPosts()
  }, []) // Re-fetch when activeFilter changes

  const like = async (id) => {
    try {
      console.log('🔍 Liking trending post:', id);
      
      // Set loading state
      setInteractingPosts(prev => ({ ...prev, [`like-${id}`]: true }));
      
      const response = await api(`/like/${id}`, { method: 'POST' })
      
      console.log('✅ Like response:', response);
      
      // Update posts with new like status
      const updatePosts = (postList) => postList.map(p => p._id === id ? ({
        ...p,
        __liked: response.isLiked,
        __likesCount: response.likesCount
      }) : p)
      
      setPosts(ps => updatePosts(ps))
    } catch (error) {
      console.error('Error liking trending post:', error)
    } finally {
      // Clear loading state
      setInteractingPosts(prev => ({ ...prev, [`like-${id}`]: false }));
    }
  }

  const comment = async (id, text) => {
    try {
      console.log('🔍 Commenting on trending post:', id, 'Text:', text);
      
      // Set loading state
      setInteractingPosts(prev => ({ ...prev, [`comment-${id}`]: true }));
      
      const response = await api(`/comment/${id}`, { 
        method: 'POST', 
        body: { text } 
      })
      
      console.log('✅ Comment response:', response);
      
      // Update posts with new comment
      const updatePosts = (postList) => postList.map(p => p._id === id ? ({
        ...p,
        comments: [...(p.comments || []), response.comment]
      }) : p)
      
      setPosts(ps => updatePosts(ps))
    } catch (error) {
      console.error('Error commenting on trending post:', error)
    } finally {
      // Clear loading state
      setInteractingPosts(prev => ({ ...prev, [`comment-${id}`]: false }));
    }
  }

  const share = async (id, post) => {
    try {
      console.log('🔍 Sharing trending post:', id);
      
      // Set loading state
      setInteractingPosts(prev => ({ ...prev, [`share-${id}`]: true }));
      
      const response = await api(`/share/${id}`, { method: 'POST' })
      
      console.log('✅ Share response:', response);
      
      // Open share link in new tab
      if (response.shareUrl) {
        window.open(response.shareUrl, '_blank');
      }
    } catch (error) {
      console.error('Error sharing trending post:', error)
    } finally {
      // Clear loading state
      setInteractingPosts(prev => ({ ...prev, [`share-${id}`]: false }));
    }
  }

  const downloadImage = async (postId, originalName) => {
    try {
      setInteractingPosts(prev => ({ ...prev, [`download-${postId}`]: true }))
      
      const response = await fetch(`${config.API_BASE_URL}/api/images/${postId}`)
      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = originalName || `snapstream-image-${postId}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      alert('Image downloaded successfully!')
    } catch (error) {
      console.error('Error downloading image:', error)
      alert('Failed to download image. Please try again.')
    } finally {
      setInteractingPosts(prev => ({ ...prev, [`download-${postId}`]: false }))
    }
  }

  const toggleOverflowMenu = (postId) => {
    setOverflowMenuOpen(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }))
  }

  const follow = async (userId, username) => {
    try {
      console.log('🔍 Following user:', userId, username);
      
      const response = await api(`/auth/follow/${userId}`, { method: 'POST' })
      
      console.log('✅ Follow response:', response);
      
      // Update following status
      setFollowingStatus(prev => ({
        ...prev,
        [userId]: response.isFollowing
      }));
      
    } catch (error) {
      console.error('Error following user:', error)
    }
  }

  const deletePost = async (id) => {
    try {
      console.log('🔍 Deleting trending post:', id);
      
      const response = await api(`/post/${id}`, { method: 'DELETE' })
      
      console.log('✅ Delete response:', response);
      
      // Remove post from list
      setPosts(ps => ps.filter(p => p._id !== id))
      
      // Close kebab menu
      setShowKebabMenu(prev => ({ ...prev, [id]: false }))
      
    } catch (error) {
      console.error('Error deleting trending post:', error)
    }
  }

  const formatTimeAgo = (date) => {
    const now = new Date()
    const diff = now - new Date(date)
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(date).toLocaleDateString()
  }

  const formatEngagementScore = (score) => {
    if (score >= 1000) return `${(score / 1000).toFixed(1)}k`
    return score.toString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trending posts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🔥 Trending</h1>
            <p className="text-gray-600">Discover the most popular posts from the last 7 days</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-2 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { key: 'all', label: 'All Time', icon: '🔥' },
            { key: 'today', label: 'Today', icon: '⚡' },
            { key: 'week', label: 'This Week', icon: '📈' },
            { key: 'month', label: 'This Month', icon: '📊' }
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeFilter === filter.key
                  ? 'bg-white text-pink-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>{filter.icon}</span>
              <span>{filter.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No trending posts yet</h3>
          <p className="text-gray-600 mb-6">Be the first to create something amazing!</p>
          <a
            href="/upload"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Post
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post, index) => (
            <div key={post._id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
              {/* Post Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {post.uploader?.profilePicture ? (
                          <img
                            src={`${config.API_BASE_URL}/api/images/${post.uploader.profilePicture}`}
                            alt={post.uploader.username}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          post.uploader?.username?.charAt(0).toUpperCase() || 'U'
                        )}
                      </div>
                      {/* Trending badge for top posts */}
                      {index < 3 && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                          {index + 1}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{post.uploader?.username}</h3>
                        {post.engagementScore > 100 && (
                          <span className="px-2 py-1 bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs font-bold rounded-full">
                            🔥 Hot
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{formatTimeAgo(post.uploadTime)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Engagement Score */}
                    <div className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-pink-50 to-purple-50 rounded-full">
                      <span className="text-xs text-pink-600 font-medium">🔥</span>
                      <span className="text-xs text-gray-700 font-medium">
                        {formatEngagementScore(post.engagementScore)}
                      </span>
                    </div>
                    
                    {/* Follow Button */}
                    {post.uploader?._id !== currentUserId && (
                      <button
                        onClick={() => follow(post.uploader._id, post.uploader.username)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          followingStatus[post.uploader._id]
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700'
                        }`}
                      >
                        {followingStatus[post.uploader._id] ? 'Following' : 'Follow'}
                      </button>
                    )}
                    
                    {/* Kebab Menu */}
                    {post.uploader?._id === currentUserId && (
                      <div className="relative kebab-menu">
                        <button
                          onClick={() => setShowKebabMenu(prev => ({ ...prev, [post._id]: !prev[post._id] }))}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        
                        {showKebabMenu[post._id] && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                            <button
                              onClick={() => deletePost(post._id)}
                              className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              Delete Post
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Post Image */}
              <div className="relative">
                <img
                  src={`${config.API_BASE_URL}/api/images/${post._id}`}
                  alt={post.caption}
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    console.error('❌ Image failed to load:', e.target.src);
                    e.target.style.display = 'none';
                  }}
                />
              </div>

              {/* Post Actions */}
              <div className="p-6">
                {/* Caption */}
                {post.caption && (
                  <p className="text-gray-900 mb-4 leading-relaxed">{post.caption}</p>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 text-sm font-medium rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    {/* Like Button */}
                    <button
                      onClick={() => like(post._id)}
                      disabled={interactingPosts[`like-${post._id}`]}
                      className={`flex items-center space-x-2 transition-all duration-200 ${
                        post.__liked
                          ? 'text-red-500 hover:text-red-600'
                          : 'text-gray-400 hover:text-red-500'
                      }`}
                    >
                      <svg className="w-6 h-6" fill={post.__liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span className="font-medium">{post.__likesCount}</span>
                    </button>

                    {/* Comment Button */}
                    <button
                      onClick={() => setExpandedComments(prev => ({ ...prev, [post._id]: !prev[post._id] }))}
                      className="flex items-center space-x-2 text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="font-medium">{post.comments?.length || 0}</span>
                    </button>

                    {/* Overflow Menu Button */}
                    <div className="relative overflow-menu">
                      <button 
                        onClick={() => toggleOverflowMenu(post._id)}
                        className="flex items-center space-x-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                      
                      {/* Overflow Menu Dropdown */}
                      {overflowMenuOpen[post._id] && (
                        <div className="absolute right-0 top-8 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                          {/* Download Option */}
                          <button 
                            onClick={() => {
                              downloadImage(post._id, post.originalName)
                              toggleOverflowMenu(post._id)
                            }}
                            disabled={interactingPosts[`download-${post._id}`]}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                          >
                            {interactingPosts[`download-${post._id}`] ? (
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                            <span>Download</span>
                          </button>
                          
                          {/* Share Option */}
                          <button 
                            onClick={() => {
                              share(post._id, post)
                              toggleOverflowMenu(post._id)
                            }}
                            disabled={interactingPosts[`share-${post._id}`]}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50 transition-colors duration-200"
                          >
                            {interactingPosts[`share-${post._id}`] ? (
                              <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                              </svg>
                            )}
                            <span>Share</span>
                          </button>
                          
                          {/* Delete Option - Only for post owner */}
                          {currentUserId && post.uploader?._id === currentUserId && (
                            <>
                              <div className="border-t border-gray-100"></div>
                              <button 
                                onClick={() => {
                                  deletePost(post._id)
                                  toggleOverflowMenu(post._id)
                                }}
                                disabled={interactingPosts[`delete-${post._id}`]}
                                className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
                              >
                                {interactingPosts[`delete-${post._id}`] ? (
                                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                                <span>Delete</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Engagement Stats */}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>🔥 {formatEngagementScore(post.engagementScore)} engagement</span>
                    <span>💬 {post.comments?.length || 0} comments</span>
                    <span>❤️ {post.__likesCount} likes</span>
                  </div>
                </div>

                {/* Comments Section */}
                {expandedComments[post._id] && (
                  <div className="mt-6 border-t border-gray-100 pt-4">
                    {/* Comment Input */}
                    <div className="flex space-x-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1">
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault()
                            const form = e.target
                            const text = form.comment.value.trim()
                            if (text) {
                              await comment(post._id, text)
                              form.reset()
                            }
                          }}
                          className="flex space-x-2"
                        >
                          <input
                            name="comment"
                            type="text"
                            placeholder="Add a comment..."
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          />
                          <button
                            type="submit"
                            disabled={interactingPosts[`comment-${post._id}`]}
                            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
                          >
                            Post
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-3">
                      {post.comments?.map((comment, index) => (
                        <div key={comment.id || index} className="flex space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {comment.user?.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-semibold text-gray-900">{comment.user?.username}</span>
                                <span className="text-xs text-gray-500">{formatTimeAgo(comment.createdAt)}</span>
                              </div>
                              <p className="text-gray-700">{comment.text}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
