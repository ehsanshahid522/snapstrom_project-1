import { useState, useEffect } from 'react'
import { api } from '../lib/api.js'
import { config } from '../config.js'
import Logo from '../components/Logo.jsx'

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
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('trending')
  const [showFilters, setShowFilters] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

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
      
      try {
        const [postsData, usersData, categoriesData] = await Promise.all([
          api('/feed'),
          api('/explore/popular-users', { method: 'GET' }).catch(() => ({ users: [] })),
          api('/explore/categories', { method: 'GET' }).catch(() => ({ categories: [] }))
        ])
        
        const processedPosts = Array.isArray(postsData) ? postsData : (postsData.data || [])
        setTrendingPosts(processedPosts)
        setPopularUsers(usersData.users || [])
        setCategories(categoriesData.categories || [])
        
      } catch (error) {
        console.log('Using fallback data for explore page')
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
    
    if (activeCategory !== 'all') {
      filtered = filtered.filter((_, index) => {
        const categoryIndex = index % categories.length
        return categories[categoryIndex]?.id === activeCategory
      })
    }
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(post => 
        post.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.uploader?.username?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime))
        break
      case 'popular':
        filtered.sort((a, b) => (b.__likesCount || 0) - (a.__likesCount || 0))
        break
      case 'trending':
      default:
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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Exploring amazing content...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        @media (max-width: 640px) {
          button, a {
            min-height: 44px;
            min-width: 44px;
          }
        }
        
        .no-select {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        
        .smooth-scroll {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
        
        .logo-glow {
          animation: logoGlow 2s ease-in-out infinite alternate;
        }
        
        @keyframes logoGlow {
          from {
            filter: drop-shadow(0 0 10px rgba(236, 72, 153, 0.5));
          }
          to {
            filter: drop-shadow(0 0 20px rgba(147, 51, 234, 0.8));
          }
        }
      `}</style>
      
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        {/* Header with SNAPSTROM Logo */}
        <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white py-6 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4 sm:mb-6">
                <Logo size="xl" showText={true} />
              </div>
              
              <h2 className="text-3xl sm:text-5xl font-bold mb-2 sm:mb-4 animate-pulse">🌍 Explore</h2>
              <p className="text-lg sm:text-2xl opacity-90 mb-4 sm:mb-6">Discover trending posts, popular creators, and amazing content</p>
              <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm opacity-75">
                <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-full">🔥 Live</span>
                <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-full">⚡ Real-time</span>
                <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-full">🌟 Trending</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Bar with Logo and Horizontal Scrollable Navigation */}
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            {/* Mobile Navigation */}
            <div className="sm:hidden">
              {/* Top Row - Logo and Actions */}
              <div className="flex items-center justify-between mb-3">
                {/* Logo */}
                <div className="flex-shrink-0">
                  <Logo size="md" showText={false} />
                </div>
                
                {/* Search and Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowSearch(!showSearch)}
                    className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl px-4 py-3 text-left text-gray-600 flex items-center no-select shadow-sm border border-gray-200"
                  >
                    <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="text-sm font-medium">Search...</span>
                  </button>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl no-select shadow-sm border border-purple-200"
                  >
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Mobile Search Bar */}
              {showSearch && (
                <div className="mb-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="🔍 Search posts, creators, or categories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 pl-12 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300 transition-all duration-300 text-base shadow-sm"
                    />
                    <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Mobile Filters */}
              {showFilters && (
                <div className="mb-3 space-y-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300 transition-all duration-300 text-base font-medium shadow-sm"
                  >
                    <option value="trending">🔥 Trending</option>
                    <option value="recent">⏰ Recent</option>
                    <option value="popular">⭐ Popular</option>
                  </select>
                </div>
              )}

              {/* Horizontal Scrollable Navigation */}
              <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide smooth-scroll no-select">
                <button 
                  onClick={() => setActiveCategory('all')}
                  className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg flex-shrink-0 border transition-all duration-300 ${
                    activeCategory === 'all'
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-pink-400 shadow-xl'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 shadow-md'
                  }`}
                >
                  🌟 All Posts
                </button>
                <button 
                  onClick={() => setActiveCategory('photography')}
                  className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg flex-shrink-0 border transition-all duration-300 ${
                    activeCategory === 'photography'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-blue-400 shadow-xl'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 shadow-md'
                  }`}
                >
                  📸 Photography
                </button>
                <button 
                  onClick={() => setActiveCategory('travel')}
                  className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg flex-shrink-0 border transition-all duration-300 ${
                    activeCategory === 'travel'
                      ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white border-green-400 shadow-xl'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 shadow-md'
                  }`}
                >
                  ✈️ Travel
                </button>
                <button 
                  onClick={() => setActiveCategory('food')}
                  className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg flex-shrink-0 border transition-all duration-300 ${
                    activeCategory === 'food'
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white border-orange-400 shadow-xl'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 shadow-md'
                  }`}
                >
                  🍕 Food
                </button>
                <button 
                  onClick={() => setActiveCategory('art')}
                  className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg flex-shrink-0 border transition-all duration-300 ${
                    activeCategory === 'art'
                      ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white border-pink-400 shadow-xl'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 shadow-md'
                  }`}
                >
                  🎨 Art
                </button>
                <button 
                  onClick={() => setActiveCategory('technology')}
                  className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg flex-shrink-0 border transition-all duration-300 ${
                    activeCategory === 'technology'
                      ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white border-indigo-400 shadow-xl'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 shadow-md'
                  }`}
                >
                  💻 Tech
                </button>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Logo and Search Bar */}
              <div className="flex items-center space-x-6 flex-1">
                {/* Logo */}
                <div className="flex-shrink-0">
                  <Logo size="lg" showText={true} />
                </div>
                
                {/* Search Bar */}
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="🔍 Search posts, creators, or categories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-6 py-4 pl-14 bg-transparent border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 text-lg"
                    />
                    <svg className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-lg font-medium"
                >
                  <option value="trending">🔥 Trending</option>
                  <option value="recent">⏰ Recent</option>
                  <option value="popular">⭐ Popular</option>
                </select>

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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
          {/* Desktop Horizontal Scroll Categories */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <span className="mr-2 sm:mr-3 text-3xl sm:text-4xl">📂</span>
              Categories
            </h2>
            
            {/* Desktop Horizontal Scroll Categories */}
            <div className="hidden sm:flex overflow-x-auto pb-4 scrollbar-hide smooth-scroll no-select">
              <div className="flex space-x-4 flex-shrink-0">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-8 py-4 rounded-2xl text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg border flex-shrink-0 ${
                    activeCategory === 'all'
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-xl border-pink-400'
                      : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md border-gray-200'
                  }`}
                >
                  🌟 All Posts
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`px-8 py-4 rounded-2xl text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg border flex-shrink-0 ${
                      activeCategory === category.id
                        ? `bg-gradient-to-r ${category.color} text-white shadow-xl border-${category.color.split('-')[1]}-400`
                        : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md border-gray-200'
                    }`}
                  >
                    {category.name} ({category.count})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6 sm:mb-8">
            <p className="text-base sm:text-lg text-gray-600">
              Showing {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'} 
              {searchQuery && ` for "${searchQuery}"`}
              {activeCategory !== 'all' && ` in ${categories.find(c => c.id === activeCategory)?.name}`}
            </p>
          </div>

          {/* Posts Grid */}
          <div className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 flex items-center">
              <span className="mr-3 sm:mr-4 text-3xl sm:text-4xl">🔥</span>
              {sortBy === 'trending' ? 'Trending Posts' : sortBy === 'recent' ? 'Recent Posts' : 'Popular Posts'}
            </h2>
            
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">No posts found</h3>
                <p className="text-gray-600 text-base sm:text-lg">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className={`grid gap-4 sm:gap-8 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
                {filteredPosts.map((post) => (
                  <div key={post._id} className="bg-white rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl overflow-hidden hover:shadow-xl sm:hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                    <div className="relative group">
                      <img 
                        src={post.image || `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop`} 
                        alt={post.caption}
                        className="w-full h-48 sm:h-56 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex space-x-2 sm:space-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <button 
                          onClick={() => share(post._id, post)}
                          className="w-10 h-10 sm:w-12 sm:h-12 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-300 transform hover:scale-110 shadow-xl no-select"
                        >
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="p-4 sm:p-8">
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center ring-3 sm:ring-4 ring-pink-100">
                            <span className="text-pink-600 font-bold text-sm sm:text-lg">
                              {post.uploader?.username?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-base sm:text-lg">@{post.uploader?.username || 'user'}</h3>
                            <p className="text-xs sm:text-sm text-gray-500">
                              {post.uploadTime ? new Date(post.uploadTime).toLocaleDateString() : 'Recently'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {post.caption && (
                        <p className="text-gray-800 text-sm sm:text-base mb-4 sm:mb-6 line-clamp-3 leading-relaxed">{post.caption}</p>
                      )}

                      <div className="flex items-center justify-between">
                        <button 
                          onClick={() => like(post._id)}
                          disabled={interactingPosts[`like-${post._id}`]}
                          className="flex items-center space-x-2 sm:space-x-3 text-gray-700 hover:text-red-500 transition-all duration-300 transform hover:scale-110 group disabled:opacity-50 disabled:cursor-not-allowed no-select"
                        >
                          {interactingPosts[`like-${post._id}`] ? (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors shadow-lg">
                              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            </div>
                          )}
                          <span className="font-bold text-base sm:text-lg">{post.__likesCount || 0}</span>
                        </button>

                        <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <span className="text-base sm:text-lg">💬</span>
                            <span>{Math.floor(Math.random() * 20) + 1}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <span className="text-base sm:text-lg">👁️</span>
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

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center text-white">
            <h2 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-6">Ready to Share Your Story?</h2>
            <p className="text-lg sm:text-2xl opacity-90 mb-6 sm:mb-8">Join thousands of creators sharing amazing moments</p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
              <a 
                href="/upload"
                className="bg-white text-purple-600 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 font-bold text-lg sm:text-xl shadow-2xl no-select"
              >
                📸 Start Sharing
              </a>
              <a 
                href="/"
                className="bg-white/20 backdrop-blur-sm text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl hover:bg-white/30 transition-all duration-300 transform hover:scale-105 font-bold text-lg sm:text-xl border-2 border-white/30 no-select"
              >
                🌍 Browse All Posts
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
