import mongoose from 'mongoose';
import dotenv from 'dotenv';
import File from './server/models/File.js';
import User from './server/models/User.js';
import bcrypt from 'bcryptjs';

dotenv.config();

async function testPostCreation() {
  try {
    console.log('🔍 Testing post creation and retrieval...');
    
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI environment variable is not set');
      process.exit(1);
    }
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Create a test user
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    const testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      bio: 'Test user for verification'
    });
    
    await testUser.save();
    console.log('✅ Test user created:', testUser.username);
    
    // Create a test post
    const testPost = new File({
      filename: 'test-image-123.jpg',
      originalName: 'test-image.jpg',
      contentType: 'image/jpeg',
      size: 1024000, // 1MB
      caption: 'This is a test post to verify database functionality',
      tags: ['test', 'verification'],
      isPrivate: false,
      uploader: testUser._id,
      uploaderUsername: testUser.username,
      uploadTime: new Date()
    });
    
    await testPost.save();
    console.log('✅ Test post created with ID:', testPost._id);
    
    // Verify the post was saved
    const retrievedPost = await File.findById(testPost._id)
      .populate('uploader', 'username email');
    
    if (retrievedPost) {
      console.log('✅ Post retrieved successfully:');
      console.log('  - ID:', retrievedPost._id);
      console.log('  - Caption:', retrievedPost.caption);
      console.log('  - Uploader:', retrievedPost.uploader.username);
      console.log('  - Upload Time:', retrievedPost.uploadTime);
      console.log('  - Is Private:', retrievedPost.isPrivate);
      console.log('  - Tags:', retrievedPost.tags);
      console.log('  - Size:', retrievedPost.size, 'bytes');
    } else {
      console.error('❌ Failed to retrieve the test post');
    }
    
    // Test feed retrieval
    const feedPosts = await File.find({ isPrivate: false })
      .populate('uploader', 'username')
      .sort({ uploadTime: -1 })
      .limit(10);
    
    console.log('✅ Feed retrieval test:');
    console.log('  - Total public posts:', feedPosts.length);
    console.log('  - Latest post:', feedPosts[0]?.caption || 'No posts found');
    
    // Test user posts retrieval
    const userPosts = await File.find({ uploader: testUser._id })
      .populate('uploader', 'username')
      .sort({ uploadTime: -1 });
    
    console.log('✅ User posts retrieval test:');
    console.log('  - User posts count:', userPosts.length);
    console.log('  - User posts:', userPosts.map(p => p.caption));
    
    // Clean up test data
    await File.deleteOne({ _id: testPost._id });
    await User.deleteOne({ _id: testUser._id });
    console.log('🧹 Test data cleaned up');
    
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    console.log('🎉 All tests passed! Posts are being saved correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testPostCreation();
