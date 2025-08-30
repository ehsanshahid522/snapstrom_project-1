// Redirect if not logged in
if (!localStorage.getItem('token')) {
  window.location.href = 'login.html';
}

// Set username
const username = localStorage.getItem('username') || 'User';
document.getElementById('username').textContent = username;

// Load user profile picture
loadUserProfile();

// Load user profile picture
async function loadUserProfile() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    const res = await fetch(`/api/auth/profile/${payload.username}`, {
      headers: { 'Authorization': 'Bearer ' + token }
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
    console.error('Error loading profile:', error);
  }
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

// Logout functionality
document.getElementById('logoutBtn').onclick = () => {
  localStorage.clear();
  window.location.href = 'login.html';
};

const feedDiv = document.getElementById('feed');
const loadingDiv = document.getElementById('loading');

async function fetchFeed() {
  try {
    loadingDiv.style.display = 'block';
    feedDiv.style.display = 'none';
    
    const res = await fetch('/api/feed', {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch feed');
    }
    
    const posts = await res.json();
    renderFeed(posts);
  } catch (error) {
    console.error('Error fetching feed:', error);
    feedDiv.innerHTML = '<div class="error">Failed to load feed. Please try again.</div>';
  } finally {
    loadingDiv.style.display = 'none';
    feedDiv.style.display = 'flex';
  }
}

function renderFeed(posts) {
  console.log('Rendering feed with posts:', posts.length);
  
  if (posts.length === 0) {
    feedDiv.innerHTML = `
      <div class="empty-feed">
        <h3>No photos yet!</h3>
        <p>Be the first to share a photo with the community.</p>
        <a href="upload.html" class="btn btn-primary">Upload Photo</a>
      </div>
    `;
    return;
  }
  
  feedDiv.innerHTML = '';
  
  posts.forEach((post, index) => {
    console.log(`Rendering post ${index}:`, { 
      _id: post._id, 
      uploader: post.uploader, 
      uploaderUsername: post.uploader?.username,
      currentUserId: getCurrentUserId()
    });
    
    const postDiv = document.createElement('div');
    postDiv.className = 'feed-item';
    
    const currentUserId = getCurrentUserId();
    const isLiked = Array.isArray(post.likes)
      ? post.likes.some(like => (typeof like === 'string' ? like : like._id)?.toString() === currentUserId)
      : false;
    
    postDiv.innerHTML = `
      <div class="feed-header">
        <div class="feed-user-info">
          <span class="feed-user">${post.uploader.username || post.uploader}</span>
          <span class="feed-time">${formatDate(post.uploadTime)}</span>
        </div>
        <div class="feed-actions-top">
          ${post.uploader._id !== getCurrentUserId() ? `
            <button class="follow-btn" onclick="toggleFollowPostDirect('${post.uploader._id}', '${post.uploader.username}')" data-username="${post.uploader.username}" data-user-id="${post.uploader._id}">
              <i class="fas fa-user-plus"></i>
              <span>Follow</span>
            </button>
          ` : ''}
          ${post.uploader._id === getCurrentUserId() ? `
            <button class="delete-btn" onclick="deletePost('${post._id}')" title="Delete post">
              <i class="fas fa-trash"></i>
            </button>
          ` : ''}
        </div>
        ${post.uploader._id !== getCurrentUserId() ? `
          <script>
            console.log('Follow button rendered for post ${index}:', {
              uploaderId: '${post.uploader._id}',
              uploaderUsername: '${post.uploader.username}',
              currentUserId: '${getCurrentUserId()}'
            });
          </script>
        ` : ''}
      </div>
      
      <img src="/uploads/${post.filename}" alt="${post.originalName || 'Photo'}" class="feed-image">
      
      ${post.caption ? `
        <div class="feed-caption">
          <p>${post.caption}</p>
        </div>
      ` : ''}
      
      <div class="feed-actions">
        <div class="action-buttons">
          <button class="like-btn ${isLiked ? 'liked' : ''}" onclick="likePost('${post._id}')" data-post-id="${post._id}">
            ${isLiked ? '❤️' : '🤍'} ${post.likes.length} ${post.likes.length === 1 ? 'like' : 'likes'}
          </button>
          
          <div class="action-spacer"></div>
          
          <button class="share-btn" onclick="sharePost('${post._id}', '${post.filename}')" title="Share post">
            <i class="fas fa-share"></i> Share
          </button>
        </div>
        
        <form class="comment-form" onsubmit="return commentPost(event, '${post._id}')">
          <input type="text" class="comment-input" placeholder="Add a comment..." name="comment" required>
          <button type="submit" class="comment-btn">Post</button>
        </form>
        
        <div class="comment-list">
          ${post.comments.map(comment => `
            <div class="comment">
              <span class="comment-user">${comment.username || (comment.user && comment.user.username) || 'User'}</span>
              <span class="comment-text">${comment.text}</span>
              <span class="comment-time">${formatDate(comment.createdAt)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    feedDiv.appendChild(postDiv);
  });
}

window.likePost = async function(id) {
  try {
    const res = await fetch(`/api/interactions/like/${id}`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    
    if (res.ok) {
      // Update only the like button without refreshing the entire feed
      const likeBtn = document.querySelector(`[data-post-id="${id}"]`);
      if (likeBtn) {
        const likeCount = likeBtn.textContent.match(/\d+/);
        const currentLikes = parseInt(likeCount ? likeCount[0] : 0);
        
        if (likeBtn.classList.contains('liked')) {
          likeBtn.classList.remove('liked');
          likeBtn.innerHTML = `🤍 ${currentLikes - 1} ${currentLikes - 1 === 1 ? 'like' : 'likes'}`;
        } else {
          likeBtn.classList.add('liked');
          likeBtn.innerHTML = `❤️ ${currentLikes + 1} ${currentLikes + 1 === 1 ? 'like' : 'likes'}`;
        }
      }
    }
  } catch (error) {
    console.error('Error liking post:', error);
  }
};

window.commentPost = async function(e, id) {
  e.preventDefault();
  
  const form = e.target;
  const text = form.comment.value.trim();
  
  if (!text) return false;
  
  try {
    const res = await fetch(`/api/interactions/comment/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({ text })
    });
    
    if (res.ok) {
      const data = await res.json();
      form.reset();
      
      // Add the new comment to the comment list without refreshing the entire feed
      const commentList = form.parentElement.querySelector('.comment-list');
      if (commentList) {
        const newComment = document.createElement('div');
        newComment.className = 'comment';
        newComment.innerHTML = `
          <span class="comment-user">${getCurrentUsername()}:</span>
          <span class="comment-text">${text}</span>
          <span class="comment-time">Just now</span>
        `;
        commentList.appendChild(newComment);
      }
    }
  } catch (error) {
    console.error('Error posting comment:', error);
  }
  
  return false;
};

function getCurrentUserId() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id;
  } catch (error) {
    return null;
  }
}

function getCurrentUsername() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.username;
  } catch (error) {
    return null;
  }
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
      fetchFeed(); // Refresh feed to show updated posts
    } else {
      const data = await res.json();
      alert(data.message || 'Failed to delete post');
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    alert('Network error. Please try again.');
  }
};

// Toggle follow function for feed posts (direct user ID)
window.toggleFollowPostDirect = async function(userId, username) {
  try {
    console.log('Trying to follow/unfollow from feed (direct):', { userId, username });
    
    const token = localStorage.getItem('token');
    console.log('Token available:', !!token);
    
    if (!token) {
      console.error('No token available');
      return;
    }
    
    // Follow/unfollow using the user ID directly
    const res = await fetch(`/api/auth/follow/${userId}`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    console.log('Follow response status:', res.status);
    console.log('Follow response headers:', res.headers);
    
    if (res.ok) {
      const data = await res.json();
      console.log('Follow response data:', data);
      
      // Update all follow buttons for this user in the feed
      const followBtns = document.querySelectorAll(`[data-username="${username}"]`);
      console.log('Found follow buttons:', followBtns.length);
      
      followBtns.forEach(followBtn => {
        if (data.isFollowing) {
          followBtn.classList.add('following');
          followBtn.innerHTML = '<i class="fas fa-user-check"></i><span>Following</span>';
        } else {
          followBtn.classList.remove('following');
          followBtn.innerHTML = '<i class="fas fa-user-plus"></i><span>Follow</span>';
        }
      });
      
      console.log('Updated follow buttons:', followBtns.length);
    } else {
      const errorData = await res.json();
      console.error('Follow request failed:', errorData);
    }
  } catch (error) {
    console.error('Error toggling follow from feed (direct):', error);
  }
};

// Toggle follow function for feed posts (username lookup)
window.toggleFollowPost = async function(username) {
  try {
    console.log('Trying to follow/unfollow from feed:', username);
    
    // Get the current user's ID from the token
    const token = localStorage.getItem('token');
    const currentUserPayload = JSON.parse(atob(token.split('.')[1]));
    const currentUserId = currentUserPayload.id;
    
    // Get the target user's profile to get their ID
    const userRes = await fetch(`/api/auth/profile/${username}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    if (!userRes.ok) {
      console.error('Error finding user:', userRes.status);
      return;
    }
    
    const userData = await userRes.json();
    console.log('User profile data:', userData);
    
    if (!userData.user || !userData.user._id) {
      console.error('User not found or no ID');
      return;
    }
    
    const targetUserId = userData.user._id;
    console.log('Target user ID:', targetUserId);
    
    // Now follow/unfollow using the user ID
    const res = await fetch(`/api/auth/follow/${targetUserId}`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    console.log('Follow response status:', res.status);
    
    if (res.ok) {
      const data = await res.json();
      console.log('Follow response data:', data);
      
      // Update all follow buttons for this user in the feed
      const followBtns = document.querySelectorAll(`[data-username="${username}"]`);
      followBtns.forEach(followBtn => {
        if (data.isFollowing) {
          followBtn.classList.add('following');
          followBtn.innerHTML = '<i class="fas fa-user-check"></i><span>Following</span>';
        } else {
          followBtn.classList.remove('following');
          followBtn.innerHTML = '<i class="fas fa-user-plus"></i><span>Follow</span>';
        }
      });
      
      console.log('Updated follow buttons:', followBtns.length);
    } else {
      const errorData = await res.json();
      console.error('Follow request failed:', errorData);
    }
  } catch (error) {
    console.error('Error toggling follow from feed:', error);
  }
};

// Toggle follow function for user profiles
window.toggleFollow = async function(username) {
  try {
    console.log('Trying to follow/unfollow:', username);
    
    // Get the current user's ID from the token
    const token = localStorage.getItem('token');
    const currentUserPayload = JSON.parse(atob(token.split('.')[1]));
    const currentUserId = currentUserPayload.id;
    
    // Get the target user's profile to get their ID
    const userRes = await fetch(`/api/auth/profile/${username}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    if (!userRes.ok) {
      console.error('Error finding user:', userRes.status);
      return;
    }
    
    const userData = await userRes.json();
    console.log('User profile data:', userData);
    
    if (!userData.user || !userData.user._id) {
      console.error('User not found or no ID');
      return;
    }
    
    const targetUserId = userData.user._id;
    console.log('Target user ID:', targetUserId);
    
    // Now follow/unfollow using the user ID
    const res = await fetch(`/api/auth/follow/${targetUserId}`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    console.log('Follow response status:', res.status);
    
    if (res.ok) {
      const data = await res.json();
      console.log('Follow response data:', data);
      
      const followBtn = document.querySelector(`[data-username="${username}"]`);
      if (followBtn) {
        if (data.isFollowing) {
          followBtn.classList.add('following');
          followBtn.innerHTML = '<i class="fas fa-user-check"></i><span>Following</span>';
        } else {
          followBtn.classList.remove('following');
          followBtn.innerHTML = '<i class="fas fa-user-plus"></i><span>Follow</span>';
        }
      } else {
        console.error('Follow button not found');
      }
    } else {
      const errorData = await res.json();
      console.error('Follow request failed:', errorData);
    }
  } catch (error) {
    console.error('Error toggling follow:', error);
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
      alert('Share link copied to clipboard!');
    }
  } catch (error) {
    console.error('Error sharing post:', error);
    // Fallback: copy to clipboard
    try {
      const shareUrl = `${window.location.origin}/share/${id}`;
      await navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    } catch (clipboardError) {
      alert('Failed to share post. Please try again.');
    }
  }
};

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

// Search functionality
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
let searchTimeout;

searchInput.addEventListener('input', (e) => {
  const query = e.target.value.trim();
  
  clearTimeout(searchTimeout);
  
  if (query.length < 2) {
    searchResults.classList.remove('show');
    return;
  }
  
  searchTimeout = setTimeout(async () => {
    try {
      const res = await fetch(`/api/auth/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        renderSearchResults(data.users);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  }, 300);
});

function renderSearchResults(users) {
  if (users.length === 0) {
    searchResults.innerHTML = '<div class="search-result-item">No users found</div>';
  } else {
    searchResults.innerHTML = users.map(user => `
      <div class="search-result-item" onclick="viewUserProfile('${user.username}')">
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

// View user profile
window.viewUserProfile = (username) => {
  window.location.href = `user-profile.html?username=${encodeURIComponent(username)}`;
  searchResults.classList.remove('show');
  searchInput.value = '';
};

// Toggle comments function
window.toggleComments = function(postId) {
  const expandedComments = document.getElementById(`comments-${postId}`);
  const toggleElement = expandedComments.previousElementSibling;
  const toggleText = toggleElement.querySelector('.toggle-text');
  const toggleIcon = toggleElement.querySelector('i');
  
  if (expandedComments.style.display === 'none') {
    expandedComments.style.display = 'block';
    toggleText.textContent = 'Hide comments';
    toggleIcon.className = 'fas fa-chevron-up';
  } else {
    expandedComments.style.display = 'none';
    toggleText.textContent = `View all ${expandedComments.children.length + 2} comments`;
    toggleIcon.className = 'fas fa-chevron-down';
  }
};

// Initialize feed
fetchFeed();