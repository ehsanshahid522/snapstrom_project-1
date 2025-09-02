import { useRef, useState } from 'react'
import { api } from '../lib/api.js'

export default function Upload() {
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const fileRef = useRef()
  const [caption, setCaption] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
      // Ensure the file is properly set in the ref
      if (fileRef.current) {
        fileRef.current.files = e.target.files
      }
    }
  }

  const handleFile = (file) => {
    if (!file.type.startsWith('image/')) {
      setMsg('Please select an image file (JPG, PNG, GIF, etc.).')
      return
    }
    if (file.size > 5*1024*1024) {
      setMsg('File size must be less than 5MB.')
      return
    }
    
    // Additional validation for common image formats
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setMsg('Please select a valid image file (JPG, PNG, GIF, WebP).')
      return
    }
    
    // Store the selected file
    setSelectedFile(file)
    
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
      const file = e.dataTransfer.files[0]
      handleFile(file)
      
      // Create a new FileList-like object and set it to the ref
      if (fileRef.current) {
        // Create a DataTransfer object to simulate file input
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        fileRef.current.files = dataTransfer.files
      }
    }
  }

  async function onSubmit(e) {
    e.preventDefault()
    setMsg('')
    
    // Use selectedFile state as the primary source
    const file = selectedFile || fileRef.current?.files?.[0]
    
    // Debug logging
    console.log('Selected file:', selectedFile)
    console.log('File ref:', fileRef.current)
    console.log('File:', file)
    console.log('Preview:', preview)
    
    if (!file && !preview) { 
      setMsg('Please select an image first.'); 
      return 
    }
    
    if (!file) { 
      setMsg('Image file not found. Please select an image again.'); 
      return 
    }
    
    if (!file.type.startsWith('image/')) { 
      setMsg('Please select a valid image file.'); 
      return 
    }
    
    if (file.size > 5*1024*1024) { 
      setMsg('File size must be less than 5MB.'); 
      return 
    }
    
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    if (!token) {
      setMsg('Please log in to upload photos.')
      return
    }
    
    const form = new FormData()
    form.append('image', file)
    form.append('caption', caption)
    form.append('isPrivate', isPrivate.toString())
    
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
      const response = await api('/upload', { method:'POST', body: form })
      setUploadProgress(100)
      setMsg('Uploaded successfully! Redirecting to feed...')
      setCaption('')
      setIsPrivate(false)
      setPreview(null)
      setSelectedFile(null)
      if (fileRef.current) fileRef.current.value = ''
      
      // Redirect to feed after successful upload
      setTimeout(() => {
        window.location.href = '/'
      }, 1500)
    } catch (e) {
      console.error('Upload error:', e)
      setMsg(e.message || 'Upload failed. Please try again.')
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
                           setSelectedFile(null)
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
              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 min-w-fit hover:border-purple-300 transition-all duration-300">
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
                    className={`block w-12 h-6 rounded-full transition-all duration-300 cursor-pointer shadow-inner ${
                      isPrivate 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-purple-300' 
                        : 'bg-gray-300 shadow-gray-400'
                    }`}
                  >
                    <span className={`block w-4 h-4 bg-white rounded-full transform transition-all duration-300 shadow-lg ${
                      isPrivate ? 'translate-x-6' : 'translate-x-1'
                    }`}></span>
                  </label>
                </div>
                <div className="text-center">
                  <label htmlFor="isPrivate" className="text-sm font-bold text-gray-800 cursor-pointer flex items-center">
                    <span className="mr-2 text-lg">🔒</span>
                    {isPrivate ? 'Private Post' : 'Public Post'}
                  </label>
                  <p className="text-xs text-gray-600 mt-1">
                    {isPrivate ? 'Only you can see this post' : 'Everyone can see this post'}
                  </p>
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

