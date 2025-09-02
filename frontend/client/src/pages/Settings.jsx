import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false)
  const [updatingSettings, setUpdatingSettings] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('success') // 'success' or 'error'
  
  // User data
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    bio: '',
    isPrivateAccount: false,
    profilePicture: null
  })
  
  // Form states
  const [bio, setBio] = useState('')
  const [isPrivateAccount, setIsPrivateAccount] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newUsername, setNewUsername] = useState('')

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://snapstrom-project-1.vercel.app'}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUserData(data.user)
        setBio(data.user.bio || '')
        setIsPrivateAccount(data.user.isPrivateAccount || false)
        setNewUsername(data.user.username || '')
      } else {
        showMessage('Failed to load user data', 'error')
      }
    } catch (error) {
      showMessage('Failed to load user data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (message, type = 'success') => {
    setMsg(message)
    setMsgType(type)
    setTimeout(() => setMsg(''), 5000)
  }

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage('Please select an image file', 'error')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage('Image size should be less than 5MB', 'error')
      return
    }

    setUploadingProfilePic(true)
    try {
      const formData = new FormData()
      formData.append('profilePicture', file)

      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://snapstrom-project-1.vercel.app'}/api/profile/picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setUserData(prev => ({
          ...prev,
          profilePicture: result.profilePicture
        }))
        showMessage('Profile picture updated successfully!')
      } else {
        const error = await response.json()
        showMessage(error.message || 'Failed to update profile picture', 'error')
      }
    } catch (error) {
      console.error('Profile picture upload error:', error)
      showMessage('Failed to update profile picture. Please try again.', 'error')
    } finally {
      setUploadingProfilePic(false)
    }
  }

  const updateAccountSettings = async () => {
    setUpdatingSettings(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://snapstrom-project-1.vercel.app'}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: newUsername,
          bio: bio,
          isPrivateAccount: isPrivateAccount
        })
      })

      if (response.ok) {
        const result = await response.json()
        setUserData(prev => ({
          ...prev,
          username: result.user.username,
          bio: result.user.bio,
          isPrivateAccount: result.user.isPrivateAccount
        }))
        showMessage('Account settings updated successfully!')
      } else {
        const error = await response.json()
        showMessage(error.message || 'Failed to update settings', 'error')
      }
    } catch (error) {
      console.error('Settings update error:', error)
      showMessage('Failed to update settings. Please try again.', 'error')
    } finally {
      setUpdatingSettings(false)
    }
  }

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      showMessage('New passwords do not match', 'error')
      return
    }
    if (newPassword.length < 6) {
      showMessage('New password must be at least 6 characters long', 'error')
      return
    }

    setChangingPassword(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://snapstrom-project-1.vercel.app'}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })

      if (response.ok) {
        showMessage('Password changed successfully!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const error = await response.json()
        showMessage(error.message || 'Failed to change password', 'error')
      }
    } catch (error) {
      console.error('Password change error:', error)
      showMessage('Failed to change password. Please try again.', 'error')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('userId')
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
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

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3 drop-shadow-lg">
            ⚙️ Account Settings
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your Snapstream account preferences and profile
          </p>
        </div>

        {/* Message Display */}
        {msg && (
          <div className={`mb-6 p-4 rounded-xl border-2 shadow-lg ${
            msgType === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              <span className="text-xl mr-3">
                {msgType === 'success' ? '✅' : '❌'}
              </span>
              <span className="font-medium">{msg}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Picture Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📸 Profile Picture</h2>
              
              {/* Current Profile Picture */}
              <div className="relative group mb-6">
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 shadow-2xl ring-4 ring-white ring-opacity-50">
                  {userData.profilePicture ? (
                    <img 
                      src={`${import.meta.env.VITE_API_URL || 'https://snapstrom-project-1.vercel.app'}/api/images/${userData.profilePicture}`} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 flex items-center justify-center ${userData.profilePicture ? 'hidden' : ''}`}>
                    <span className="text-orange-600 font-bold text-4xl drop-shadow-lg">
                      {userData.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                
                {/* Upload Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                      disabled={uploadingProfilePic}
                    />
                    <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all duration-200 transform hover:scale-110">
                      {uploadingProfilePic ? (
                        <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <p className="text-gray-600 mb-4">
                Hover over your profile picture to upload a new one
              </p>
              
              <div className="text-sm text-gray-500">
                <p>• Supported formats: JPG, PNG, GIF</p>
                <p>• Maximum size: 5MB</p>
                <p>• Recommended: Square image (1:1 ratio)</p>
              </div>
            </div>
          </div>

          {/* Account Settings Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">👤 Account Settings</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="Enter new username"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 bg-white/50 backdrop-blur-sm resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  id="isPrivate"
                  type="checkbox"
                  checked={isPrivateAccount}
                  onChange={(e) => setIsPrivateAccount(e.target.checked)}
                  className="w-5 h-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="isPrivate" className="text-sm font-medium text-gray-700">
                  Make my account private
                </label>
              </div>

              <button
                onClick={updateAccountSettings}
                disabled={updatingSettings}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatingSettings ? (
                  <span className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Updating...
                  </span>
                ) : (
                  '💾 Save Changes'
                )}
              </button>
            </div>
          </div>

          {/* Password Change Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50 lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🔐 Change Password</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="Enter current password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="Enter new password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={changePassword}
                disabled={changingPassword}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold py-3 px-8 rounded-xl hover:from-blue-700 hover:to-cyan-700 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changingPassword ? (
                  <span className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Changing Password...
                  </span>
                ) : (
                  '🔒 Change Password'
                )}
              </button>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p>• Password must be at least 6 characters long</p>
              <p>• Use a combination of letters, numbers, and symbols for better security</p>
            </div>
          </div>

          {/* Account Actions Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50 lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">⚠️ Account Actions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-red-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                🚪 Logout
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold py-3 px-6 rounded-xl hover:from-gray-700 hover:to-gray-800 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                🏠 Back to Feed
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

