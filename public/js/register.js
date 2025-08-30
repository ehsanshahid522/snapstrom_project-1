document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const messageDiv = document.getElementById('registerMessage');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  // Show loading state
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating account...';
  messageDiv.textContent = '';
  
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      messageDiv.className = 'message success';
      messageDiv.textContent = 'Registration successful! Redirecting to login...';
      setTimeout(() => window.location.href = 'login.html', 1500);
    } else {
      messageDiv.className = 'message error';
      messageDiv.textContent = data.message || 'Registration failed';
    }
  } catch (error) {
    messageDiv.className = 'message error';
    messageDiv.textContent = 'Network error. Please try again.';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Account';
  }
});