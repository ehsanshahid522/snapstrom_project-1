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

// Load header avatar
loadHeaderAvatar();

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

// Get username from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const targetUsername = urlParams.get('username');

if (!targetUsername) {
  window.location.href = 'index.html';
}

// Load user profile data
async function loadUserProfile() {
  try {
    console.log('Loading profile for user:', targetUsername);
    
    const res = await fetch(`/api/auth/profile/${targetUsername}`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    
    console.log('Profile response status:', res.status);
    
    const data = await res.json();
    console.log('Profile response data:', data);
    
    if (res.ok) {
      const user = data.user;
      
      // Update profile display
      document.getElementById('userProfileUsername').textContent = user.username;
      document.getElementById('userProfileBio').textContent = user.bio || 'No bio yet';
      document.getElementById('userFollowersCount').textContent = user.followersCount;
      document.getElementById('userFollowingCount').textContent = user.followingCount;
      
      // Update profile picture
      const userProfilePicture = document.getElementById('userProfilePicture');
      if (user.profilePicture) {
        userProfilePicture.innerHTML = `<img src="/uploads/${user.profilePicture}" alt="Profile Picture">`;
      }
      
      // Setup follow button
      setupFollowButton(user);
      
      // Load user posts
      loadUserPosts();
      
    } else {
      console.error('Profile load failed:', data);
      showMessage(data.message || 'Failed to load profile', 'error');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
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
    
    const res = await fetch(`/api/feed/user/${targetUsername}`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    
    const posts = await res.json();
    
    if (res.ok) {
      renderUserPosts(posts);
      document.getElementById('userPostsCount').textContent = posts.length;
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
        <p>This user hasn't shared any photos yet.</p>
      </div>
    `;
    return;
  }
  
  userPosts.innerHTML = posts.map(post => `
    <div class="post-card">
      <div class="post-image">
        <img src="/uploads/${post.filename}" alt="${post.originalName || 'Photo'}">
        ${post.isPrivate ? '<div class="private-badge"><i class="fas fa-lock"></i></div>' : ''}
      </div>
      ${post.caption ? `
        <div class="post-caption">
          <p>${post.caption}</p>
        </div>
      ` : ''}
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

// Load header avatar
async function loadHeaderAvatar() {
  try {
    const res = await fetch(`/api/auth/profile/${currentUser.username}`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    
    if (res.ok) {
      const data = await res.json();
      const profileAvatar = document.getElementById('profileAvatar');
      
      if (data.user && data.user.profilePicture) {
        profileAvatar.innerHTML = `<img src="/uploads/${data.user.profilePicture}" alt="Profile Picture">`;
      } else {
        profileAvatar.innerHTML = '<i class="fas fa-user"></i>';
      }
    }
  } catch (error) {
    console.error('Error loading header avatar:', error);
  }
}

// Setup follow button
function setupFollowButton(user) {
  const followBtn = document.getElementById('followBtn');
  
  console.log('Setting up follow button for user:', user);
  console.log('Current user ID:', currentUser.id);
  console.log('User followers:', user.followers);
  
  // Don't show follow button if it's the current user's profile
  if (user._id === currentUser.id) {
    console.log('This is the current user\'s profile, hiding follow button');
    followBtn.style.display = 'none';
    return;
  }
  
  // Check if current user is already following this user
  // Convert ObjectIds to strings for comparison
  const isFollowing = user.followers.some(followerId => 
    followerId.toString() === currentUser.id
  );
  
  console.log('Is following:', isFollowing);
  
  if (isFollowing) {
    followBtn.innerHTML = '<i class="fas fa-user-check"></i> Following';
    followBtn.classList.add('following');
  } else {
    followBtn.innerHTML = '<i class="fas fa-user-plus"></i> Follow';
    followBtn.classList.remove('following');
  }
  
  // Add click event
  followBtn.onclick = () => toggleFollow(user._id);
}

// Toggle follow function
async function toggleFollow(targetUserId) {
  try {
    console.log('Toggling follow for user ID:', targetUserId);
    
    const res = await fetch(`/api/auth/follow/${targetUserId}`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    
    console.log('Follow response status:', res.status);
    
    if (res.ok) {
      const data = await res.json();
      console.log('Follow response data:', data);
      
      const followBtn = document.getElementById('followBtn');
      const followersCount = document.getElementById('userFollowersCount');
      
      if (data.isFollowing) {
        followBtn.innerHTML = '<i class="fas fa-user-check"></i> Following';
        followBtn.classList.add('following');
        followersCount.textContent = parseInt(followersCount.textContent) + 1;
      } else {
        followBtn.innerHTML = '<i class="fas fa-user-plus"></i> Follow';
        followBtn.classList.remove('following');
        followersCount.textContent = parseInt(followersCount.textContent) - 1;
      }
      
      showMessage(data.message, 'success');
    } else {
      const errorData = await res.json();
      console.error('Follow request failed:', errorData);
      showMessage(errorData.message || 'Failed to follow user', 'error');
    }
  } catch (error) {
    console.error('Error toggling follow:', error);
    showMessage('Network error. Please try again.', 'error');
  }
}

// Initialize user profile
loadUserProfile(); 