import { useState, useEffect } from 'react'
import { api } from '../lib/api.js'
import { config } from '../config.js'

export default function Explore() {
  const [trendingPosts, setTrendingPosts] = useState([])
  const [popularUsers, setPopularUsers] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredPosts, setFilteredPosts] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [followingStatus, setFollowingStatus] = useState({})
  const [interactingPosts, setInteractingPosts] = useState({})
  const [interactingUsers, setInteractingUsers] = useState({})
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('trending') // 'trending', 'recent', 'popular'

  useEffect(() => {
    fetchExploreData()
    getCurrentUser()
  }, [])

  useEffect(() => {
    filterAndSortPosts()
  }, [trendingPosts, activeCategory, searchQuery, sortBy])

  const getCurrentUser = () => {
    const username = localStorage.getItem('username')
    if (username) {
      setCurrentUser({ username })
    }
  }

  async function fetchExploreData() {
    try {
      setLoading(true)
      
      // Try to fetch real data first
      try {
        const [postsData, usersData, categoriesData] = await Promise.all([
          api('/feed'), // Use existing feed endpoint for now
          api('/explore/popular-users', { method: 'GET' }).catch(() => ({ users: [] })),
          api('/explore/categories', { method: 'GET' }).catch(() => ({ categories: [] }))
        ])
        
        // Process posts data
        const processedPosts = Array.isArray(postsData) ? postsData : (postsData.data || [])
        setTrendingPosts(processedPosts)
        
        // Process users data
        setPopularUsers(usersData.users || [])
        setCategories(categoriesData.categories || [])
        
      } catch (error) {
        console.log('Using fallback data for explore page')
        // Fallback to mock data
        setTrendingPosts([
          { 
            _id: 1, 
            caption: 'Amazing Sunset at the Beach', 
            uploader: { username: 'photographer1' }, 
            __likesCount: 156, 
            uploadTime: new Date(Date.now() - 86400000).toISOString(),
            image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop'
          },
          { 
            _id: 2, 
            caption: 'City Lights at Night', 
            uploader: { username: 'urban_explorer' }, 
            __likesCount: 89, 
            uploadTime: new Date(Date.now() - 172800000).toISOString(),
            image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=300&fit=crop'
          },
          { 
            _id: 3, 
            caption: 'Beautiful Nature Walk', 
            uploader: { username: 'nature_lover' }, 
            __likesCount: 234, 
            uploadTime: new Date(Date.now() - 259200000).toISOString(),
            image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop'
          },
          { 
            _id: 4, 
            caption: 'Delicious Food Photography', 
            uploader: { username: 'foodie_creator' }, 
            __likesCount: 189, 
            uploadTime: new Date(Date.now() - 345600000).toISOString(),
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop'
          },
          { 
            _id: 5, 
            caption: 'Artistic Photography', 
            uploader: { username: 'art_photographer' }, 
            __likesCount: 312, 
            uploadTime: new Date(Date.now() - 432000000).toISOString(),
            image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop'
          },
          { 
            _id: 6, 
            caption: 'Technology and Innovation', 
            uploader: { username: 'tech_enthusiast' }, 
            __likesCount: 145, 
            uploadTime: new Date(Date.now() - 518400000).toISOString(),
            image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop'
          }
        ])
        
        setPopularUsers([
          { 
            _id: 1, 
            username: 'photographer1', 
            followers: 1200, 
            profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&h=60&fit=crop&crop=face',
            posts: 45
          },
          { 
            _id: 2, 
            username: 'urban_explorer', 
            followers: 890, 
            profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
            posts: 32
          },
          { 
            _id: 3, 
            username: 'nature_lover', 
            followers: 2100, 
            profilePicture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face',
            posts: 67
          },
          { 
            _id: 4, 
            username: 'foodie_creator', 
            followers: 1560, 
            profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
            posts: 28
          }
        ])
        
        setCategories([
          { id: 'photography', name: '📸 Photography', count: 1250, color: 'from-blue-500 to-purple-600' },
          { id: 'travel', name: '✈️ Travel', count: 890, color: 'from-green-500 to-teal-600' },
          { id: 'food', name: '🍕 Food', count: 567, color: 'from-orange-500 to-red-600' },
          { id: 'art', name: '🎨 Art', count: 432, color: 'from-pink-500 to-rose-600' },
          { id: 'technology', name: '💻 Technology', count: 345, color: 'from-indigo-500 to-blue-600' },
          { id: 'nature', name: '🌿 Nature', count: 678, color: 'from-emerald-500 to-green-600' }
        ])
      }
      
    } catch (error) {
      console.error('Error fetching explore data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortPosts = () => {
    let filtered = [...trendingPosts]
    
    // Filter by category (if not 'all')
    if (activeCategory !== 'all') {
      // For now, we'll do basic filtering. In real app, posts would have category tags
      filtered = filtered.filter((_, index) => {
        const categoryIndex = index % categories.length
        return categories[categoryIndex]?.id === activeCategory
      })
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(post => 
        post.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.uploader?.username?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Sort posts
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime))
        break
      case 'popular':
        filtered.sort((a, b) => (b.__likesCount || 0) - (a.__likesCount || 0))
        break
      case 'trending':
      default:
        // Trending combines recency and popularity
        filtered.sort((a, b) => {
          const aScore = (a.__likesCount || 0) * (1 / (Date.now() - new Date(a.uploadTime).getTime() + 1))
          const bScore = (b.__likesCount || 0) * (1 / (Date.now() - new Date(b.uploadTime).getTime() + 1))
          return bScore - aScore
        })
        break
    }
    
    setFilteredPosts(filtered)
  }

  const like = async (id) => {
    try {
      setInteractingPosts(prev => ({ ...prev, [`like-${id}`]: true }))
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setTrendingPosts(prev => prev.map(p => {
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

  const followUser = async (userId) => {
    try {
      setInteractingUsers(prev => ({ ...prev, [`follow-${userId}`]: true }))
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setFollowingStatus(prev => ({
        ...prev,
        [userId]: !prev[userId]
      }))
      
      setPopularUsers(prev => prev.map(user => {
        if (user._id === userId) {
          return {
            ...user,
            followers: prev[userId] ? user.followers - 1 : user.followers + 1
          }
        }
        return user
      }))
    } catch (error) {
      console.error('Error following user:', error)
    } finally {
      setInteractingUsers(prev => ({ ...prev, [`follow-${userId}`]: false }))
    }
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
          <p className="text-gray-600 text-lg">Exploring amazing content...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4 animate-pulse">🌍 Explore</h1>
            <p className="text-2xl opacity-90 mb-6">Discover trending posts, popular creators, and amazing content</p>
            <div className="flex items-center justify-center space-x-2 text-sm opacity-75">
              <span className="bg-white/20 px-3 py-1 rounded-full">🔥 Live</span>
              <span className="bg-white/20 px-3 py-1 rounded-full">⚡ Real-time</span>
              <span className="bg-white/20 px-3 py-1 rounded-full">🌟 Trending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <div className="flex-1 w-full max-w-2xl">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Search posts, creators, or categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 pl-14 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-lg"
                />
                <svg className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4">
              {/* Sort Options */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-lg font-medium"
              >
                <option value="trending">🔥 Trending</option>
                <option value="recent">⏰ Recent</option>
                <option value="popular">⭐ Popular</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-2xl p-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    viewMode === 'grid' ? 'bg-white shadow-lg text-purple-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z"/>
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    viewMode === 'list' ? 'bg-white shadow-lg text-purple-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 13h18v-2H3v2zm0 6h18v-2H3v2zM3 5v2h18V5H3z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3 text-4xl">📂</span>
            Categories
          </h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-8 py-4 rounded-2xl text-lg font-bold transition-all duration-300 transform hover:scale-105 ${
                activeCategory === 'all'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-xl'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-lg'
              }`}
            >
              🌟 All Posts
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-8 py-4 rounded-2xl text-lg font-bold transition-all duration-300 transform hover:scale-105 ${
                  activeCategory === category.id
                    ? `bg-gradient-to-r ${category.color} text-white shadow-xl`
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-lg'
                }`}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-8">
          <p className="text-lg text-gray-600">
            Showing {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'} 
            {searchQuery && ` for "${searchQuery}"`}
            {activeCategory !== 'all' && ` in ${categories.find(c => c.id === activeCategory)?.name}`}
          </p>
        </div>

        {/* Upcoming Features Note */}
        <div className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🚀</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-yellow-800 mb-1">Coming Soon!</h3>
              <p className="text-yellow-700">
                Advanced filtering, AI-powered recommendations, and more interactive features are being developed. 
                Stay tuned for the next big update!
              </p>
            </div>
          </div>
        </div>

        {/* Trending Posts */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
            <span className="mr-4 text-4xl">🔥</span>
            {sortBy === 'trending' ? 'Trending Posts' : sortBy === 'recent' ? 'Recent Posts' : 'Popular Posts'}
          </h2>
          
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No posts found</h3>
              <p className="text-gray-600 text-lg">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className={`grid gap-8 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {filteredPosts.map((post) => (
                <div key={post._id} className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                  {/* Post Image */}
                  <div className="relative group">
                    <img 
                      src={post.image || `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop`} 
                      alt={post.caption}
                      className="w-full h-56 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Floating Action Buttons */}
                    <div className="absolute top-4 right-4 flex space-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <button 
                        onClick={() => share(post._id, post)}
                        className="w-12 h-12 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-300 transform hover:scale-110 shadow-xl"
                      >
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center ring-4 ring-pink-100">
                          <span className="text-pink-600 font-bold text-lg">
                            {post.uploader?.username?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">@{post.uploader?.username || 'user'}</h3>
                          <p className="text-sm text-gray-500">
                            {post.uploadTime ? new Date(post.uploadTime).toLocaleDateString() : 'Recently'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {post.caption && (
                      <p className="text-gray-800 text-base mb-6 line-clamp-3 leading-relaxed">{post.caption}</p>
                    )}

                    {/* Post Actions */}
                    <div className="flex items-center justify-between">
                      <button 
                        onClick={() => like(post._id)}
                        disabled={interactingPosts[`like-${post._id}`]}
                        className="flex items-center space-x-3 text-gray-700 hover:text-red-500 transition-all duration-300 transform hover:scale-110 group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {interactingPosts[`like-${post._id}`] ? (
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors shadow-lg">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </div>
                        )}
                        <span className="font-bold text-lg">{post.__likesCount || 0}</span>
                      </button>

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <span className="text-lg">💬</span>
                          <span>{Math.floor(Math.random() * 20) + 1}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <span className="text-lg">👁️</span>
                          <span>{Math.floor(Math.random() * 100) + 50}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular Users */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
            <span className="mr-4 text-4xl">⭐</span>
            Popular Creators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {popularUsers.map((user) => (
              <div key={user._id} className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 text-center">
                <div className="relative mb-6">
                  <img 
                    src={user.profilePicture || `https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face`} 
                    alt={user.username}
                    className="w-24 h-24 rounded-full mx-auto object-cover ring-6 ring-purple-100 shadow-lg"
                  />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg"></div>
                </div>
                <h3 className="font-bold text-gray-900 text-xl mb-2">@{user.username}</h3>
                <div className="flex items-center justify-center space-x-6 text-base text-gray-600 mb-6">
                  <span>{user.followers.toLocaleString()} followers</span>
                  <span>•</span>
                  <span>{user.posts} posts</span>
                </div>
                <button 
                  onClick={() => followUser(user._id)}
                  disabled={interactingUsers[`follow-${user._id}`]}
                  className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                    followingStatus[user._id]
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 shadow-xl'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {interactingUsers[`follow-${user._id}`] ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Following...</span>
                    </div>
                  ) : followingStatus[user._id] ? (
                    '✓ Following'
                  ) : (
                    'Follow'
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Call to Action */}
        <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-3xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Ready to Share Your Story?</h2>
          <p className="text-2xl opacity-90 mb-8">Join thousands of creators sharing amazing moments</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a 
              href="/upload"
              className="bg-white text-purple-600 px-10 py-5 rounded-2xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 font-bold text-xl shadow-2xl"
            >
              📸 Start Sharing
            </a>
            <a 
              href="/"
              className="bg-white/20 backdrop-blur-sm text-white px-10 py-5 rounded-2xl hover:bg-white/30 transition-all duration-300 transform hover:scale-105 font-bold text-xl border-2 border-white/30"
            >
              🌍 Browse All Posts
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
