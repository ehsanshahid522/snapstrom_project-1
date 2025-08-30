// Redirect if not logged in
if (!localStorage.getItem('token')) {
  window.location.href = 'login.html';
}

// Set username from storage
const username = localStorage.getItem('username') || 'User';
const profileNameEl = document.getElementById('profileName');
if (profileNameEl) {
  profileNameEl.textContent = username;
}

// Profile dropdown functionality
const profileBtn = document.getElementById('profileBtn');
const profileMenu = document.getElementById('profileMenu');
if (profileBtn && profileMenu) {
  profileBtn.addEventListener('click', () => {
    profileMenu.classList.toggle('show');
  });
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
      profileMenu.classList.remove('show');
    }
  });
}

// Mobile menu functionality
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const nav = document.getElementById('nav');
if (mobileMenuToggle && nav) {
  mobileMenuToggle.addEventListener('click', () => {
    nav.classList.toggle('show');
  });
  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!mobileMenuToggle.contains(e.target) && !nav.contains(e.target)) {
      nav.classList.remove('show');
    }
  });
}

// Logout functionality
document.getElementById('logoutBtn').onclick = () => {
  localStorage.clear();
  window.location.href = 'login.html';
};

// Profile picture upload
const uploadProfileBtn = document.getElementById('uploadProfileBtn');
const profilePictureInput = document.getElementById('profilePictureInput');
const profilePicture = document.getElementById('profilePicture');

if (uploadProfileBtn && profilePictureInput) {
  uploadProfileBtn.addEventListener('click', () => {
    profilePictureInput.click();
  });
}

// Utility: compress image client-side to reduce upload size
async function compressImage(file, { maxWidth = 640, maxHeight = 640, quality = 0.8 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
      const targetWidth = Math.round(width * ratio);
      const targetHeight = Math.round(height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Compression failed'));
          const compressedFile = new File([blob], file.name.replace(/\.(\w+)$/, '.jpg'), { type: 'image/jpeg' });
          resolve(compressedFile.size < file.size ? compressedFile : file);
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

if (profilePictureInput) profilePictureInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  if (!file.type.startsWith('image/')) {
    showMessage('Please select an image file.', 'error');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    showMessage('File size must be less than 5MB.', 'error');
    return;
  }
  
  // Compress image before upload
  let uploadFile = file;
  try {
    uploadFile = await compressImage(file, { maxWidth: 640, maxHeight: 640, quality: 0.8 });
  } catch (_) {}

  const formData = new FormData();
  formData.append('profilePicture', uploadFile);
  
  try {
    uploadProfileBtn.disabled = true;
    uploadProfileBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    
    const res = await fetch('/api/auth/profile-picture', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
      body: formData
    });
    
    const data = await res.json();
    
    if (res.ok) {
      // Update profile picture display
      profilePicture.innerHTML = `<img src="/uploads/${data.profilePicture}" alt="Profile Picture">`;
      // Also update header avatar
      const headerAvatar = document.getElementById('profileAvatar');
      if (headerAvatar) {
        headerAvatar.innerHTML = `<img src="/uploads/${data.profilePicture}" alt="Profile Picture">`;
      }
      showMessage('Profile picture updated successfully!', 'success');
    } else {
      showMessage(data.message || 'Failed to upload profile picture', 'error');
    }
  } catch (error) {
    showMessage('Network error. Please try again.', 'error');
  } finally {
    uploadProfileBtn.disabled = false;
    uploadProfileBtn.innerHTML = '<i class="fas fa-camera"></i> Change Photo';
  }
});

// Load user settings
async function loadUserSettings() {
  try {
    // Prefer username-based profile endpoint to avoid 404 on /me in some setups
    const token = localStorage.getItem('token');
    const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
    const primaryUrl = payload?.username ? `/api/auth/profile/${payload.username}` : `/api/profile/me`;
    const res = await fetch(primaryUrl, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    const data = await res.json();
    
    if (res.ok) {
      const user = data.user;
      
      // Update form fields
      document.getElementById('usernameInput').value = user.username;
      document.getElementById('emailInput').value = user.email || '';
      document.getElementById('bioInput').value = user.bio || '';
      document.getElementById('privateAccount').checked = user.isPrivateAccount;
      
      // Update profile picture and header avatar
      if (user.profilePicture) {
        profilePicture.innerHTML = `<img src="/uploads/${user.profilePicture}" alt="Profile Picture">`;
        const headerAvatar = document.getElementById('profileAvatar');
        if (headerAvatar) {
          headerAvatar.innerHTML = `<img src="/uploads/${user.profilePicture}" alt="Profile Picture">`;
        }
      }
      
      // Load saved settings from localStorage
      loadSavedSettings();
      
    } else {
      if (res.status === 401) {
        localStorage.clear();
        window.location.href = 'login.html';
        return;
      }
      // Fallback on any non-OK response: try the other endpoint
      try {
        const token = localStorage.getItem('token');
        const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
        const fallbackUrl = primaryUrl.includes('/api/auth/profile/') ? '/api/profile/me' : (payload?.username ? `/api/auth/profile/${payload.username}` : null);
        if (fallbackUrl) {
          const res2 = await fetch(fallbackUrl, {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          if (res2.ok) {
            const data2 = await res2.json();
            const user = data2.user;
            document.getElementById('usernameInput').value = user.username;
            document.getElementById('emailInput').value = user.email || '';
            document.getElementById('bioInput').value = user.bio || '';
            document.getElementById('privateAccount').checked = user.isPrivateAccount;
            if (user.profilePicture) {
              profilePicture.innerHTML = `<img src="/uploads/${user.profilePicture}" alt="Profile Picture">`;
              const headerAvatar = document.getElementById('profileAvatar');
              if (headerAvatar) headerAvatar.innerHTML = `<img src="/uploads/${user.profilePicture}" alt="Profile Picture">`;
            }
            loadSavedSettings();
            return;
          }
        }
      } catch (_) {}
      showMessage(data.message || 'Failed to load settings', 'error');
    }
  } catch (error) {
    // Fallback: try public profile if token user is known
    try {
      const token = localStorage.getItem('token');
      const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
      if (payload && payload.username) {
        const res2 = await fetch(`/api/auth/profile/${payload.username}`, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res2.ok) {
          const data2 = await res2.json();
          const user = data2.user;
          document.getElementById('usernameInput').value = user.username;
          document.getElementById('emailInput').value = user.email || '';
          document.getElementById('bioInput').value = user.bio || '';
          document.getElementById('privateAccount').checked = user.isPrivateAccount;
          if (user.profilePicture) {
            profilePicture.innerHTML = `<img src="/uploads/${user.profilePicture}" alt="Profile Picture">`;
            const headerAvatar = document.getElementById('profileAvatar');
            if (headerAvatar) headerAvatar.innerHTML = `<img src="/uploads/${user.profilePicture}" alt="Profile Picture">`;
          }
          loadSavedSettings();
          return;
        }
      }
    } catch (_) {}
    showMessage('Network error. Please try again.', 'error');
  }
}

// Load saved settings from localStorage
function loadSavedSettings() {
  const savedSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
  
  document.getElementById('defaultPostPrivacy').value = savedSettings.defaultPostPrivacy || 'public';
  document.getElementById('likeNotifications').checked = savedSettings.likeNotifications !== false;
  document.getElementById('commentNotifications').checked = savedSettings.commentNotifications !== false;
  document.getElementById('followNotifications').checked = savedSettings.followNotifications !== false;
}

// Save settings
const saveSettingsBtn = document.getElementById('saveSettingsBtn');

saveSettingsBtn.addEventListener('click', async () => {
  try {
    saveSettingsBtn.disabled = true;
    saveSettingsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    // Save account settings to server
    const accountRes = await fetch('/api/auth/account-settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({
        isPrivateAccount: document.getElementById('privateAccount').checked,
        bio: document.getElementById('bioInput').value.trim()
      })
    });
    
    if (accountRes.status === 401) {
      localStorage.clear();
      window.location.href = 'login.html';
      return;
    }

    let accountData;
    try {
      accountData = await accountRes.json();
    } catch (_) {
      accountData = null;
    }

    if (accountRes.ok) {
      // Save local settings to localStorage
      const localSettings = {
        defaultPostPrivacy: document.getElementById('defaultPostPrivacy').value,
        likeNotifications: document.getElementById('likeNotifications').checked,
        commentNotifications: document.getElementById('commentNotifications').checked,
        followNotifications: document.getElementById('followNotifications').checked
      };
      
      localStorage.setItem('userSettings', JSON.stringify(localSettings));
      
      showMessage('Settings saved successfully!', 'success');

      // Refresh UI values from server to reflect persisted state
      await loadUserSettings();
    } else {
      const message = (accountData && accountData.message) || `Failed to save settings (HTTP ${accountRes.status})`;
      showMessage(message, 'error');
    }
  } catch (error) {
    showMessage('Network error. Please try again.', 'error');
  } finally {
    saveSettingsBtn.disabled = false;
    saveSettingsBtn.innerHTML = '<i class="fas fa-save"></i> Save Settings';
  }
});

// Change password functionality (inline)
const changePasswordBtn = document.getElementById('changePasswordBtn');
const passwordMessage = document.getElementById('passwordMessage');

if (changePasswordBtn) changePasswordBtn.addEventListener('click', async () => {
  const currentPasswordEl = document.getElementById('currentPassword');
  const newPasswordEl = document.getElementById('newPassword');
  const confirmPasswordEl = document.getElementById('confirmPassword');
  
  if (!currentPasswordEl || !newPasswordEl || !confirmPasswordEl) return;
  
  const currentPassword = currentPasswordEl.value;
  const newPassword = newPasswordEl.value;
  const confirmPassword = confirmPasswordEl.value;
  
  const setInlineMessage = (text, type) => {
    if (passwordMessage) {
      passwordMessage.className = `inline-message ${type}`;
      passwordMessage.textContent = text;
    } else {
      showMessage(text, type);
    }
  };
  
  if (!currentPassword || currentPassword.length < 1) {
    setInlineMessage('Enter your current password.', 'error');
    return;
  }
  if (!newPassword || newPassword.length < 6) {
    setInlineMessage('Password must be at least 6 characters.', 'error');
    return;
  }
  if (newPassword !== confirmPassword) {
    setInlineMessage('Passwords do not match!', 'error');
    return;
  }
  
  try {
    changePasswordBtn.disabled = true;
    changePasswordBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    let data;
    try {
      const text = await res.text();
      data = text ? JSON.parse(text) : {};
    } catch (_) {
      data = {};
    }
    if (res.ok) {
      setInlineMessage('Password changed successfully!', 'success');
      currentPasswordEl.value = '';
      newPasswordEl.value = '';
      confirmPasswordEl.value = '';
    } else {
      const msg = data.message || `Failed to change password (HTTP ${res.status})`;
      setInlineMessage(msg, 'error');
    }
  } catch (err) {
    setInlineMessage('Network error. Please try again.', 'error');
  } finally {
    changePasswordBtn.disabled = false;
    changePasswordBtn.innerHTML = '<i class="fas fa-key"></i> Update Password';
  }
});

function showMessage(text, type) {
  // Create a temporary message element
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = text;
  
  // Add to page
  document.body.appendChild(messageDiv);
  
  // Remove after 3 seconds
  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
}

// Initialize settings
loadUserSettings(); 

// Search functionality (debounced)
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
let searchTimeout;
let searchAbortController;

if (searchInput && searchResults) {
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearTimeout(searchTimeout);

    if (query.length < 2) {
      searchResults.classList.remove('show');
      return;
    }

    searchTimeout = setTimeout(async () => {
      try {
        if (searchAbortController) {
          searchAbortController.abort();
        }
        searchAbortController = new AbortController();
        const res = await fetch(`/api/auth/search?q=${encodeURIComponent(query)}`, {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
          signal: searchAbortController.signal
        });
        const data = await res.json();
        if (res.ok) {
          renderSearchResults(data.users || []);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Search error:', error);
        }
      }
    }, 300);
  });

  function renderSearchResults(users) {
    if (users.length === 0) {
      searchResults.innerHTML = '<div class="search-result-item">No users found</div>';
    } else {
      searchResults.innerHTML = users.map(user => `
        <div class="search-result-item" onclick="window.location.href='user-profile.html?username=${encodeURIComponent(user.username)}'">
          <div class="search-result-avatar">
            ${user.profilePicture ? `<img src="/uploads/${user.profilePicture}" alt="${user.username}">` : '<i class="fas fa-user"></i>'}
          </div>
          <div class="search-result-info">
            <div class="search-result-username">${user.username}</div>
            <div class="search-result-status">
              ${user.isPrivateAccount ? '<i class="fas fa-lock"></i> Private' : '<i class="fas fa-globe"></i> Public'}
            </div>
          </div>
        </div>
      `).join('');
    }
    searchResults.classList.add('show');
  }

  // Close search results when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.classList.remove('show');
    }
  });
}