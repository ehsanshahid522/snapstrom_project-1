# 🧪 Photo Feed App - Test Checklist

## 🔧 Backend API Testing

### Authentication Routes (`/api/auth`)
- [ ] **Register User**
  - POST `/api/auth/register`
  - Test with valid data (username, email, password)
  - Test with duplicate username/email
  - Test with invalid data (missing fields, weak password)
  - Verify JWT token is returned

- [ ] **Login User**
  - POST `/api/auth/login`
  - Test with valid credentials
  - Test with invalid credentials
  - Verify JWT token is returned

- [ ] **Get User Profile**
  - GET `/api/auth/me`
  - Test with valid token
  - Test with invalid/expired token
  - Verify user data is returned

### Upload Routes (`/api/upload`)
- [ ] **Upload Image**
  - POST `/api/upload`
  - Test with valid image file
  - Test with invalid file type
  - Test with file > 5MB
  - Test with private/public post
  - Test with/without caption
  - Verify file is saved to uploads directory
  - Verify database record is created

### Feed Routes (`/api/feed`)
- [ ] **Get Feed**
  - GET `/api/feed`
  - Test with authenticated user
  - Verify public posts are shown
  - Verify user's own private posts are shown
  - Verify other users' private posts are hidden

- [ ] **Get User Posts**
  - GET `/api/feed/user/:username`
  - Test with public account
  - Test with private account
  - Test with follower access

- [ ] **Delete Post**
  - DELETE `/api/feed/:id`
  - Test deleting own post
  - Test deleting other user's post (should fail)
  - Verify post is removed from database

### Profile Routes (`/api/profile`)
- [ ] **Get User Profile**
  - GET `/api/profile/:username`
  - Test with public account
  - Test with private account
  - Verify user data and posts are returned

- [ ] **Update Profile**
  - PUT `/api/profile/update`
  - Test updating bio
  - Test updating privacy settings
  - Verify changes are saved

### Interaction Routes (`/api/interactions`)
- [ ] **Like/Unlike Post**
  - POST `/api/interactions/like/:postId`
  - Test liking a post
  - Test unliking a post
  - Verify like count updates

- [ ] **Add Comment**
  - POST `/api/interactions/comment/:postId`
  - Test with valid comment
  - Test with empty comment
  - Verify comment is saved

- [ ] **Get Comments**
  - GET `/api/interactions/comments/:postId`
  - Verify comments are returned

- [ ] **Delete Comment**
  - DELETE `/api/interactions/comment/:postId/:commentId`
  - Test deleting own comment
  - Test deleting other user's comment (should fail)

### Share Routes (`/api/share`)
- [ ] **Get Shared Post**
  - GET `/api/share/:id`
  - Test with valid post ID
  - Test with invalid post ID
  - Verify post data is returned

## 🎨 Frontend Testing

### Authentication Pages
- [ ] **Login Page**
  - Test form validation
  - Test successful login
  - Test error handling
  - Test redirect to feed

- [ ] **Register Page**
  - Test form validation
  - Test successful registration
  - Test error handling
  - Test redirect to login

### Upload Page
- [ ] **File Upload**
  - Test drag and drop
  - Test file browser selection
  - Test file type validation
  - Test file size validation
  - Test progress bar
  - Test upload success/error

- [ ] **Form Validation**
  - Test caption length
  - Test privacy settings
  - Test required fields

### Feed Page
- [ ] **Post Display**
  - Test post rendering
  - Test image loading
  - Test caption display
  - Test user info display
  - Test timestamp display

- [ ] **Interactions**
  - Test like/unlike functionality
  - Test comment display
  - Test comment form
  - Test share functionality

- [ ] **Responsive Design**
  - Test on desktop
  - Test on tablet
  - Test on mobile
  - Test different screen sizes

### Profile Page
- [ ] **Profile Display**
  - Test user info display
  - Test post grid
  - Test stats display
  - Test bio display

- [ ] **Profile Actions**
  - Test edit profile
  - Test privacy settings
  - Test post management

### Settings Page
- [ ] **Settings Form**
  - Test form validation
  - Test save functionality
  - Test error handling

## 🔒 Security Testing

- [ ] **JWT Authentication**
  - Test token validation
  - Test token expiration
  - Test invalid token handling

- [ ] **Authorization**
  - Test protected routes
  - Test user permissions
  - Test admin access

- [ ] **File Upload Security**
  - Test file type validation
  - Test file size limits
  - Test malicious file handling

## 📱 Mobile Testing

- [ ] **Mobile Responsiveness**
  - Test on iOS Safari
  - Test on Android Chrome
  - Test on different screen sizes
  - Test touch interactions

- [ ] **Mobile Upload**
  - Test camera access
  - Test gallery access
  - Test file selection

## 🌐 Network Testing

- [ ] **API Endpoints**
  - Test all endpoints with Postman
  - Test error responses
  - Test rate limiting (if implemented)

- [ ] **File Upload**
  - Test large file uploads
  - Test slow network conditions
  - Test upload cancellation

## 🚀 Deployment Testing

- [ ] **Environment Variables**
  - Test MONGO_URI configuration
  - Test JWT_SECRET configuration
  - Test PORT configuration

- [ ] **Database Connection**
  - Test MongoDB connection
  - Test connection error handling
  - Test reconnection logic

## 📊 Performance Testing

- [ ] **Load Testing**
  - Test multiple concurrent users
  - Test database performance
  - Test file upload performance

- [ ] **Memory Usage**
  - Monitor memory usage during uploads
  - Test memory cleanup
  - Test garbage collection

## 🐛 Error Handling

- [ ] **Backend Errors**
  - Test database connection errors
  - Test file system errors
  - Test validation errors
  - Test authentication errors

- [ ] **Frontend Errors**
  - Test network errors
  - Test JavaScript errors
  - Test user input errors

## 📝 Documentation

- [ ] **API Documentation**
  - Verify all endpoints are documented
  - Test example requests
  - Test example responses

- [ ] **User Documentation**
  - Test user guides
  - Test help sections
  - Test error messages

---

## 🎯 Quick Test Commands

```bash
# Start the server
npm start

# Test with curl
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Test file upload
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test-image.jpg" \
  -F "caption=Test caption" \
  -F "isPrivate=false"
```

## 🔍 Manual Testing Steps

1. **Start the server**: `npm start`
2. **Open browser**: Navigate to `http://localhost:3000`
3. **Register a new user**: Test registration flow
4. **Login**: Test login functionality
5. **Upload a photo**: Test upload with progress bar
6. **View feed**: Test post display and interactions
7. **Test mobile**: Open on mobile device
8. **Test sharing**: Share a post and verify link works

---

**Status**: ⏳ In Progress
**Last Updated**: $(date)
**Tester**: [Your Name] 