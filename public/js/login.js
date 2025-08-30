document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const messageDiv = document.getElementById('loginMessage');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  // Show loading state
  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in...';
  messageDiv.textContent = '';
  
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      messageDiv.className = 'message success';
      messageDiv.textContent = 'Login successful! Redirecting...';
      setTimeout(() => window.location.href = 'index.html', 1000);
    } else {
      messageDiv.className = 'message error';
      messageDiv.textContent = data.message || 'Login failed';
    }
  } catch (error) {
    messageDiv.className = 'message error';
    messageDiv.textContent = 'Network error. Please try again.';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign In';
  }
});