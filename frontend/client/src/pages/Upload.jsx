import { useRef, useState } from 'react'
import { api } from '../lib/api.js'

export default function Upload() {
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const fileRef = useRef()
  const [caption, setCaption] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleFile = (file) => {
    if (!file.type.startsWith('image/')) {
      setMsg('Please select an image file.')
      return
    }
    if (file.size > 5*1024*1024) {
      setMsg('File size must be less than 5MB.')
      return
    }
    
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)
    setMsg('')
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
      if (fileRef.current) {
        fileRef.current.files = e.dataTransfer.files
      }
    }
  }

  async function onSubmit(e) {
    e.preventDefault()
    setMsg('')
    const file = fileRef.current?.files?.[0]
    if (!file) { setMsg('Select an image.'); return }
    if (!file.type.startsWith('image/')) { setMsg('Please select an image file.'); return }
    if (file.size > 5*1024*1024) { setMsg('File size must be less than 5MB.'); return }
    
    const form = new FormData()
    form.append('image', file)
    form.append('caption', caption)
    form.append('isPrivate', isPrivate)
    
    setLoading(true)
    setUploadProgress(0)
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + 10
      })
    }, 200)
    
    try {
      await api('/upload', { method:'POST', body: form })
      setUploadProgress(100)
      setMsg('Uploaded successfully!')
      setCaption('')
      setIsPrivate(false)
      setPreview(null)
      if (fileRef.current) fileRef.current.value = ''
      
      // Reset progress after success
      setTimeout(() => setUploadProgress(0), 2000)
    } catch (e) {
      setMsg(e.message)
      setUploadProgress(0)
    } finally {
      setLoading(false)
      clearInterval(progressInterval)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white py-6">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-2">Share Your Moment</h1>
          <p className="text-lg opacity-90">Upload and share your photos with the Snapstream community</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Upload Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* File Upload Area */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                📸 Choose Your Photo
              </label>
              <div 
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${
                  dragActive 
                    ? 'border-purple-400 bg-purple-50 scale-105' 
                    : preview 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {preview ? (
                  <div className="space-y-3">
                    <div className="relative inline-block">
                      <img 
                        src={preview} 
                        alt="Preview" 
                        className="h-32 w-auto rounded-lg object-cover shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreview(null)
                          if (fileRef.current) fileRef.current.value = ''
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-sm"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-green-600 font-medium text-sm">✓ Image selected successfully!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-base font-medium text-gray-700 mb-1">Drop your image here</p>
                      <p className="text-gray-500 mb-3 text-sm">or click to browse</p>
                      <label className="cursor-pointer bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 text-sm">
                        Choose File
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          ref={fileRef}
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Caption and Privacy in one line */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Caption */}
              <div className="flex-1">
                <label htmlFor="caption" className="block text-sm font-semibold text-gray-800 mb-2">
                  💭 Caption (optional)
                </label>
                <textarea
                  id="caption"
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="What's on your mind? Share your story..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all duration-200 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">{caption.length}/500 characters</p>
              </div>

              {/* Privacy Toggle */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg min-w-fit">
                <div className="relative">
                  <input
                    id="isPrivate"
                    type="checkbox"
                    checked={isPrivate}
                    onChange={e => setIsPrivate(e.target.checked)}
                    className="sr-only"
                  />
                  <label 
                    htmlFor="isPrivate" 
                    className={`block w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer ${
                      isPrivate ? 'bg-purple-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`block w-3 h-3 bg-white rounded-full transform transition-transform duration-200 ${
                      isPrivate ? 'translate-x-5' : 'translate-x-1'
                    }`}></span>
                  </label>
                </div>
                <div>
                  <label htmlFor="isPrivate" className="text-sm font-medium text-gray-700 cursor-pointer">
                    🔒 Private
                  </label>
                  <p className="text-xs text-gray-500">Only you can see</p>
                </div>
              </div>
            </div>

            {/* Message */}
            {msg && (
              <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
                msg.includes('successfully') 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {msg}
              </div>
            )}

            {/* Upload Progress */}
            {loading && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !preview}
              className={`w-full py-3 rounded-lg font-semibold text-base transition-all duration-300 transform ${
                loading || !preview
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 hover:scale-105 shadow-lg'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Uploading...</span>
                </div>
              ) : (
                '🚀 Share Photo'
              )}
            </button>
          </form>
        </div>

        {/* Community Guidelines */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
            📋 Community Guidelines
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              <span>Share original content that you own</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              <span>Be respectful and kind to others</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              <span>Keep content appropriate for all ages</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              <span>No spam, harassment, or harmful content</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

