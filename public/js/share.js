// Get post ID from URL
const urlParams = new URLSearchParams(window.location.search);
const postId = window.location.pathname.split('/').pop();

if (!postId) {
  showError('Invalid share link');
}

// Load shared post
async function loadSharedPost() {
  try {
    const loading = document.getElementById('loading');
    const sharedPost = document.getElementById('sharedPost');
    const error = document.getElementById('error');
    
    loading.style.display = 'block';
    sharedPost.style.display = 'none';
    error.style.display = 'none';
    
    const res = await fetch(`/api/share/${postId}`);
    const post = await res.json();
    
    if (res.ok) {
      renderSharedPost(post);
      loading.style.display = 'none';
      sharedPost.style.display = 'block';
    } else {
      showError(post.message || 'Post not found');
    }
  } catch (error) {
    showError('Network error. Please try again.');
  }
}

function renderSharedPost(post) {
  const sharedPost = document.getElementById('sharedPost');
  
  sharedPost.innerHTML = `
    <div class="feed-item">
      <div class="feed-header">
        <div class="feed-user-info">
          <span class="feed-user">${post.uploaderUsername || post.uploader}</span>
          <span class="feed-time">${formatDate(post.uploadTime)}</span>
        </div>
      </div>
      
      <img src="/uploads/${post.filename}" alt="${post.originalName || 'Photo'}" class="feed-image">
      
      <div class="feed-actions">
        <div class="action-buttons">
          <button class="like-btn" disabled>
            🤍 ${post.likes.length} ${post.likes.length === 1 ? 'like' : 'likes'}
          </button>
          
          <button class="share-btn" onclick="shareThisPost()" title="Share this post">
            <i class="fas fa-share"></i> Share
          </button>
        </div>
        
        <div class="comment-list">
          ${post.comments.map(comment => `
            <div class="comment">
              <span class="comment-user">${comment.username || comment.user}</span>
              <span class="comment-text">${comment.text}</span>
              <span class="comment-time">${formatDate(comment.createdAt)}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="login-prompt">
          <p>Want to like and comment? <a href="login.html">Login to SnapStream</a></p>
        </div>
      </div>
    </div>
  `;
}

function shareThisPost() {
  const currentUrl = window.location.href;
  
  if (navigator.share) {
    navigator.share({
      title: 'Check out this post on SnapStream!',
      text: 'I found this amazing post on SnapStream',
      url: currentUrl
    });
  } else {
    navigator.clipboard.writeText(currentUrl).then(() => {
      alert('Share link copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy link. Please try again.');
    });
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

function showError(message) {
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  
  loading.style.display = 'none';
  error.style.display = 'block';
  error.querySelector('p').textContent = message;
}

// Initialize shared post
loadSharedPost(); 