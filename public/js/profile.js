// Redirect if not logged in
if (!localStorage.getItem('token')) {
  window.location.href = 'login.html';
}

// Get current user data from token
const token = localStorage.getItem('token');
let currentUser = null;

try {
  const payload = JSON.parse(atob(token.split('.')[1]));
  currentUser = payload;
} catch (error) {
  console.error('Error parsing token:', error);
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}

// Profile dropdown functionality
const profileBtn = document.getElementById('profileBtn');
const profileMenu = document.getElementById('profileMenu');

profileBtn.addEventListener('click', () => {
  profileMenu.classList.toggle('show');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
    profileMenu.classList.remove('show');
  }
});

// Mobile menu functionality
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const nav = document.getElementById('nav');

mobileMenuToggle.addEventListener('click', () => {
  nav.classList.toggle('show');
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
  if (!mobileMenuToggle.contains(e.target) && !nav.contains(e.target)) {
    nav.classList.remove('show');
  }
});

// Logout functionality
document.getElementById('logoutBtn').onclick = () => {
  localStorage.clear();
  window.location.href = 'login.html';
};

// Load profile data and header avatar
loadProfileData();
loadHeaderAvatar();

// Load header avatar
async function loadHeaderAvatar() {
  try {
    console.log('Loading header avatar for user:', currentUser.username);
    
    const res = await fetch(`/api/auth/profile/${currentUser.username}`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    
    console.log('Header avatar response status:', res.status);
    
    if (res.ok) {
      const data = await res.json();
      const profileAvatar = document.getElementById('profileAvatar');
      
      if (data.user && data.user.profilePicture) {
        profileAvatar.innerHTML = `<img src="/uploads/${data.user.profilePicture}" alt="Profile Picture">`;
        console.log('Header avatar loaded with image');
      } else {
        profileAvatar.innerHTML = '<i class="fas fa-user"></i>';
        console.log('Header avatar loaded with default icon');
      }
    } else {
      console.error('Header avatar load failed');
    }
  } catch (error) {
    console.error('Error loading header avatar:', error);
  }
}

// Profile picture upload
const uploadProfileBtn = document.getElementById('uploadProfileBtn');
const profilePictureInput = document.getElementById('profilePictureInput');
const profilePicture = document.getElementById('profilePicture');

uploadProfileBtn.addEventListener('click', () => {
  profilePictureInput.click();
});

profilePictureInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file.');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    alert('File size must be less than 5MB.');
    return;
  }
  
  const formData = new FormData();
  formData.append('profilePicture', file);
  
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

// Load user profile data
async function loadProfileData() {
  try {
    console.log('Loading profile for user:', currentUser.username);
    
    const res = await fetch(`/api/auth/profile/${currentUser.username}`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    
    console.log('Profile response status:', res.status);
    
    const data = await res.json();
    console.log('Profile response data:', data);
    
    if (res.ok) {
      const user = data.user;
      
      // Update profile display
      document.getElementById('profileUsername').textContent = user.username;
      document.getElementById('profileBio').textContent = user.bio || 'No bio yet';
      document.getElementById('followersCount').textContent = user.followersCount;
      document.getElementById('followingCount').textContent = user.followingCount;
      
      // Update profile picture
      if (user.profilePicture) {
        profilePicture.innerHTML = `<img src="/uploads/${user.profilePicture}" alt="Profile Picture">`;
      }
      
      console.log('Profile loaded successfully');
    } else {
      console.error('Profile load failed:', data);
      showMessage(data.message || 'Failed to load profile', 'error');
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    showMessage('Network error. Please try again.', 'error');
  }
}



// Load user posts
async function loadUserPosts() {
  try {
    const postsLoading = document.getElementById('postsLoading');
    const userPosts = document.getElementById('userPosts');
    
    postsLoading.style.display = 'block';
    userPosts.style.display = 'none';
    
    const res = await fetch('/api/feed/my-posts', {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    
    const posts = await res.json();
    
    if (res.ok) {
      renderUserPosts(posts);
      document.getElementById('postsCount').textContent = posts.length;
    } else {
      showMessage('Failed to load posts', 'error');
    }
  } catch (error) {
    showMessage('Network error. Please try again.', 'error');
  } finally {
    document.getElementById('postsLoading').style.display = 'none';
    document.getElementById('userPosts').style.display = 'grid';
  }
}

function renderUserPosts(posts) {
  const userPosts = document.getElementById('userPosts');
  
  if (posts.length === 0) {
    userPosts.innerHTML = `
      <div class="empty-posts">
        <h3>No posts yet!</h3>
        <p>Start sharing your moments with the community.</p>
        <a href="upload.html" class="btn btn-primary">Upload Photo</a>
      </div>
    `;
    return;
  }
  
  userPosts.innerHTML = posts.map(post => `
    <div class="post-card">
      <div class="post-image">
        <img src="/uploads/${post.filename}" alt="${post.originalName || 'Photo'}">
        ${post.isPrivate ? '<div class="private-badge"><i class="fas fa-lock"></i></div>' : ''}
        <div class="post-actions">
          <button class="delete-post-btn" onclick="deletePost('${post._id}')" title="Delete post">
            <i class="fas fa-trash"></i>
          </button>
          <button class="share-post-btn" onclick="sharePost('${post._id}', '${post.filename}')" title="Share post">
            <i class="fas fa-share"></i>
          </button>
        </div>
      </div>
      <div class="post-info">
        <div class="post-stats">
          <span><i class="fas fa-heart"></i> ${post.likes.length}</span>
          <span><i class="fas fa-comment"></i> ${post.comments.length}</span>
        </div>
        <div class="post-time">${formatDate(post.uploadTime)}</div>
      </div>
    </div>
  `).join('');
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
}

// Delete post function
window.deletePost = async function(id) {
  if (!confirm('Are you sure you want to delete this post?')) {
    return;
  }
  
  try {
    const res = await fetch(`/api/feed/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    
    if (res.ok) {
      loadUserPosts(); // Refresh posts
      showMessage('Post deleted successfully!', 'success');
    } else {
      const data = await res.json();
      showMessage(data.message || 'Failed to delete post', 'error');
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    showMessage('Network error. Please try again.', 'error');
  }
};

// Share post function
window.sharePost = async function(id, filename) {
  try {
    // Create shareable URL
    const shareUrl = `${window.location.origin}/share/${id}`;
    
    // Try to use Web Share API if available
    if (navigator.share) {
      await navigator.share({
        title: 'Check out this post on SnapStream!',
        text: 'I found this amazing post on SnapStream',
        url: shareUrl
      });
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      showMessage('Share link copied to clipboard!', 'success');
    }
  } catch (error) {
    console.error('Error sharing post:', error);
    // Fallback: copy to clipboard
    try {
      const shareUrl = `${window.location.origin}/share/${id}`;
      await navigator.clipboard.writeText(shareUrl);
      showMessage('Share link copied to clipboard!', 'success');
    } catch (clipboardError) {
      showMessage('Failed to share post. Please try again.', 'error');
    }
  }
};

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

// Initialize profile
loadProfileData();
loadUserPosts(); 