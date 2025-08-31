# 🧪 Testing Guide

## 📋 Overview

This guide covers comprehensive testing strategies for the SnapStream Platform, including unit tests, integration tests, end-to-end tests, and performance testing. Our testing approach follows the testing pyramid principle and industry best practices.

## 🏗️ Testing Architecture

### Testing Pyramid

```
┌─────────────────────────────────────────────────────────────────┐
│                        Testing Pyramid                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    E2E Tests (10%)                         │ │
│  │                 (Cypress / Playwright)                     │ │
│  │              • User workflows                              │ │
│  │              • Critical paths                              │ │
│  │              • Cross-browser testing                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                  Integration Tests (20%)                   │ │
│  │                 (API Testing / Database)                   │ │
│  │              • API endpoints                               │ │
│  │              • Database operations                         │ │
│  │              • External service integration                │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Unit Tests (70%)                        │ │
│  │                 (Jest / React Testing Library)             │ │
│  │              • Individual functions                        │ │
│  │              • React components                            │ │
│  │              • Utility functions                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Test Structure

```
tests/
├── 📁 backend/                 # Backend tests
│   ├── 📁 unit/                # Unit tests
│   │   ├── 📁 controllers/     # Controller tests
│   │   ├── 📁 services/        # Service tests
│   │   ├── 📁 models/          # Model tests
│   │   ├── 📁 middleware/      # Middleware tests
│   │   └── 📁 utils/           # Utility tests
│   ├── 📁 integration/         # Integration tests
│   │   ├── 📁 api/             # API endpoint tests
│   │   ├── 📁 database/        # Database integration tests
│   │   └── 📁 auth/            # Authentication tests
│   └── 📁 e2e/                 # End-to-end tests
├── 📁 frontend/                # Frontend tests
│   ├── 📁 unit/                # Unit tests
│   │   ├── 📁 components/      # Component tests
│   │   ├── 📁 hooks/           # Custom hook tests
│   │   ├── 📁 utils/           # Utility function tests
│   │   └── 📁 services/        # API service tests
│   ├── 📁 integration/         # Integration tests
│   │   ├── 📁 pages/           # Page component tests
│   │   └── 📁 forms/           # Form integration tests
│   └── 📁 e2e/                 # End-to-end tests
├── 📁 shared/                  # Shared test utilities
│   ├── 📁 fixtures/            # Test data fixtures
│   ├── 📁 mocks/               # Mock implementations
│   └── 📁 helpers/             # Test helper functions
└── 📄 jest.config.js           # Jest configuration
```

## 🛠️ Testing Tools & Setup

### Required Dependencies

```json
{
  "devDependencies": {
    "jest": "^29.0.0",
    "supertest": "^6.3.0",
    "mongodb-memory-server": "^8.12.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/user-event": "^14.4.3",
    "cypress": "^12.0.0",
    "playwright": "^1.35.0",
    "faker": "^6.6.6",
    "nock": "^13.2.9"
  }
}
```

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/index.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000
};
```

### Test Setup

```javascript
// tests/setup.js
import '@testing-library/jest-dom';

// Global test setup
beforeAll(async () => {
  // Setup test database
  // Setup test environment
});

afterAll(async () => {
  // Cleanup test database
  // Cleanup test environment
});

// Global test utilities
global.testUtils = {
  createTestUser: () => ({ /* test user data */ }),
  createTestPost: () => ({ /* test post data */ }),
  mockAuthToken: () => 'test-jwt-token'
};
```

## 🧪 Unit Testing

### Backend Unit Tests

#### Controller Testing

```javascript
// tests/backend/unit/controllers/userController.test.js
import request from 'supertest';
import app from '../../../backend/server.js';
import User from '../../../backend/models/User.js';
import { createTestUser, mockAuthToken } from '../../shared/helpers.js';

describe('UserController', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    testUser = await createTestUser();
    authToken = mockAuthToken(testUser.id);
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      const response = await request(app)
        .get(`/api/users/profile/${testUser.username}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe(testUser.username);
      expect(response.body.data.email).toBe(testUser.email);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/profile/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('User not found');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        bio: 'Updated bio',
        profilePicture: 'new-picture.jpg'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.bio).toBe(updateData.bio);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .send({ bio: 'Test bio' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
```

#### Service Testing

```javascript
// tests/backend/unit/services/userService.test.js
import UserService from '../../../backend/services/userService.js';
import User from '../../../backend/models/User.js';
import { createTestUser } from '../../shared/helpers.js';

describe('UserService', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await createTestUser();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('createUser', () => {
    it('should create user with valid data', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123'
      };

      const user = await UserService.createUser(userData);

      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password); // Should be hashed
    });

    it('should throw error for duplicate username', async () => {
      const userData = {
        username: testUser.username,
        email: 'different@example.com',
        password: 'password123'
      };

      await expect(UserService.createUser(userData))
        .rejects
        .toThrow('Username already exists');
    });
  });

  describe('findUserByUsername', () => {
    it('should find user by username', async () => {
      const user = await UserService.findUserByUsername(testUser.username);
      expect(user).toBeDefined();
      expect(user.username).toBe(testUser.username);
    });

    it('should return null for non-existent user', async () => {
      const user = await UserService.findUserByUsername('nonexistent');
      expect(user).toBeNull();
    });
  });
});
```

#### Model Testing

```javascript
// tests/backend/unit/models/User.test.js
import User from '../../../backend/models/User.js';
import mongoose from 'mongoose';

describe('User Model', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  it('should create user with valid data', async () => {
    const validUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };

    const user = new User(validUser);
    const savedUser = await user.save();

    expect(savedUser.username).toBe(validUser.username);
    expect(savedUser.email).toBe(validUser.email);
    expect(savedUser._id).toBeDefined();
    expect(savedUser.createdAt).toBeDefined();
  });

  it('should not save user with invalid email', async () => {
    const invalidUser = {
      username: 'testuser',
      email: 'invalid-email',
      password: 'password123'
    };

    const user = new User(invalidUser);
    let error;

    try {
      await user.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.email).toBeDefined();
  });

  it('should enforce unique username constraint', async () => {
    const user1 = new User({
      username: 'testuser',
      email: 'test1@example.com',
      password: 'password123'
    });

    const user2 = new User({
      username: 'testuser',
      email: 'test2@example.com',
      password: 'password123'
    });

    await user1.save();

    let error;
    try {
      await user2.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.code).toBe(11000); // MongoDB duplicate key error
  });
});
```

### Frontend Unit Tests

#### Component Testing

```javascript
// tests/frontend/unit/components/Button.test.jsx
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

  it('applies correct variant classes', () => {
    const { rerender } = render(<Button variant="primary">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-blue-600');

    rerender(<Button variant="secondary">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-gray-200');

    rerender(<Button variant="danger">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
  });

  it('applies correct size classes', () => {
    const { rerender } = render(<Button size="small">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-3', 'py-1', 'text-sm');

    rerender(<Button size="large">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3', 'text-lg');
  });

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Button</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });
});
```

#### Hook Testing

```javascript
// tests/frontend/unit/hooks/useAuth.test.js
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../../../src/hooks/useAuth';
import { AuthContext } from '../../../src/context/AuthContext';

const mockAuthContext = {
  user: null,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn()
};

const wrapper = ({ children }) => (
  <AuthContext.Provider value={mockAuthContext}>
    {children}
  </AuthContext.Provider>
);

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns auth context values', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBe(mockAuthContext.user);
    expect(result.current.login).toBe(mockAuthContext.login);
    expect(result.current.logout).toBe(mockAuthContext.logout);
    expect(result.current.register).toBe(mockAuthContext.register);
  });

  it('handles login with loading state', async () => {
    const mockLogin = jest.fn().mockResolvedValue();
    mockAuthContext.login = mockLogin;

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login({ email: 'test@example.com', password: 'password' });
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(null);

    await act(async () => {
      await mockLogin();
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('handles login errors', async () => {
    const mockError = new Error('Login failed');
    const mockLogin = jest.fn().mockRejectedValue(mockError);
    mockAuthContext.login = mockLogin;

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      try {
        await result.current.login({ email: 'test@example.com', password: 'wrong' });
      } catch (error) {
        // Error expected
      }
    });

    expect(result.current.error).toBe(mockError.message);
    expect(result.current.isLoading).toBe(false);
  });
});
```

## 🔗 Integration Testing

### API Integration Tests

```javascript
// tests/backend/integration/api/auth.test.js
import request from 'supertest';
import app from '../../../backend/server.js';
import User from '../../../backend/models/User.js';
import { createTestUser, cleanupTestData } from '../../shared/helpers.js';

describe('Auth API Integration', () => {
  let testUser;

  beforeAll(async () => {
    testUser = await createTestUser();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('POST /api/auth/register', () => {
    it('should register new user successfully', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'Password123',
        confirmPassword: 'Password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(userData.username);
      expect(response.body.data.token).toBeDefined();

      // Verify user was saved to database
      const savedUser = await User.findOne({ username: userData.username });
      expect(savedUser).toBeDefined();
      expect(savedUser.email).toBe(userData.email);
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        username: 'ab', // Too short
        email: 'invalid-email',
        password: '123', // Too short
        confirmPassword: 'different'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login existing user successfully', async () => {
      const loginData = {
        email: testUser.email,
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(testUser.username);
      expect(response.body.data.token).toBeDefined();
    });

    it('should return error for invalid credentials', async () => {
      const invalidData = {
        email: testUser.email,
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid credentials');
    });
  });
});
```

### Database Integration Tests

```javascript
// tests/backend/integration/database/userOperations.test.js
import mongoose from 'mongoose';
import User from '../../../backend/models/User.js';
import Post from '../../../backend/models/Post.js';
import { setupTestDB, cleanupTestDB } from '../../shared/helpers.js';

describe('User Database Operations', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await cleanupTestDB();
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Post.deleteMany({});
  });

  describe('User CRUD Operations', () => {
    it('should create and retrieve user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toBe(userData.username);

      const retrievedUser = await User.findById(savedUser._id);
      expect(retrievedUser).toBeDefined();
      expect(retrievedUser.username).toBe(userData.username);
    });

    it('should update user information', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      const updateData = { bio: 'Updated bio' };
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        updateData,
        { new: true }
      );

      expect(updatedUser.bio).toBe(updateData.bio);
    });

    it('should delete user and cascade delete posts', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      const post = await Post.create({
        user: user._id,
        imageUrl: 'test.jpg',
        caption: 'Test post'
      });

      await User.findByIdAndDelete(user._id);

      const deletedUser = await User.findById(user._id);
      const deletedPost = await Post.findById(post._id);

      expect(deletedUser).toBeNull();
      expect(deletedPost).toBeNull();
    });
  });

  describe('User Relationships', () => {
    it('should handle follow/unfollow relationships', async () => {
      const user1 = await User.create({
        username: 'user1',
        email: 'user1@example.com',
        password: 'password123'
      });

      const user2 = await User.create({
        username: 'user2',
        email: 'user2@example.com',
        password: 'password123'
      });

      // User1 follows User2
      await User.findByIdAndUpdate(user1._id, {
        $push: { following: user2._id }
      });

      await User.findByIdAndUpdate(user2._id, {
        $push: { followers: user1._id }
      });

      const updatedUser1 = await User.findById(user1._id).populate('following');
      const updatedUser2 = await User.findById(user2._id).populate('followers');

      expect(updatedUser1.following).toHaveLength(1);
      expect(updatedUser1.following[0].username).toBe('user2');
      expect(updatedUser2.followers).toHaveLength(1);
      expect(updatedUser2.followers[0].username).toBe('user1');
    });
  });
});
```

## 🎯 End-to-End Testing

### Cypress E2E Tests

```javascript
// tests/frontend/e2e/auth.cy.js
describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should register new user successfully', () => {
    cy.visit('/register');
    
    cy.get('[data-testid="username-input"]').type('newuser');
    cy.get('[data-testid="email-input"]').type('newuser@example.com');
    cy.get('[data-testid="password-input"]').type('Password123');
    cy.get('[data-testid="confirm-password-input"]').type('Password123');
    
    cy.get('[data-testid="register-button"]').click();
    
    // Should redirect to login
    cy.url().should('include', '/login');
    cy.get('[data-testid="success-message"]').should('contain', 'Registration successful');
  });

  it('should login existing user successfully', () => {
    cy.visit('/login');
    
    cy.get('[data-testid="email-input"]').type('testuser@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    
    cy.get('[data-testid="login-button"]').click();
    
    // Should redirect to feed
    cy.url().should('include', '/feed');
    cy.get('[data-testid="user-menu"]').should('be.visible');
  });

  it('should show error for invalid credentials', () => {
    cy.visit('/login');
    
    cy.get('[data-testid="email-input"]').type('testuser@example.com');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    
    cy.get('[data-testid="login-button"]').click();
    
    cy.get('[data-testid="error-message"]').should('contain', 'Invalid credentials');
  });
});
```

### Playwright E2E Tests

```javascript
// tests/frontend/e2e/post-creation.spec.js
import { test, expect } from '@playwright/test';

test.describe('Post Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'testuser@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/feed');
  });

  test('should create post with image and caption', async ({ page }) => {
    await page.goto('/upload');
    
    // Upload image
    const fileInput = page.locator('[data-testid="image-input"]');
    await fileInput.setInputFiles('tests/fixtures/test-image.jpg');
    
    // Add caption
    await page.fill('[data-testid="caption-input"]', 'Test post caption');
    
    // Submit form
    await page.click('[data-testid="upload-button"]');
    
    // Wait for success
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Verify post appears in feed
    await page.goto('/feed');
    await expect(page.locator('text=Test post caption')).toBeVisible();
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.goto('/upload');
    
    // Try to submit without image
    await page.click('[data-testid="upload-button"]');
    
    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('Image is required');
  });
});
```

## 📊 Performance Testing

### Load Testing

```javascript
// tests/performance/load-test.js
import autocannon from 'autocannon';

describe('API Performance Tests', () => {
  it('should handle 100 concurrent users', async () => {
    const result = await autocannon({
      url: 'http://localhost:3000/api/posts/feed',
      connections: 100,
      duration: 10,
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(result.errors).toBe(0);
    expect(result.timeouts).toBe(0);
    expect(result.requests.average).toBeGreaterThan(100); // 100+ req/sec
    expect(result.latency.p99).toBeLessThan(1000); // 99% under 1s
  });

  it('should handle file uploads efficiently', async () => {
    const result = await autocannon({
      url: 'http://localhost:3000/api/upload/post-image',
      connections: 50,
      duration: 30,
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token'
      },
      body: 'image-data' // Mock image data
    });

    expect(result.errors).toBe(0);
    expect(result.latency.p95).toBeLessThan(5000); // 95% under 5s
  });
});
```

### Memory Leak Testing

```javascript
// tests/performance/memory-test.js
import { heapStats } from 'v8';

describe('Memory Usage Tests', () => {
  it('should not have memory leaks during user operations', async () => {
    const initialMemory = heapStats();
    
    // Perform multiple user operations
    for (let i = 0; i < 1000; i++) {
      await createTestUser();
      await deleteTestUser();
    }
    
    const finalMemory = heapStats();
    const memoryIncrease = finalMemory.used_heap_size - initialMemory.used_heap_size;
    
    // Memory increase should be minimal (less than 10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });
});
```

## 🧹 Test Data Management

### Test Fixtures

```javascript
// tests/shared/fixtures/users.js
export const userFixtures = {
  validUser: {
    username: 'testuser',
    email: 'testuser@example.com',
    password: 'password123',
    bio: 'Test user bio'
  },
  
  adminUser: {
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  },
  
  privateUser: {
    username: 'privateuser',
    email: 'private@example.com',
    password: 'password123',
    isPrivate: true
  }
};

// tests/shared/fixtures/posts.js
export const postFixtures = {
  validPost: {
    imageUrl: 'test-image.jpg',
    caption: 'Test post caption',
    tags: ['test', 'example'],
    isPrivate: false
  },
  
  privatePost: {
    imageUrl: 'private-image.jpg',
    caption: 'Private post',
    isPrivate: true
  }
};
```

### Test Helpers

```javascript
// tests/shared/helpers.js
import User from '../../backend/models/User.js';
import Post from '../../backend/models/Post.js';
import { userFixtures, postFixtures } from './fixtures/index.js';

export const createTestUser = async (overrides = {}) => {
  const userData = { ...userFixtures.validUser, ...overrides };
  return await User.create(userData);
};

export const createTestPost = async (userId, overrides = {}) => {
  const postData = { ...postFixtures.validPost, user: userId, ...overrides };
  return await Post.create(postData);
};

export const cleanupTestData = async () => {
  await User.deleteMany({});
  await Post.deleteMany({});
};

export const mockAuthToken = (userId) => {
  // Generate mock JWT token for testing
  return `mock-jwt-token-${userId}`;
};

export const setupTestDB = async () => {
  // Setup test database connection
  await mongoose.connect(process.env.MONGO_URI_TEST);
};

export const teardownTestDB = async () => {
  // Cleanup test database
  await mongoose.connection.close();
};
```

## 📈 Test Coverage & Reporting

### Coverage Configuration

```javascript
// jest.config.js - Coverage section
collectCoverageFrom: [
  'src/**/*.{js,jsx}',
  '!src/**/*.test.{js,jsx}',
  '!src/index.js',
  '!src/**/*.stories.{js,jsx}'
],
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  },
  './src/components/': {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90
  }
},
coverageReporters: [
  'text',
  'lcov',
  'html',
  'json'
]
```

### Coverage Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:e2e": "cypress run",
    "test:e2e:open": "cypress open",
    "test:performance": "jest --testPathPattern=performance"
  }
}
```

## 🚀 Continuous Integration Testing

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:6
        ports:
          - 27017:27017
        options: >-
          --health-cmd "mongosh --eval 'db.runCommand(\"ping\").ok'"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      
      - run: npm run test:ci
      
      - run: npm run test:e2e
        env:
          CYPRESS_baseUrl: http://localhost:3000
      
      - uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
```

## 🔍 Debugging Tests

### Test Debugging Tips

```javascript
// Debug failing tests
describe('Debug Example', () => {
  it('should debug failing test', async () => {
    // Use console.log for debugging
    console.log('Test data:', testData);
    
    // Use debugger for step-by-step debugging
    debugger;
    
    // Use Jest's expect().toBe() for detailed failure messages
    expect(result).toBe(expectedValue);
  });
});

// Async test debugging
it('should handle async operations', async () => {
  try {
    const result = await asyncOperation();
    expect(result).toBeDefined();
  } catch (error) {
    console.error('Async operation failed:', error);
    throw error;
  }
});
```

### Common Test Issues

1. **Async/Await Issues**
   - Always use `async/await` or return promises
   - Use `waitFor` for DOM updates
   - Handle loading states properly

2. **Database Cleanup**
   - Clean up test data after each test
   - Use transactions for test isolation
   - Reset database state between tests

3. **Mock Data**
   - Use realistic test data
   - Avoid hardcoded values
   - Use factories for complex objects

## 📚 Testing Best Practices

### General Guidelines

- **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it
- **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
- **Test Isolation**: Each test should be independent and not affect others
- **Descriptive Names**: Use clear, descriptive test names that explain the scenario
- **Single Responsibility**: Each test should verify one specific behavior

### Frontend Testing

- **User-Centric Testing**: Test from the user's perspective
- **Accessibility Testing**: Ensure components are accessible
- **Responsive Testing**: Test on different screen sizes
- **Error Handling**: Test error states and edge cases

### Backend Testing

- **API Contract Testing**: Ensure API endpoints work as expected
- **Database Testing**: Test database operations and constraints
- **Security Testing**: Verify authentication and authorization
- **Performance Testing**: Ensure acceptable response times

---

*Last updated: August 2025*
*Testing Guide v1.0.0*
