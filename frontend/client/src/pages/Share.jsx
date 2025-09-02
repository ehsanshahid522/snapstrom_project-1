import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api.js'

export default function Share() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [msg, setMsg] = useState('Loading…')

  useEffect(()=>{
    (async()=>{
      try{
        const data = await api(`/api/share/${encodeURIComponent(id)}`, { auth: false })
        setPost(data)
        setMsg('')
      }catch(e){ setMsg(e.message) }
    })()
  },[id])

  if (msg && !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Oops!</h3>
          <p className="text-gray-600 mb-6">{msg}</p>
          <a href="/" className="btn-primary">
            Back to Feed
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shared Post</h1>
          <p className="text-gray-600">A moment shared from Snapstream</p>
        </div>

        {/* Shared Post */}
        {post && (
          <div className="card animate-fade-in">
            {/* Post Header */}
            <div className="card-header">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                  {post.uploader?.profilePicture ? (
                    <img 
                      src={`${import.meta.env.VITE_API_URL || 'https://snapstrom-project-1.vercel.app'}/api/images/${post.uploader.profilePicture}`} 
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-semibold text-sm">
                        {post.uploader?.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {post.uploader?.username || 'User'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(post.uploadTime).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-500">Shared</span>
                </div>
              </div>
            </div>

            {/* Post Image */}
            <div className="relative">
              <img 
                src={`/api/images/${post._id}`} 
                alt={post.originalName || ''} 
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Post Content */}
            <div className="card-body">
              {post.caption && (
                <div className="mb-6">
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {post.caption}
                  </p>
                </div>
              )}

              {/* Engagement Stats */}
              <div className="flex items-center justify-between py-4 border-t border-gray-100">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="text-sm text-gray-600">{post.likes?.length || 0} likes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-sm text-gray-600">{post.comments?.length || 0} comments</span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  via Snapstream
                </div>
              </div>

              {/* Call to Action */}
              <div className="text-center pt-6 border-t border-gray-100">
                <p className="text-gray-600 mb-4">Want to share your own moments?</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a href="/" className="btn-primary">
                    Explore Feed
                  </a>
                  <a href="/upload" className="btn-secondary">
                    Upload Photo
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-2 text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm">Powered by Snapstream</span>
          </div>
        </div>
      </div>
    </div>
  )
}

