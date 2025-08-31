import { useState, useEffect } from 'react'
import { api } from '../lib/api.js'

export default function Explore() {
  const [trendingPosts, setTrendingPosts] = useState([])
  const [popularUsers, setPopularUsers] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    fetchExploreData()
  }, [])

  async function fetchExploreData() {
    try {
      setLoading(true)
      // We'll implement these API endpoints in the backend
      const [postsData, usersData, categoriesData] = await Promise.all([
        api('/explore/trending', { method: 'GET' }),
        api('/explore/popular-users', { method: 'GET' }),
        api('/explore/categories', { method: 'GET' })
      ])
      
      setTrendingPosts(postsData.posts || [])
      setPopularUsers(usersData.users || [])
      setCategories(categoriesData.categories || [])
    } catch (error) {
      console.error('Error fetching explore data:', error)
      // For now, set some mock data until backend is ready
      setTrendingPosts([
        { id: 1, title: 'Amazing Sunset', username: 'photographer1', likes: 156, image: 'https://via.placeholder.com/300x200/FF6B6B/FFFFFF?text=Sunset' },
        { id: 2, title: 'City Lights', username: 'urban_explorer', likes: 89, image: 'https://via.placeholder.com/300x200/4ECDC4/FFFFFF?text=City' },
        { id: 3, title: 'Nature Walk', username: 'nature_lover', likes: 234, image: 'https://via.placeholder.com/300x200/45B7D1/FFFFFF?text=Nature' }
      ])
      setPopularUsers([
        { id: 1, username: 'photographer1', followers: 1200, avatar: 'https://via.placeholder.com/60x60/FF6B6B/FFFFFF?text=P1' },
        { id: 2, username: 'urban_explorer', followers: 890, avatar: 'https://via.placeholder.com/60x60/4ECDC4/FFFFFF?text=UE' },
        { id: 3, username: 'nature_lover', followers: 2100, avatar: 'https://via.placeholder.com/60x60/45B7D1/FFFFFF?text=NL' }
      ])
      setCategories([
        { id: 'photography', name: 'Photography', count: 1250 },
        { id: 'travel', name: 'Travel', count: 890 },
        { id: 'food', name: 'Food', count: 567 },
        { id: 'art', name: 'Art', count: 432 },
        { id: 'technology', name: 'Technology', count: 345 }
      ])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Exploring amazing content...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore</h1>
        <p className="text-gray-600">Discover trending posts, popular creators, and amazing content</p>
      </div>

      {/* Categories */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Categories</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              activeCategory === 'all'
                ? 'bg-pink-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeCategory === category.id
                  ? 'bg-pink-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* Trending Posts */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Trending Posts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingPosts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <img 
                src={post.image} 
                alt={post.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{post.title}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">by @{post.username}</span>
                  <div className="flex items-center space-x-1 text-pink-500">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    <span className="text-sm font-medium">{post.likes}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Users */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Popular Creators</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {popularUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-300 text-center">
              <img 
                src={user.avatar} 
                alt={user.username}
                className="w-16 h-16 rounded-full mx-auto mb-3 object-cover"
              />
              <h3 className="font-semibold text-gray-900 mb-1">@{user.username}</h3>
              <p className="text-sm text-gray-600 mb-3">{user.followers.toLocaleString()} followers</p>
              <button className="w-full bg-pink-500 text-white py-2 px-4 rounded-lg hover:bg-pink-600 transition-colors duration-200 text-sm font-medium">
                Follow
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Discovery */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Discover More</h2>
        <p className="text-gray-600 mb-6">Find amazing content and connect with creators from around the world</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors duration-200 font-medium">
            Browse All Posts
          </button>
          <button className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors duration-200 font-medium">
            Find Friends
          </button>
        </div>
      </div>
    </div>
  )
}
