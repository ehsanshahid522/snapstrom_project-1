document.addEventListener('DOMContentLoaded', function() {
// Redirect if not logged in
if (!localStorage.getItem('token')) {
  window.location.href = 'login.html';
}

// Debug authentication
console.log('Token available:', !!localStorage.getItem('token'));
if (localStorage.getItem('token')) {
  try {
    const payload = JSON.parse(atob(localStorage.getItem('token').split('.')[1]));
    console.log('Current user:', payload);
  } catch (error) {
    console.error('Error parsing token:', error);
  }
}

// Set profile name
const username = localStorage.getItem('username') || 'User';
const profileNameElem = document.getElementById('profileName');
if (profileNameElem) profileNameElem.textContent = username;

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
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.onclick = () => {
    localStorage.clear();
    window.location.href = 'login.html';
  };
}

// File upload handling
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('image');
const preview = document.getElementById('preview');
const uploadForm = document.getElementById('uploadForm');
const uploadBtn = document.getElementById('uploadBtn');
const messageDiv = document.getElementById('uploadMessage');

if (uploadArea && fileInput && preview && uploadForm && uploadBtn && messageDiv) {
  // Drag and drop functionality
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files;
      handleFileSelect(files[0]);
    }
  });

  // File input change
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  });

  // Make the whole upload area clickable (except the preview)
  uploadArea.addEventListener('click', (e) => {
    if (!e.target.closest('#preview')) {
      fileInput.click();
    }
  });

  // Set default privacy setting on page load
  const userSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
  const defaultPrivacy = userSettings.defaultPostPrivacy || 'public';
  document.getElementById('privatePost').checked = defaultPrivacy === 'private';

  // Track manual changes to privacy setting
  document.getElementById('privatePost').addEventListener('change', function() {
    this.setAttribute('data-changed', 'true');
  });

  function handleFileSelect(file) {
    if (!file.type.startsWith('image/')) {
      showMessage('Please select an image file.', 'error');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      showMessage('File size must be less than 5MB.', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
      preview.classList.add('show');
      document.querySelector('.upload-content').style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  // Form submission with enhanced validation and progress
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    console.log('Upload form submitted');
    
    // Enhanced validation
    const file = fileInput.files[0];
    if (!file) {
      showMessage('Please select a file to upload.', 'error');
      return;
    }
    
    // File type validation
    if (!file.type.startsWith('image/')) {
      showMessage('Please select a valid image file (JPEG, PNG, GIF, etc.).', 'error');
      return;
    }
    
    // File size validation (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      showMessage('File size must be less than 5MB. Please choose a smaller image.', 'error');
      return;
    }
    
    // Caption length validation
    const caption = document.getElementById('caption').value.trim();
    if (caption.length > 500) {
      showMessage('Caption must be less than 500 characters.', 'error');
      return;
    }
    
    console.log('File selected:', { name: file.name, size: file.size, type: file.type });
    
    // Get default privacy setting from localStorage
    const userSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    const defaultPrivacy = userSettings.defaultPostPrivacy || 'public';
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('isPrivate', document.getElementById('privatePost').checked);
    formData.append('caption', caption);
    
    console.log('Form data prepared:', { isPrivate: document.getElementById('privatePost').checked });
    
    // Set default privacy if not manually changed
    if (!document.getElementById('privatePost').hasAttribute('data-changed')) {
      document.getElementById('privatePost').checked = defaultPrivacy === 'private';
    }
    
    // Show loading state with progress
    uploadBtn.classList.add('btn-loading');
    uploadBtn.disabled = true;
    messageDiv.textContent = '';
    
    // Create progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'upload-progress';
    progressBar.innerHTML = `
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
      <div class="progress-text">Uploading... 0%</div>
    `;
    messageDiv.appendChild(progressBar);
    
    try {
      const token = localStorage.getItem('token');
      console.log('Token available:', !!token);
      
      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          const progressFill = progressBar.querySelector('.progress-fill');
          const progressText = progressBar.querySelector('.progress-text');
          
          progressFill.style.width = percentComplete + '%';
          progressText.textContent = `Uploading... ${percentComplete}%`;
        }
      });
      
      xhr.addEventListener('load', () => {
        console.log('Upload response status:', xhr.status);
        
        try {
          const data = JSON.parse(xhr.responseText);
          console.log('Upload response data:', data);
          
          if (xhr.status === 201) {
            showMessage('Photo uploaded successfully! Redirecting to feed...', 'success');
            setTimeout(() => window.location.href = 'index.html', 1500);
          } else {
            showMessage(data.message || 'Upload failed', 'error');
          }
        } catch (error) {
          console.error('Error parsing response:', error);
          showMessage('Upload failed. Please try again.', 'error');
        }
      });
      
      xhr.addEventListener('error', () => {
        console.error('Upload error:', xhr.statusText);
        showMessage('Network error. Please check your connection and try again.', 'error');
      });
      
      xhr.open('POST', '/api/upload');
      xhr.setRequestHeader('Authorization', 'Bearer ' + token);
      xhr.send(formData);
      
    } catch (error) {
      console.error('Upload error:', error);
      showMessage('Network error. Please try again.', 'error');
    } finally {
      uploadBtn.classList.remove('btn-loading');
      uploadBtn.disabled = false;
    }
  });

  function showMessage(text, type) {
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;
  }
}
});