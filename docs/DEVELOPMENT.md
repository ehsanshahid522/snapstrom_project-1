# 🚀 Development Guide

## 🛠️ Development Environment Setup

### Prerequisites
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** 8+ or **yarn** 1.22+
- **MongoDB** 6+ ([Download](https://www.mongodb.com/try/download/community))
- **Git** ([Download](https://git-scm.com/))
- **VS Code** (Recommended) with extensions:
  - ESLint
  - Prettier
  - MongoDB for VS Code
  - Auto Rename Tag
  - Bracket Pair Colorizer

### Initial Setup

1. **Clone and navigate**
   ```bash
   git clone https://github.com/ehsanshahid522/snapstrom_project-1.git
   cd snapstrom_project-1
   ```

2. **Install dependencies**
   ```bash
   # Root dependencies
   npm install
   
   # Frontend dependencies
   cd frontend && npm install
   
   # Backend dependencies
   cd ../backend && npm install
   ```

3. **Environment configuration**
   ```bash
   # Copy environment template
   cp env.example .env
   
   # Edit .env with your values
   MONGO_URI=mongodb://localhost:27017/snapstream_dev
   JWT_SECRET=your-development-jwt-secret
   PORT=3000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

## 🔧 Development Scripts

### Root Package.json
```bash
npm run dev:full      # Start both frontend and backend
npm run build         # Build frontend for production
npm run start         # Start production server
npm run lint          # Lint all code
npm run lint:fix      # Fix linting issues
```

### Frontend (in frontend/ directory)
```bash
npm run dev           # Start Vite dev server
npm run build         # Build for production
npm run preview       # Preview production build
npm run lint          # Lint frontend code
```

### Backend (in backend/ directory)
```bash
npm run dev           # Start with nodemon
npm run start         # Start production server
npm run lint          # Lint backend code
```

## 🏗️ Project Architecture

### Backend Architecture
```
backend/
├── config/           # Configuration files
├── controllers/      # Request handlers (MVC pattern)
├── middleware/       # Express middleware
├── models/           # Database models (Mongoose)
├── routes/           # API route definitions
├── services/         # Business logic layer
├── utils/            # Utility functions
└── validators/       # Request validation
```

### Frontend Architecture
```
frontend/src/
├── components/       # Reusable React components
│   ├── ui/          # Basic UI components
│   ├── layout/      # Layout components
│   ├── forms/       # Form components
│   └── features/    # Feature-specific components
├── pages/           # Page components
├── hooks/           # Custom React hooks
├── context/         # React context providers
├── services/        # API service functions
├── utils/           # Utility functions
└── constants/       # Application constants
```

## 📝 Coding Standards

### JavaScript/React
- Use **ES6+** features
- Prefer **const** and **let** over **var**
- Use **arrow functions** for consistency
- Use **destructuring** for objects and arrays
- Use **template literals** for strings
- Use **async/await** over promises

### File Naming
- **Components**: PascalCase (e.g., `UserProfile.jsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.js`)
- **Utilities**: camelCase (e.g., `formatDate.js`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.js`)

### Component Structure
```jsx
// Component template
import React from 'react';
import PropTypes from 'prop-types';

const ComponentName = ({ prop1, prop2 }) => {
  // Hooks
  // State
  // Effects
  // Handlers
  
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
};

ComponentName.defaultProps = {
  prop2: 0,
};

export default ComponentName;
```

## 🗄️ Database Development

### MongoDB Connection
```javascript
// backend/config/database.js
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
```

### Model Development
```javascript
// backend/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  // ... other fields
}, {
  timestamps: true,
});

export default mongoose.model('User', userSchema);
```

## 🔌 API Development

### Route Structure
```javascript
// backend/routes/users.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getProfile,
  updateProfile,
  deleteProfile,
} from '../controllers/userController.js';

const router = express.Router();

router.get('/profile/:username', getProfile);
router.put('/profile/update', protect, updateProfile);
router.delete('/profile', protect, deleteProfile);

export default router;
```

### Controller Pattern
```javascript
// backend/controllers/userController.js
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  
  const user = await User.findOne({ username })
    .select('-password')
    .populate('posts');
    
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  res.json({ success: true, data: user });
});
```

## 🎨 Frontend Development

### Component Development
```jsx
// frontend/src/components/ui/Button.jsx
import React from 'react';
import PropTypes from 'prop-types';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  onClick,
  className = '',
  ...props 
}) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  const sizeClasses = {
    small: 'px-3 py-1 text-sm',
    medium: 'px-4 py-2',
    large: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export default Button;
```

### Custom Hooks
```javascript
// frontend/src/hooks/useAuth.js
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const { user, login, logout, register } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (credentials) => {
    setIsLoading(true);
    setError(null);
    try {
      await login(credentials);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    error,
    login: handleLogin,
    logout,
    register,
  };
};
```

## 🧪 Testing

### Backend Testing
```javascript
// tests/backend/unit/userController.test.js
import request from 'supertest';
import app from '../../backend/server.js';
import User from '../../backend/models/User.js';

describe('User Controller', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('GET /api/users/profile/:username', () => {
    it('should return user profile', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await request(app)
        .get(`/api/users/profile/${user.username}`)
        .expect(200);

      expect(response.body.data.username).toBe('testuser');
    });
  });
});
```

### Frontend Testing
```jsx
// tests/frontend/components/Button.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../../../src/components/ui/Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## 🔍 Debugging

### Backend Debugging
```javascript
// Add to your controllers
console.log('Request body:', req.body);
console.log('User:', req.user);
console.log('Query params:', req.query);

// Use debug package for better logging
import debug from 'debug';
const log = debug('app:userController');

log('Processing user request:', { userId: req.user.id });
```

### Frontend Debugging
```jsx
// Use React DevTools
// Add console logs for debugging
console.log('Component state:', state);
console.log('Props received:', props);

// Use React DevTools Profiler for performance
```

## 📚 Useful Resources

### Documentation
- [React Documentation](https://reactjs.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Tools
- [Postman](https://www.postman.com/) - API testing
- [MongoDB Compass](https://www.mongodb.com/products/compass) - Database GUI
- [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools) - Browser extension

## 🚀 Deployment Preparation

### Environment Variables
```bash
# Production .env
NODE_ENV=production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/snapstream
JWT_SECRET=your-super-secure-production-secret
PORT=3000
FRONTEND_URL=https://yourdomain.com
```

### Build Process
```bash
# Frontend build
cd frontend
npm run build

# Backend preparation
cd ../backend
npm run build  # If using TypeScript
```

This development guide provides a solid foundation for building and maintaining the SnapStream platform with professional standards and best practices.

