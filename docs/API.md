# 🔌 API Documentation

## 📋 Overview

The SnapStream Platform API provides a comprehensive set of endpoints for building photo-sharing and social media applications. The API follows RESTful principles and uses JSON for data exchange.

**Base URL**: `https://api.snapstream.com` (Production) / `http://localhost:3000` (Development)

**API Version**: v1

**Authentication**: JWT Bearer Token

## 🔐 Authentication

### JWT Token Format
```
Authorization: Bearer <your-jwt-token>
```

### Token Expiration
- **Access Token**: 24 hours
- **Refresh Token**: 7 days

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details"
  }
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 🔑 Authentication Endpoints

### User Registration
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "confirmPassword": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "createdAt": "date"
    },
    "token": "jwt-token"
  }
}
```

**Validation Rules:**
- Username: 3-20 characters, alphanumeric + underscore
- Email: Valid email format
- Password: Minimum 8 characters, at least one uppercase, lowercase, and number

### User Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "profilePicture": "string"
    },
    "token": "jwt-token"
  }
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "username": "string",
    "email": "string",
    "profilePicture": "string",
    "bio": "string",
    "followers": 0,
    "following": 0,
    "posts": 0
  }
}
```

### Refresh Token
```http
POST /api/auth/refresh
Authorization: Bearer <token>
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

## 👤 User Management

### Get User Profile
```http
GET /api/users/profile/:username
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "username": "string",
    "profilePicture": "string",
    "bio": "string",
    "followers": 0,
    "following": 0,
    "posts": 0,
    "isFollowing": false,
    "createdAt": "date"
  }
}
```

### Update User Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "username": "string",
  "bio": "string",
  "profilePicture": "string"
}
```

### Follow/Unfollow User
```http
POST /api/users/:userId/follow
Authorization: Bearer <token>
```

### Get User Followers
```http
GET /api/users/:userId/followers?page=1&limit=20
```

### Get User Following
```http
GET /api/users/:userId/following?page=1&limit=20
```

### Search Users
```http
GET /api/users/search?q=searchterm&page=1&limit=20
```

## 📸 Post Management

### Create Post
```http
POST /api/posts
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `image`: File (JPEG, PNG, GIF, max 5MB)
- `caption`: String (optional)
- `isPrivate`: Boolean (default: false)
- `tags`: String (comma-separated, optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "imageUrl": "string",
    "caption": "string",
    "isPrivate": false,
    "tags": ["tag1", "tag2"],
    "likes": 0,
    "comments": 0,
    "createdAt": "date",
    "user": {
      "id": "string",
      "username": "string",
      "profilePicture": "string"
    }
  }
}
```

### Get Post Feed
```http
GET /api/posts/feed?page=1&limit=20
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 50)
- `sort`: Sort order (newest, oldest, popular)

### Get User Posts
```http
GET /api/posts/user/:username?page=1&limit=20
```

### Get Single Post
```http
GET /api/posts/:postId
```

### Update Post
```http
PUT /api/posts/:postId
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "caption": "string",
  "isPrivate": false,
  "tags": "string"
}
```

### Delete Post
```http
DELETE /api/posts/:postId
Authorization: Bearer <token>
```

## ❤️ Social Interactions

### Like/Unlike Post
```http
POST /api/posts/:postId/like
Authorization: Bearer <token>
```

### Add Comment
```http
POST /api/posts/:postId/comments
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "content": "string"
}
```

### Get Post Comments
```http
GET /api/posts/:postId/comments?page=1&limit=20
```

### Delete Comment
```http
DELETE /api/posts/:postId/comments/:commentId
Authorization: Bearer <token>
```

### Get Liked Posts
```http
GET /api/posts/liked?page=1&limit=20
Authorization: Bearer <token>
```

## 🔍 Search & Discovery

### Search Posts
```http
GET /api/search/posts?q=searchterm&page=1&limit=20
```

**Query Parameters:**
- `q`: Search query
- `page`: Page number
- `limit`: Items per page
- `filter`: Filter by tags, user, date range

### Get Trending Posts
```http
GET /api/posts/trending?period=week&page=1&limit=20
```

**Period Options:**
- `day`: Last 24 hours
- `week`: Last 7 days
- `month`: Last 30 days

### Get Posts by Tag
```http
GET /api/posts/tag/:tagName?page=1&limit=20
```

## 📁 File Upload

### Upload Profile Picture
```http
POST /api/upload/profile-picture
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `image`: File (JPEG, PNG, max 2MB)

### Upload Post Image
```http
POST /api/upload/post-image
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `image`: File (JPEG, PNG, GIF, max 5MB)

## 📊 Analytics

### Get User Stats
```http
GET /api/analytics/user
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPosts": 0,
    "totalLikes": 0,
    "totalComments": 0,
    "totalViews": 0,
    "followers": 0,
    "following": 0,
    "engagementRate": 0.0
  }
}
```

### Get Post Analytics
```http
GET /api/analytics/post/:postId
Authorization: Bearer <token>
```

## 🚨 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |

## 📝 Rate Limiting

- **Authentication endpoints**: 5 requests per minute
- **Post creation**: 10 requests per hour
- **File uploads**: 20 requests per hour
- **General API**: 100 requests per minute

## 🔒 Security

### CORS Policy
- **Allowed Origins**: Configured per environment
- **Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Headers**: Content-Type, Authorization

### File Upload Security
- **Allowed Types**: JPEG, PNG, GIF
- **Max Size**: 5MB for posts, 2MB for profile pictures
- **Virus Scanning**: Automatic malware detection
- **Content Validation**: Image format verification

### Data Protection
- **Password Hashing**: bcrypt with salt rounds
- **JWT Security**: Secure token generation and validation
- **Input Sanitization**: XSS and injection protection
- **HTTPS**: Required for production

## 📚 SDKs & Libraries

### JavaScript/Node.js
```bash
npm install snapstream-api-client
```

```javascript
import { SnapStreamAPI } from 'snapstream-api-client';

const api = new SnapStreamAPI({
  baseURL: 'https://api.snapstream.com',
  token: 'your-jwt-token'
});

// Get user profile
const profile = await api.users.getProfile('username');
```

### Python
```bash
pip install snapstream-python
```

### PHP
```bash
composer require snapstream/php-client
```

## 🧪 Testing

### Postman Collection
Download our [Postman Collection](https://api.snapstream.com/postman-collection.json) for easy API testing.

### API Testing Environment
- **Base URL**: `https://staging-api.snapstream.com`
- **Test Account**: `testuser@snapstream.com` / `testpass123`

## 📞 Support

- **Documentation**: [docs.snapstream.com](https://docs.snapstream.com)
- **API Status**: [status.snapstream.com](https://status.snapstream.com)
- **Support Email**: api-support@snapstream.com
- **Developer Discord**: [discord.gg/snapstream](https://discord.gg/snapstream)

---

*Last updated: August 2025*
*API Version: v1.0.0*
