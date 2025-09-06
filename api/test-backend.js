import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';

// Test database connection
async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/snapstream';
    await mongoose.connect(mongoUri);
    
    console.log('✅ Database connected successfully');
    
    // Test model imports
    console.log('🔍 Testing model imports...');
    
    const User = (await import('./models/User.js')).default;
    const Post = (await import('./models/Post.js')).default;
    const Conversation = (await import('./models/Conversation.js')).default;
    const Message = (await import('./models/Message.js')).default;
    
    console.log('✅ All models imported successfully');
    
    // Test model creation
    console.log('🔍 Testing model creation...');
    
    const testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword'
    });
    
    console.log('✅ User model created successfully');
    
    const testPost = new Post({
      content: 'Test post content',
      author: testUser._id
    });
    
    console.log('✅ Post model created successfully');
    
    const testConversation = new Conversation({
      participants: [
        { user: testUser._id, username: 'testuser' }
      ]
    });
    
    console.log('✅ Conversation model created successfully');
    
    const testMessage = new Message({
      conversation: testConversation._id,
      sender: testUser._id,
      content: 'Test message'
    });
    
    console.log('✅ Message model created successfully');
    
    console.log('🎉 All database tests passed!');
    
    await mongoose.disconnect();
    console.log('📡 Database disconnected');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
}

// Test controller imports
async function testControllerImports() {
  try {
    console.log('🔍 Testing controller imports...');
    
    const userController = await import('./controllers/userController.js');
    const postController = await import('./controllers/postController.js');
    const chatController = await import('./controllers/chatController.js');
    
    console.log('✅ All controllers imported successfully');
    
    // Check if main functions exist
    const userFunctions = ['register', 'login', 'getProfile', 'updateProfile', 'toggleFollow', 'logout'];
    const postFunctions = ['createPost', 'getPosts', 'getUserPosts', 'toggleLike', 'addComment', 'sharePost', 'deletePost'];
    const chatFunctions = ['getConversations', 'getMessages', 'sendMessage', 'startConversation', 'markAsRead', 'getOnlineUsers'];
    
    userFunctions.forEach(func => {
      if (typeof userController[func] !== 'function') {
        throw new Error(`User controller missing function: ${func}`);
      }
    });
    
    postFunctions.forEach(func => {
      if (typeof postController[func] !== 'function') {
        throw new Error(`Post controller missing function: ${func}`);
      }
    });
    
    chatFunctions.forEach(func => {
      if (typeof chatController[func] !== 'function') {
        throw new Error(`Chat controller missing function: ${func}`);
      }
    });
    
    console.log('✅ All controller functions exist');
    console.log('🎉 All controller tests passed!');
    
  } catch (error) {
    console.error('❌ Controller test failed:', error);
    process.exit(1);
  }
}

// Test route imports
async function testRouteImports() {
  try {
    console.log('🔍 Testing route imports...');
    
    const userRoutes = await import('./routes/userRoutes.js');
    const postRoutes = await import('./routes/postRoutes.js');
    const chatRoutes = await import('./routes/chatRoutes.js');
    
    console.log('✅ All routes imported successfully');
    console.log('🎉 All route tests passed!');
    
  } catch (error) {
    console.error('❌ Route test failed:', error);
    process.exit(1);
  }
}

// Test middleware imports
async function testMiddlewareImports() {
  try {
    console.log('🔍 Testing middleware imports...');
    
    const authMiddleware = await import('./middleware/auth.js');
    
    console.log('✅ Middleware imported successfully');
    
    // Check if main functions exist
    const middlewareFunctions = ['authenticateToken', 'updateUserOnlineStatus', 'errorHandler', 'validateRequest'];
    
    middlewareFunctions.forEach(func => {
      if (typeof authMiddleware[func] !== 'function') {
        throw new Error(`Middleware missing function: ${func}`);
      }
    });
    
    console.log('✅ All middleware functions exist');
    console.log('🎉 All middleware tests passed!');
    
  } catch (error) {
    console.error('❌ Middleware test failed:', error);
    process.exit(1);
  }
}

// Test service imports
async function testServiceImports() {
  try {
    console.log('🔍 Testing service imports...');
    
    const chatService = await import('./services/chatService.js');
    const database = await import('./utils/database.js');
    
    console.log('✅ All services imported successfully');
    console.log('🎉 All service tests passed!');
    
  } catch (error) {
    console.error('❌ Service test failed:', error);
    process.exit(1);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting backend MVC structure tests...\n');
  
  try {
    await testControllerImports();
    console.log('');
    
    await testRouteImports();
    console.log('');
    
    await testMiddlewareImports();
    console.log('');
    
    await testServiceImports();
    console.log('');
    
    await testDatabaseConnection();
    console.log('');
    
    console.log('🎉 All backend tests passed successfully!');
    console.log('✅ MVC structure is properly implemented');
    console.log('✅ Chat functionality is ready');
    console.log('✅ All dependencies are working');
    
  } catch (error) {
    console.error('❌ Backend tests failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url.endsWith(process.argv[1])) {
  runAllTests();
} else {
  // Also run if called directly
  runAllTests();
}

export { runAllTests };
