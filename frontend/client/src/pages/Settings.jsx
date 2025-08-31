import { useEffect, useState, useRef } from 'react'
import { api } from '../lib/api.js'

export default function Settings() {
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)
  const [bio, setBio] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profilePicture, setProfilePicture] = useState(null)
  const [preview, setPreview] = useState(null)
  const fileRef = useRef()

  useEffect(() => {
    (async () => {
      try {
        const data = await api('/profile/me')
        setIsPrivate(data.isPrivateAccount || false)
        setBio(data.bio || '')
        setProfilePicture(data.profilePicture)
      } catch (e) {
        setMsg('Failed to load profile settings')
      }
    })()
  }, [])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const updateAccountSettings = async () => {
    setLoading(true)
    setMsg('')
    try {
              await api('/auth/account-settings', { 
        method: 'PUT', 
        body: { isPrivateAccount: isPrivate, bio } 
      })
      setMsg('Account settings updated successfully!')
    } catch (e) {
      setMsg(e.message)
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMsg('New passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setMsg('New password must be at least 6 characters long')
      return
    }

    setLoading(true)
    setMsg('')
    try {
              await api('/auth/change-password', { 
        method: 'POST', 
        body: { currentPassword, newPassword } 
      })
      setMsg('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e) {
      setMsg(e.message)
    } finally {
      setLoading(false)
    }
  }

  const updateProfilePicture = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) {
      setMsg('Please select a file')
      return
    }
    if (!file.type.startsWith('image/')) {
      setMsg('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setMsg('File size must be less than 5MB')
      return
    }

    setLoading(true)
    setMsg('')
    const form = new FormData()
    form.append('profilePicture', file)
    
    try {
              const data = await api('/auth/profile-picture', { 
        method: 'POST', 
        body: form 
      })
      setProfilePicture(data.profilePicture)
      setPreview(null)
      if (fileRef.current) fileRef.current.value = ''
      setMsg('Profile picture updated successfully!')
    } catch (e) {
      setMsg(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">Manage your Snapstream account preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Picture Section */}
          <div className="card animate-fade-in">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Profile Picture</h2>
            </div>
            <div className="card-body">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  ) : profilePicture ? (
                    <img src={`/uploads/${profilePicture}`} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-bold text-2xl">
                        {localStorage.getItem('username')?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="profile-picture"
                />
                <label htmlFor="profile-picture" className="btn-secondary cursor-pointer">
                  Choose New Picture
                </label>
                {preview && (
                  <button
                    onClick={updateProfilePicture}
                    disabled={loading}
                    className="btn-primary mt-3 w-full"
                  >
                    {loading ? 'Updating...' : 'Update Profile Picture'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Account Settings Section */}
          <div className="card animate-fade-in">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Account Settings</h2>
            </div>
            <div className="card-body space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="isPrivate"
                  type="checkbox"
                  checked={isPrivate}
                  onChange={e => setIsPrivate(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-700">
                  Make my account private
                </label>
              </div>

              <button
                onClick={updateAccountSettings}
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Updating...' : 'Update Settings'}
              </button>
            </div>
          </div>

          {/* Password Change Section */}
          <div className="card animate-fade-in lg:col-span-2">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="input-field"
                  />
                </div>
              </div>
              <button
                onClick={changePassword}
                disabled={loading}
                className="btn-primary mt-4 w-full md:w-auto"
              >
                {loading ? 'Changing Password...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {msg && (
          <div className={`mt-6 px-4 py-3 rounded-lg text-sm ${
            msg.includes('successfully') 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {msg}
          </div>
        )}

        {/* Back to Feed */}
        <div className="text-center mt-8">
          <a href="/" className="btn-secondary">
            ← Back to Feed
          </a>
        </div>
      </div>
    </div>
  )
}

