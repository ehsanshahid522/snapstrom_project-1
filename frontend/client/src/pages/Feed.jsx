import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { config } from '../config.js'

export default function Feed() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [followingStatus, setFollowingStatus] = useState({}) // Track follow status for each user
  const [interactingPosts, setInteractingPosts] = useState({}) // Track posts being interacted with
  const [expandedComments, setExpandedComments] = useState({}) // Track which posts have comments expanded
  const [showKebabMenu, setShowKebabMenu] = useState({}) // Track which posts have kebab menu open
  const [overflowMenuOpen, setOverflowMenuOpen] = useState({}) // Track which posts have overflow menu open
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Memoized current user ID extraction
  const currentUserId = useMemo(() => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return null
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.userId || payload.id
    } catch (error) {
      return null
    }
  }, [])

  // Close kebab menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.kebab-menu')) {
        setShowKebabMenu({})
      }
      if (!event.target.closest('.overflow-menu')) {
        setOverflowMenuOpen({})
      }
      if (!event.target.closest('.search-container')) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search users function
  const searchUsers = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`)
      if (response.success) {
        setSearchResults(response.users)
        setShowSearchResults(true)
      }
    } catch (error) {
      console.error('Error searching users:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Handle search query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers(searchQuery)
      } else {
        setSearchResults([])
        setShowSearchResults(false)
      }
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchUsers])

  // Handle user selection from search
  const handleUserSelect = useCallback((user) => {
    navigate(`/profile/${user.username}`)
    setSearchQuery('')
    setSearchResults([])
    setShowSearchResults(false)
  }, [navigate])

    // Function to fetch posts
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      
      // Get current user info
      const username = localStorage.getItem('username')
      if (username) {
        setCurrentUser({ username })
      }

      // Fetch feed data
      const response = await api('/feed')
      
      // Handle both direct array response and wrapped response
      const postsData = response.success ? response.data : (Array.isArray(response) ? response : []);
      
      if (!postsData || !Array.isArray(postsData)) {
        throw new Error('Failed to fetch feed data')
      }
      
      // Map the data to match expected structure
      const mapPosts = (data) => data.map(p => {
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
      
      // Set posts
      setPosts(mappedPosts);
      
      // Initialize following status for all users in the feed
      const allUsers = mappedPosts
        .map(p => {
          const userId = p.uploader?._id;
          // Ensure userId is a string, not an object
          return typeof userId === 'object' ? userId._id || userId.id : userId;
        })
        .filter(id => id && id !== 'undefined' && id !== null)
        .filter((id, index, arr) => arr.indexOf(id) === index);
      
      // Check follow status for each user
      const followStatus = {};
      for (const userId of allUsers) {
        try {
          const response = await api(`/auth/follow-status/${userId}`).catch(() => ({ isFollowing: false }));
          followStatus[userId] = response.isFollowing || false;
        } catch (error) {
          followStatus[userId] = false;
        }
      }
      setFollowingStatus(followStatus);
      
    } catch (e) {
      console.error('Error fetching feed:', e)
      setPosts([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }, [currentUserId])

  useEffect(() => {
    fetchPosts()
  }, []) // Re-fetch posts on component mount

  const like = useCallback(async (id) => {
    try {
      // Set loading state
      setInteractingPosts(prev => ({ ...prev, [`like-${id}`]: true }));
      
      const response = await api(`/like/${id}`, { method: 'POST' })
      
      // Update posts with new like status
      const updatePosts = (postList) => postList.map(p => p._id === id ? ({
        ...p,
        __liked: response.isLiked,
        __likesCount: response.likesCount
      }) : p)
      
      setPosts(ps => updatePosts(ps))
    } catch (error) {
      console.error('Error liking post:', error)
    } finally {
      // Clear loading state
      setInteractingPosts(prev => ({ ...prev, [`like-${id}`]: false }));
    }
  }, [])

  const comment = useCallback(async (id, text) => {
    try {
      // Set loading state
      setInteractingPosts(prev => ({ ...prev, [`comment-${id}`]: true }));
      
      const response = await api(`/comment/${id}`, { 
        method: 'POST', 
        body: { text } 
      })
      
      // Update posts with new comment
      const updatePosts = (postList) => postList.map(p => p._id === id ? ({
        ...p,
        comments: [...(p.comments || []), response.comment]
      }) : p)
      
      setPosts(ps => updatePosts(ps))
    } catch (error) {
      console.error('Error commenting on post:', error)
    } finally {
      // Clear loading state
      setInteractingPosts(prev => ({ ...prev, [`comment-${id}`]: false }));
    }
  }, [])

  const share = useCallback(async (id, post) => {
    try {
      // Set loading state
      setInteractingPosts(prev => ({ ...prev, [`share-${id}`]: true }));
      
      const response = await api(`/share/${id}`, { method: 'POST' })
      
      if (response.shareUrl) {
        // Create share options modal
        showShareOptions(response.shareUrl, post);
      }
      
      return response.shareUrl;
    } catch (error) {
      console.error('Error sharing post:', error)
      alert('Failed to share post. Please try again.');
    } finally {
      // Clear loading state
      setInteractingPosts(prev => ({ ...prev, [`share-${id}`]: false }));
    }
  }, [])

  const downloadPost = useCallback(async (post) => {
    try {
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = `${import.meta.env.VITE_API_URL || 'https://snapstrom-project-1.vercel.app'}/api/images/${post.image}`;
      link.download = `snapstrom-post-${post._id}.jpg`;
      link.target = '_blank';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      window.showToast('Post downloaded successfully! 📥', 'success');
    } catch (error) {
      console.error('Error downloading post:', error);
      window.showToast('Failed to download post. Please try again.', 'error');
    }
  }, [])

  const downloadImage = useCallback(async (postId, originalName) => {
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
  }, [])

  const toggleOverflowMenu = useCallback((postId) => {
    setOverflowMenuOpen(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }))
  }, [])

  const showShareOptions = useCallback((shareUrl, post) => {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.id = 'share-modal';
    
    const modalContent = `
      <div class="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-slide-up">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-2xl font-bold text-gray-900">Share Post</h3>
          <button onclick="closeShareModal()" class="text-gray-500 hover:text-gray-700 text-2xl">
            ✕
          </button>
        </div>
        
        <div class="space-y-4">
          <!-- Copy Link -->
          <button onclick="copyToClipboard('${shareUrl}')" class="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105">
            <span class="text-xl">📋</span>
            <span class="font-semibold">Copy Link</span>
          </button>
          
          <!-- Share on WhatsApp -->
          <button onclick="shareOnWhatsApp('${shareUrl}', '${post?.caption || 'Check out this post!'}')" class="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-2xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105">
            <span class="text-xl">📱</span>
            <span class="font-semibold">Share on WhatsApp</span>
          </button>
          
          <!-- Share on Twitter/X -->
          <button onclick="shareOnTwitter('${shareUrl}', '${post?.caption || 'Check out this post!'}')" class="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-black to-gray-800 text-white py-4 px-6 rounded-2xl hover:from-gray-800 hover:to-gray-900 transition-all duration-300 transform hover:scale-105">
            <span class="text-xl">🐦</span>
            <span class="font-semibold">Share on Twitter/X</span>
          </button>
          
          <!-- Share on Facebook -->
          <button onclick="shareOnFacebook('${shareUrl}')" class="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105">
            <span class="text-xl">📘</span>
            <span class="font-semibold">Share on Facebook</span>
          </button>
          
          <!-- Share on LinkedIn -->
          <button onclick="shareOnLinkedIn('${shareUrl}', '${post?.caption || 'Check out this post!'}')" class="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-700 to-blue-800 text-white py-4 px-6 rounded-2xl hover:from-blue-800 hover:to-blue-900 transition-all duration-300 transform hover:scale-105">
            <span class="text-xl">💼</span>
            <span class="font-semibold">Share on LinkedIn</span>
          </button>
          
          <!-- Share via Email -->
          <button onclick="shareViaEmail('${shareUrl}', '${post?.caption || 'Check out this post!'}')" class="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-red-500 to-red-600 text-white py-4 px-6 rounded-2xl hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105">
            <span class="text-xl">📧</span>
            <span class="font-semibold">Share via Email</span>
          </button>
          
          <!-- Download Image -->
          <button onclick="downloadImage('${post?.imageUrl || ''}', '${post?.caption || 'snapstream-post'}')" class="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-4 px-6 rounded-2xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105">
            <span class="text-xl">💾</span>
            <span class="font-semibold">Download Image</span>
          </button>
          
          <!-- QR Code -->
          <button onclick="generateQRCode('${shareUrl}')" class="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-4 px-6 rounded-2xl hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105">
            <span class="text-xl">📱</span>
            <span class="font-semibold">Generate QR Code</span>
          </button>
        </div>
        
        <div class="mt-6 text-center">
          <button onclick="closeShareModal()" class="text-gray-500 hover:text-gray-700 font-medium">
            Cancel
          </button>
        </div>
      </div>
    `;
    
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Add global functions for sharing
    window.closeShareModal = () => {
      const modal = document.getElementById('share-modal');
      if (modal) {
        modal.remove();
      }
    };
    
    window.copyToClipboard = async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast('✅ Link copied to clipboard!', 'success');
      } catch (error) {
        showToast('❌ Failed to copy link', 'error');
      }
    };
    
    window.shareOnWhatsApp = (url, text) => {
      const message = encodeURIComponent(`${text}\n\n${url}`);
      window.open(`https://wa.me/?text=${message}`, '_blank');
      closeShareModal();
    };
    
    window.shareOnTwitter = (url, text) => {
      const message = encodeURIComponent(`${text}\n\n${url}`);
      window.open(`https://twitter.com/intent/tweet?text=${message}`, '_blank');
      closeShareModal();
    };
    
    window.shareOnFacebook = (url) => {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
      closeShareModal();
    };
    
    window.shareOnLinkedIn = (url, text) => {
      const message = encodeURIComponent(`${text}\n\n${url}`);
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
      closeShareModal();
    };
    
    window.shareViaEmail = (url, text) => {
      const subject = encodeURIComponent('Check out this post on SnapStream!');
      const body = encodeURIComponent(`${text}\n\n${url}`);
      window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
      closeShareModal();
    };
    
    window.downloadImage = async (imageUrl, filename) => {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showToast('✅ Image downloaded!', 'success');
      } catch (error) {
        showToast('❌ Failed to download image', 'error');
      }
      closeShareModal();
    };
    
    window.generateQRCode = (url) => {
      // Create QR code modal
      const qrModal = document.createElement('div');
      qrModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      qrModal.id = 'qr-modal';
      
      const qrContent = `
        <div class="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl">
          <div class="text-center">
            <h3 class="text-xl font-bold text-gray-900 mb-4">QR Code</h3>
            <div class="bg-gray-100 p-4 rounded-2xl mb-4">
              <div class="text-center text-gray-500">
                <div class="text-6xl mb-2">📱</div>
                <p class="text-sm">QR Code would be generated here</p>
                <p class="text-xs text-gray-400 mt-2">URL: ${url.substring(0, 30)}...</p>
              </div>
            </div>
            <button onclick="closeQRModal()" class="bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600 transition-colors">
              Close
            </button>
          </div>
        </div>
      `;
      
      qrModal.innerHTML = qrContent;
      document.body.appendChild(qrModal);
      
      window.closeQRModal = () => {
        const modal = document.getElementById('qr-modal');
        if (modal) {
          modal.remove();
        }
      };
    };
    
    // Toast notification function
    window.showToast = (message, type = 'info') => {
      const toast = document.createElement('div');
      toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-xl text-white font-semibold shadow-2xl transform transition-all duration-300 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 'bg-blue-500'
      }`;
      toast.textContent = message;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.remove();
      }, 3000);
    };
  }, [])

  const deleteAllPosts = useCallback(async () => {
    try {
      // Double confirmation for safety
      const confirmed = window.confirm(
        '⚠️ WARNING: This will permanently delete ALL posts from the database!\n\n' +
        'This action cannot be undone. Are you absolutely sure you want to continue?'
      );
      
      if (!confirmed) return;
      
      // Second confirmation
      const finalConfirmed = window.confirm(
        '🚨 FINAL WARNING: You are about to delete ALL posts!\n\n' +
        'Type "YES" to confirm:'
      );
      
      if (!finalConfirmed) return;
      
      console.log('🗑️  Deleting all posts...');
      
      const response = await api('/admin/delete-all-posts', { method: 'DELETE' });
      
      console.log('✅ All posts deleted:', response);
      
      alert(`Successfully deleted ${response.deletedCount} posts!`);
      
      // Refresh the posts list
      fetchPosts();
    } catch (error) {
      console.error('Error deleting all posts:', error);
      alert('Failed to delete all posts. Please try again.');
    }
  }, [fetchPosts])

  const fixPostOwnership = useCallback(async (id) => {
    try {
      console.log('🔧 Attempting to fix post ownership:', id);
      
      const response = await api(`/fix-post-ownership/${id}`, { method: 'POST' });
      
      console.log('✅ Post ownership fixed:', response);
      
      alert('Post ownership has been fixed! You can now delete this post.');
      
      // Refresh the posts to show updated data
      fetchPosts();
    } catch (error) {
      console.error('Error fixing post ownership:', error);
      alert('Failed to fix post ownership. Please try again.');
    }
  }, [fetchPosts])

  const deletePost = useCallback(async (id) => {
    try {
      console.log('🔍 Deleting post:', id);
      
      // Confirm deletion
      const confirmed = window.confirm('Are you sure you want to delete this post? This action cannot be undone.');
      if (!confirmed) return;
      
      // Set loading state
      setInteractingPosts(prev => ({ ...prev, [`delete-${id}`]: true }));
      
      const response = await api(`/post/${id}`, { method: 'DELETE' })
      
      console.log('✅ Delete response:', response);
      
      // Remove post from state
      setPosts(prev => prev.filter(p => p._id !== id));
      
      alert('Post deleted successfully!');
    } catch (error) {
      console.error('Error deleting post:', error)
      console.error('Error details:', {
        status: error.status,
        message: error.message,
        body: error.body
      });
      
      let errorMessage = 'Failed to delete post. Please try again.';
      let shouldFix = false;
      
      if (error.status === 403) {
        errorMessage = 'You can only delete your own posts. This post may have been created before the recent fix. Would you like to fix the ownership?';
        
        // Ask user if they want to fix ownership
        shouldFix = window.confirm(errorMessage);
        if (shouldFix) {
          await fixPostOwnership(id);
          return; // Exit early since we're fixing ownership
        }
      } else if (error.status === 401) {
        errorMessage = 'Please log in again to delete posts.';
      } else if (error.body && error.body.debug) {
        console.log('Debug info:', error.body.debug);
      }
      
      if (!shouldFix) {
        alert(errorMessage);
      }
    } finally {
      // Clear loading state
      setInteractingPosts(prev => ({ ...prev, [`delete-${id}`]: false }));
    }
  }, [fixPostOwnership])

  const toggleFollow = useCallback(async (userId, username) => {
    try {
      // Ensure userId is a string
      const userIdString = typeof userId === 'object' ? userId._id || userId.id : userId;
      
      if (!userIdString || userIdString === 'undefined' || userIdString === null) {
        console.error('Invalid userId:', userIdString)
        return
      }
      
      console.log('🔍 Following user:', userIdString, username);
      
      const response = await api(`/follow/${userIdString}`, { method: 'POST' })
      
      // Update following status
      setFollowingStatus(prev => ({
        ...prev,
        [userIdString]: response.isFollowing
      }))
      
      console.log('✅ Follow status updated:', response.isFollowing)
    } catch (error) {
      console.error('Error toggling follow:', error)
      alert(`Failed to ${followingStatus[userId] ? 'unfollow' : 'follow'} ${username}. Please try again.`)
    }
  }, [followingStatus])

  const toggleComments = useCallback((postId) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  }, [])

  const getCurrentPosts = useCallback(() => posts, [posts])

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
          <p className="text-slate-700 text-xl font-semibold mb-4">Loading your feed...</p>
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

  const currentPosts = getCurrentPosts()

  if (!currentPosts.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-32 h-32 bg-gradient-to-br from-yellow-200 via-orange-300 to-red-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <svg className="w-16 h-16 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 mb-3">
            {'No Posts Yet'}
          </h3>
          <p className="text-slate-600 mb-8 text-lg">
            {'Be the first to share a photo! ✨'}
          </p>
          <div className="space-y-4">
            <a href="/upload" className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-pink-600 hover:via-purple-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-2xl">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Share Your First Photo 🚀
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="relative search-container">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
              />
              <svg className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {isSearching && (
                <div className="absolute right-3 top-3.5">
                  <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className="p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-gray-50 last:border-b-0"
                    >
                      <div className="flex items-center space-x-3">
                        {/* Avatar */}
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          {user.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        
                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {user.username}
                            </h3>
                            {user.isOnline && (
                              <span className="text-xs text-green-600 font-medium">Online</span>
                            )}
                          </div>
                          {user.bio && (
                            <p className="text-xs text-gray-500 truncate mt-1">{user.bio}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : searchQuery.trim() && !isSearching ? (
                  <div className="p-4 text-center text-gray-500">
                    <p className="text-sm">No users found</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="max-w-2xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50">
          <a href="/upload" className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center text-white text-xl sm:text-2xl">
            📸
          </a>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {currentPosts.map((p, index) => (
            <div 
              key={p._id} 
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden"
            >
              {/* Post Header */}
              <div className="p-4 sm:p-6 pb-4">
                <div className="flex items-center justify-between">
                  {/* Left Side - Username and Profile Info */}
                  <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                    {/* Clickable Profile Picture */}
                    <a 
                      href={`/profile/${p.uploader?.username}`}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 ring-2 ring-pink-200 hover:ring-pink-300 transition-all duration-200 transform hover:scale-105 cursor-pointer flex-shrink-0"
                    >
                      {p.uploader?.profilePicture ? (
                        <img 
                          src={`${import.meta.env.VITE_API_URL || 'https://snapstrom-project-1.vercel.app'}/api/images/${p.uploader.profilePicture}`} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm sm:text-lg">
                          {p.uploader?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </a>
                    
                    {/* Clickable Username and Info */}
                    <div className="flex-1 min-w-0">
                      <a 
                        href={`/profile/${p.uploader?.username}`}
                        className="block hover:opacity-80 transition-opacity duration-200"
                      >
                        <div className="font-bold text-gray-900 text-sm sm:text-lg hover:text-pink-600 transition-colors duration-200 truncate">
                          {p.uploader?.username || 'Unknown User'}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 flex items-center">
                          <span className="mr-1 sm:mr-2">🕐</span>
                          {p.uploadTime ? new Date(p.uploadTime).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }) : 'Unknown date'}
                        </div>
                      </a>
                    </div>
                  </div>
                  
                  {/* Right Side - Badges Only */}
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    {/* Private Badge */}
                    {p.isPrivate && (
                      <div className="px-2 py-1 sm:px-3 sm:py-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold rounded-full">
                        🔒 Private
                      </div>
                    )}
                    
                    {/* Your Post Badge */}
                    {currentUserId && p.uploader?._id === currentUserId && (
                      <div className="px-2 py-1 sm:px-3 sm:py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full">
                        ✨ Your Post
                      </div>
                    )}
                  </div>
                  
                  {/* Right Side - Badges and Follow Button */}
                  <div className="flex items-center space-x-3">
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
                    
                    {/* Follow Button */}
                    {p.uploader?._id && p.uploader?._id !== currentUserId && (
                      <button
                        onClick={() => toggleFollow(p.uploader._id, p.uploader.username)}
                        className={`px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                          followingStatus[p.uploader._id]
                            ? 'bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-600'
                            : 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700 shadow-lg'
                        }`}
                      >
                        {followingStatus[p.uploader._id] ? (
                          <span className="flex items-center space-x-1">
                            <span>✓</span>
                            <span>Following</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1">
                            <span>+</span>
                            <span>Follow</span>
                          </span>
                        )}
                      </button>
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
                 
                 {/* Floating action buttons for user's own posts - Only delete */}
                 {currentUserId && p.uploader?._id === currentUserId && (
                   <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
                 
                 {/* Overflow Menu at bottom of image */}
                 <div className="absolute bottom-3 right-3 overflow-menu">
                   <button 
                     onClick={() => toggleOverflowMenu(p._id)}
                     className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-all duration-200 transform hover:scale-110 shadow-lg"
                   >
                     <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                     </svg>
                   </button>
                   
                   {/* Overflow Menu Dropdown */}
                   {overflowMenuOpen[p._id] && (
                     <div className="absolute bottom-12 right-0 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                       {/* Download Option */}
                       <button 
                         onClick={() => {
                           downloadImage(p._id, p.originalName)
                           toggleOverflowMenu(p._id)
                         }}
                         disabled={interactingPosts[`download-${p._id}`]}
                         className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                       >
                         {interactingPosts[`download-${p._id}`] ? (
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
                           share(p._id, p)
                           toggleOverflowMenu(p._id)
                         }}
                         disabled={interactingPosts[`share-${p._id}`]}
                         className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50 transition-colors duration-200"
                       >
                         {interactingPosts[`share-${p._id}`] ? (
                           <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                         ) : (
                           <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                           </svg>
                         )}
                         <span>Share</span>
                       </button>
                       
                       {/* Delete Option - Only for post owner */}
                       {currentUserId && p.uploader?._id === currentUserId && (
                         <>
                           <div className="border-t border-gray-100"></div>
                           <button 
                             onClick={() => {
                               deletePost(p._id)
                               toggleOverflowMenu(p._id)
                             }}
                             disabled={interactingPosts[`delete-${p._id}`]}
                             className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
                           >
                             {interactingPosts[`delete-${p._id}`] ? (
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

              {/* Caption - Now below image */}
              {p.caption && (
                <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
                  <p className="text-gray-800 text-sm sm:text-base leading-relaxed">
                    {p.caption}
                  </p>
                </div>
              )}

              {/* Post Actions */}
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 sm:space-x-6">
                    <button 
                      onClick={() => like(p._id)}
                      disabled={interactingPosts[`like-${p._id}`]}
                      className="flex items-center space-x-2 sm:space-x-3 text-gray-700 hover:text-red-500 transition-all duration-300 transform hover:scale-110 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {interactingPosts[`like-${p._id}`] ? (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : p.__liked ? (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200 transition-colors shadow-lg">
                          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                        </div>
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors shadow-lg">
                          <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </div>
                      )}
                      <span className="font-bold text-lg sm:text-xl">{p.__likesCount || 0}</span>
                    </button>
                    
                    <button 
                      onClick={() => toggleComments(p._id)}
                      disabled={interactingPosts[`comment-${p._id}`]}
                      className="flex items-center space-x-2 sm:space-x-3 text-gray-700 hover:text-blue-500 transition-all duration-300 transform hover:scale-110 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {interactingPosts[`comment-${p._id}`] ? (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors shadow-lg">
                          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                      )}
                      <span className="font-bold text-lg sm:text-xl">{p.comments?.length || 0}</span>
                    </button>
                  </div>
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

