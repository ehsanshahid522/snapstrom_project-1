# 🏗️ System Architecture

## 📋 Overview

The SnapStream Platform is built using a modern, scalable architecture that follows microservices principles and industry best practices. The system is designed to handle high traffic, provide excellent user experience, and maintain security standards.

## 🏛️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                            │
├─────────────────────────────────────────────────────────────────┤
│  Web App (React)  │  Mobile App  │  Third-party Integrations  │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Load Balancer / CDN                        │
│                    (Cloudflare / AWS CloudFront)               │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend Layer (Vercel)                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Static Files  │  │   React App     │  │   PWA Assets    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Rate Limiting │  │   Authentication│  │   CORS Control  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Backend Services Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Auth Service   │  │  Post Service   │  │  User Service   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Upload Service  │  │ Search Service  │  │ Analytics Svc   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Layer                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   MongoDB       │  │   Redis Cache   │  │   File Storage  │ │
│  │   (Primary DB)  │  │   (Session/    │  │   (S3/Cloudinary)│ │
│  └─────────────────┘  │    Cache)       │  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Technology Stack

### Frontend Layer
- **Framework**: React 18 with Vite
- **State Management**: React Context API + Custom Hooks
- **Styling**: Tailwind CSS + CSS Modules
- **Routing**: React Router v6
- **Build Tool**: Vite for fast development and optimized builds
- **PWA**: Service Workers for offline functionality

### Backend Layer
- **Runtime**: Node.js 18+ (LTS)
- **Framework**: Express.js with middleware architecture
- **Authentication**: JWT with refresh token strategy
- **Validation**: Joi for request validation
- **File Upload**: Multer with file type validation
- **Error Handling**: Centralized error handling middleware

### Data Layer
- **Primary Database**: MongoDB 6+ with Mongoose ODM
- **Caching**: Redis for session storage and caching
- **File Storage**: AWS S3 or Cloudinary for media files
- **Search**: MongoDB Atlas Search or Elasticsearch

### Infrastructure
- **Hosting**: Vercel (Frontend), Heroku (Backend)
- **Database**: MongoDB Atlas (Cloud)
- **CDN**: Cloudflare or AWS CloudFront
- **Monitoring**: New Relic, Sentry, Loggly

## 🏗️ Backend Architecture

### Service Layer Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Routes                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   /auth     │  │   /users    │  │   /posts    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Controllers                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │AuthController│  │UserController│  │PostController│            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Services                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ AuthService │  │ UserService │  │ PostService │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Models                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │     User    │  │     Post    │  │   Comment   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### Middleware Architecture

```javascript
// Middleware Stack
app.use(helmet());                    // Security headers
app.use(cors());                      // CORS configuration
app.use(express.json());              // JSON parsing
app.use(express.urlencoded());        // URL encoding
app.use(compression());               // Response compression
app.use(morgan('combined'));          // Request logging
app.use(rateLimit());                 // Rate limiting
app.use('/api', apiRoutes);           // API routes
app.use(errorHandler);                // Error handling
```

### Authentication Flow

```
1. User Login Request
   ↓
2. Validate Credentials
   ↓
3. Generate JWT Access Token (24h)
   ↓
4. Generate JWT Refresh Token (7d)
   ↓
5. Store Refresh Token in Redis
   ↓
6. Return Tokens to Client
   ↓
7. Client Stores Access Token
   ↓
8. Client Uses Access Token for API Calls
   ↓
9. When Access Token Expires
   ↓
10. Use Refresh Token to Get New Access Token
```

## 🎨 Frontend Architecture

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        App Component                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Router        │  │   Auth Context  │  │   Theme Context │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Layout        │  │   Navigation    │  │   Sidebar       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Pages         │  │   Components    │  │   Hooks         │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### State Management

```javascript
// Context Providers
const AppProviders = ({ children }) => (
  <ThemeProvider>
    <AuthProvider>
      <PostProvider>
        <UploadProvider>
          {children}
        </UploadProvider>
      </PostProvider>
    </AuthProvider>
  </ThemeProvider>
);

// Custom Hooks
const useAuth = () => useContext(AuthContext);
const usePosts = () => useContext(PostContext);
const useUpload = () => useContext(UploadContext);
```

### Service Layer

```javascript
// API Service Architecture
class ApiService {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
    this.client = axios.create({
      baseURL,
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  async request(config) {
    try {
      const response = await this.client.request(config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

// Feature-specific Services
class PostService extends ApiService {
  async getFeed(page = 1, limit = 20) {
    return this.request({
      method: 'GET',
      url: `/posts/feed?page=${page}&limit=${limit}`
    });
  }
}
```

## 🗄️ Database Architecture

### MongoDB Schema Design

```javascript
// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  profilePicture: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isPrivate: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Post Schema
const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  caption: {
    type: String,
    maxlength: 1000
  },
  tags: [{
    type: String,
    trim: true
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPrivate: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});
```

### Database Indexing Strategy

```javascript
// Performance Indexes
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ likes: 1 });

// Text Search Index
postSchema.index({
  caption: 'text',
  tags: 'text'
}, {
  weights: {
    caption: 10,
    tags: 5
  }
});
```

## 🔒 Security Architecture

### Authentication & Authorization

```javascript
// JWT Strategy
const jwtStrategy = new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
  passReqToCallback: true
}, async (req, payload, done) => {
  try {
    const user = await User.findById(payload.id).select('-password');
    if (!user) return done(null, false);
    
    req.user = user;
    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
});

// Role-based Access Control
const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({
      success: false,
      error: { message: 'Insufficient permissions' }
    });
  }
  next();
};
```

### Security Middleware

```javascript
// Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.API_URL],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: { message: 'Too many requests from this IP' }
  }
});
```

## 📊 Performance Architecture

### Caching Strategy

```javascript
// Redis Caching
const redis = new Redis(process.env.REDIS_URL);

const cacheMiddleware = (duration = 300) => async (req, res, next) => {
  const key = `cache:${req.originalUrl}`;
  
  try {
    const cached = await redis.get(key);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    res.originalJson = res.json;
    res.json = async (data) => {
      await redis.setex(key, duration, JSON.stringify(data));
      res.originalJson(data);
    };
    
    next();
  } catch (error) {
    next();
  }
};
```

### Image Optimization

```javascript
// Sharp Image Processing
import sharp from 'sharp';

const optimizeImage = async (buffer, options = {}) => {
  const {
    width = 800,
    height = 800,
    quality = 80,
    format = 'jpeg'
  } = options;

  return sharp(buffer)
    .resize(width, height, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality, progressive: true })
    .toBuffer();
};
```

## 🔄 Data Flow Architecture

### Request Flow

```
1. Client Request
   ↓
2. Load Balancer / CDN
   ↓
3. Frontend (if static) or Backend
   ↓
4. API Gateway (Rate limiting, CORS)
   ↓
5. Authentication Middleware
   ↓
6. Route Handler
   ↓
7. Controller
   ↓
8. Service Layer
   ↓
9. Data Access Layer
   ↓
10. Database / Cache
   ↓
11. Response Processing
   ↓
12. Client Response
```

### File Upload Flow

```
1. Client Selects File
   ↓
2. Frontend Validation
   ↓
3. Upload to Backend
   ↓
4. Backend Validation
   ↓
5. Image Processing
   ↓
6. Upload to Cloud Storage
   ↓
7. Save Metadata to Database
   ↓
8. Return Success Response
   ↓
9. Update UI
```

## 🧪 Testing Architecture

### Testing Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                        Testing Pyramid                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    E2E Tests (10%)                         │ │
│  │                 (Cypress / Playwright)                     │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                  Integration Tests (20%)                   │ │
│  │                 (API Testing / Database)                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Unit Tests (70%)                        │ │
│  │                 (Jest / React Testing Library)             │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Test Structure

```javascript
// Unit Tests
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Test implementation
    });
    
    it('should throw error with invalid data', async () => {
      // Test implementation
    });
  });
});

// Integration Tests
describe('User API', () => {
  describe('POST /api/users', () => {
    it('should create user successfully', async () => {
      // Test implementation
    });
  });
});
```

## 📈 Scalability Architecture

### Horizontal Scaling

```javascript
// Load Balancing
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  // Worker process
  require('./server');
}
```

### Database Scaling

```javascript
// MongoDB Connection Pooling
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,
  bufferCommands: false
});
```

## 🔍 Monitoring & Observability

### Logging Strategy

```javascript
// Winston Logger Configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

### Health Checks

```javascript
// Health Check Endpoint
app.get('/health', async (req, res) => {
  try {
    // Database health check
    await mongoose.connection.db.admin().ping();
    
    // Redis health check
    await redis.ping();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

## 🚀 Deployment Architecture

### Environment Configuration

```javascript
// Environment-based Configuration
const config = {
  development: {
    port: 3000,
    mongoUri: 'mongodb://localhost:27017/snapstream_dev',
    jwtSecret: 'dev-secret',
    corsOrigin: 'http://localhost:5173'
  },
  staging: {
    port: process.env.PORT || 3000,
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    corsOrigin: process.env.FRONTEND_URL
  },
  production: {
    port: process.env.PORT || 3000,
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    corsOrigin: process.env.FRONTEND_URL
  }
};

const environment = process.env.NODE_ENV || 'development';
module.exports = config[environment];
```

### CI/CD Pipeline

```yaml
# GitHub Actions Workflow
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: akhileshns/heroku-deploy@v3
```

## 🔮 Future Architecture Considerations

### Microservices Migration

- **Service Decomposition**: Break down monolithic backend
- **API Gateway**: Implement Kong or AWS API Gateway
- **Service Discovery**: Use Consul or Eureka
- **Message Queues**: Implement RabbitMQ or Apache Kafka

### Cloud-Native Architecture

- **Container Orchestration**: Kubernetes deployment
- **Serverless Functions**: AWS Lambda or Azure Functions
- **Event-Driven Architecture**: Event sourcing and CQRS
- **Multi-Region Deployment**: Global distribution

### Advanced Features

- **Real-time Communication**: WebSocket implementation
- **Push Notifications**: Firebase Cloud Messaging
- **Analytics Engine**: Custom analytics and insights
- **Machine Learning**: Content recommendation system

---

*Last updated: August 2025*
*Architecture Documentation v1.0.0*
