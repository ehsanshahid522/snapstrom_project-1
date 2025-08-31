# 🚀 Deployment Guide

## 📋 Overview

This guide covers deploying the SnapStream Platform to various cloud platforms and environments. The platform consists of a React frontend and Node.js backend, with MongoDB as the database.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
│   [Vercel]      │    │   [Heroku]      │    │   [Atlas]       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Prerequisites

### Required Accounts
- **GitHub** - Source code repository
- **MongoDB Atlas** - Cloud database
- **Vercel** - Frontend hosting
- **Heroku** - Backend hosting
- **Cloudinary** (Optional) - Image storage

### Required Tools
- **Node.js** 18+ and **npm** 8+
- **Git** for version control
- **Heroku CLI** for backend deployment
- **Vercel CLI** for frontend deployment

## 🗄️ Database Setup

### MongoDB Atlas Configuration

1. **Create Atlas Cluster**
   ```bash
   # Visit https://cloud.mongodb.com
   # Create new project and cluster
   # Choose M0 (Free) for development
   # Select your preferred region
   ```

2. **Database Access**
   ```bash
   # Create database user
   Username: snapstream_user
   Password: <strong-password>
   Role: Atlas admin
   ```

3. **Network Access**
   ```bash
   # Add IP addresses
   # For development: 0.0.0.0/0 (allows all IPs)
   # For production: Your server IPs only
   ```

4. **Connection String**
   ```bash
   # Format: mongodb+srv://username:password@cluster.mongodb.net/database
   MONGO_URI=mongodb+srv://snapstream_user:password@cluster0.abc123.mongodb.net/snapstream_prod
   ```

## 🎨 Frontend Deployment (Vercel)

### Automatic Deployment

1. **Connect Repository**
   ```bash
   # Visit https://vercel.com
   # Import your GitHub repository
   # Select the frontend directory
   ```

2. **Environment Variables**
   ```bash
   # Add to Vercel dashboard
   REACT_APP_API_URL=https://your-backend.herokuapp.com
   REACT_APP_ENVIRONMENT=production
   ```

3. **Build Settings**
   ```bash
   # Framework Preset: Vite
   # Build Command: npm run build
   # Output Directory: dist
   # Install Command: npm install
   ```

### Manual Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Configure Domain**
   ```bash
   vercel domains add yourdomain.com
   ```

## 🚀 Backend Deployment (Heroku)

### Automatic Deployment

1. **Connect Repository**
   ```bash
   # Visit https://heroku.com
   # Create new app
   # Connect to GitHub repository
   # Enable automatic deploys
   ```

2. **Environment Variables**
   ```bash
   # Add in Heroku dashboard
   NODE_ENV=production
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=your-super-secure-secret
   PORT=3000
   FRONTEND_URL=https://yourdomain.com
   ```

3. **Buildpacks**
   ```bash
   # Add Node.js buildpack
   heroku buildpacks:set heroku/nodejs
   ```

### Manual Deployment

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login and Deploy**
   ```bash
   heroku login
   heroku git:remote -a your-app-name
   git push heroku main
   ```

3. **Verify Deployment**
   ```bash
   heroku open
   heroku logs --tail
   ```

## 🐳 Docker Deployment

### Dockerfile

```dockerfile
# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongo:27017/snapstream
    depends_on:
      - mongo
    volumes:
      - ./uploads:/app/uploads

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

### Deploy with Docker

```bash
# Build and run
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## ☁️ Cloud Platform Alternatives

### AWS Deployment

1. **EC2 Instance**
   ```bash
   # Launch EC2 instance
   # Install Node.js and MongoDB
   # Clone repository and deploy
   ```

2. **Elastic Beanstalk**
   ```bash
   # Package application
   eb init
   eb create
   eb deploy
   ```

3. **ECS with Fargate**
   ```bash
   # Build Docker image
   # Push to ECR
   # Deploy to ECS
   ```

### Google Cloud Platform

1. **App Engine**
   ```yaml
   # app.yaml
   runtime: nodejs18
   env: standard
   ```

2. **Cloud Run**
   ```bash
   # Build and push image
   gcloud run deploy snapstream-backend
   ```

### Azure Deployment

1. **App Service**
   ```bash
   # Deploy via Azure CLI
   az webapp up --name snapstream-backend
   ```

2. **Container Instances**
   ```bash
   # Deploy Docker container
   az container create --resource-group myResourceGroup
   ```

## 🔒 Security Configuration

### Environment Variables

```bash
# Production .env
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-super-secure-256-bit-secret
JWT_REFRESH_SECRET=your-refresh-secret
PORT=3000
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### SSL/TLS Configuration

1. **Vercel (Frontend)**
   - Automatic SSL with Let's Encrypt
   - Custom domain support

2. **Heroku (Backend)**
   - Automatic SSL for *.herokuapp.com
   - Custom domain SSL via SSL add-on

3. **Custom Domain SSL**
   ```bash
   # Using Let's Encrypt
   certbot --nginx -d yourdomain.com
   ```

### Security Headers

```javascript
// backend/middleware/security.js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
```

## 📊 Monitoring & Logging

### Application Monitoring

1. **Heroku Add-ons**
   ```bash
   # Add monitoring add-ons
   heroku addons:create papertrail:choklad
   heroku addons:create newrelic:wayne
   ```

2. **Custom Logging**
   ```javascript
   // backend/utils/logger.js
   import winston from 'winston';

   const logger = winston.createLogger({
     level: 'info',
     format: winston.format.json(),
     transports: [
       new winston.transports.File({ filename: 'error.log', level: 'error' }),
       new winston.transports.File({ filename: 'combined.log' }),
     ],
   });
   ```

### Health Checks

```javascript
// backend/routes/health.js
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});
```

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: akhileshns/heroku-deploy@v3.12.14
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: "your-app-name"
          heroku_email: "your-email@example.com"

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm ci
      - run: cd frontend && npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🧪 Testing Deployment

### Pre-deployment Checklist

- [ ] All tests pass locally
- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] SSL certificates valid
- [ ] Domain DNS configured
- [ ] Monitoring tools configured

### Post-deployment Tests

```bash
# Test backend health
curl https://your-backend.herokuapp.com/health

# Test frontend
curl https://yourdomain.com

# Test API endpoints
curl -H "Authorization: Bearer $TOKEN" \
  https://your-backend.herokuapp.com/api/auth/me

# Test file upload
curl -X POST -F "image=@test.jpg" \
  -H "Authorization: Bearer $TOKEN" \
  https://your-backend.herokuapp.com/api/upload/post-image
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs
   heroku logs --tail
   vercel logs
   ```

2. **Database Connection Issues**
   ```bash
   # Verify MongoDB URI
   # Check network access
   # Test connection locally
   ```

3. **CORS Errors**
   ```bash
   # Verify CORS configuration
   # Check frontend URL in backend
   # Test with Postman
   ```

4. **File Upload Issues**
   ```bash
   # Check file size limits
   # Verify file types
   # Check storage permissions
   ```

### Performance Optimization

1. **Image Optimization**
   ```javascript
   // Use sharp for image processing
   import sharp from 'sharp';
   
   const optimizedImage = await sharp(buffer)
     .resize(800, 800, { fit: 'inside' })
     .jpeg({ quality: 80 })
     .toBuffer();
   ```

2. **Caching Strategy**
   ```javascript
   // Implement Redis caching
   import Redis from 'ioredis';
   
   const redis = new Redis(process.env.REDIS_URL);
   ```

## 📈 Scaling Considerations

### Horizontal Scaling

1. **Load Balancing**
   - Use multiple backend instances
   - Implement session sharing
   - Configure sticky sessions

2. **Database Scaling**
   - MongoDB Atlas cluster scaling
   - Read replicas for queries
   - Sharding for large datasets

### Vertical Scaling

1. **Resource Allocation**
   - Increase Heroku dyno size
   - Optimize Node.js memory usage
   - Implement connection pooling

## 📞 Support & Maintenance

### Monitoring Tools

- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry, LogRocket
- **Performance**: New Relic, DataDog
- **Logs**: Papertrail, Loggly

### Maintenance Schedule

- **Weekly**: Security updates, dependency updates
- **Monthly**: Performance review, backup verification
- **Quarterly**: Security audit, capacity planning

---

*Last updated: August 2025*
*Deployment Guide v1.0.0*
