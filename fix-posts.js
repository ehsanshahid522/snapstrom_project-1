import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// User Schema
const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  profilePicture: {
    type: String,
    default: null
  },
  isPrivateAccount: {
    type: Boolean,
    default: false
  },
  bio: {
    type: String,
    default: ''
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

// File Schema
const FileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  caption: {
    type: String,
    default: ''
  },
  tags: [{
    type: String
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileData: {
    type: Buffer,
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

const File = mongoose.model('File', FileSchema);

async function fixPosts() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find or create a test user
    let testUser = await User.findOne({ username: 'testuser' });
    if (!testUser) {
      console.log('👤 Creating test user...');
      testUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword123'
      });
      await testUser.save();
      console.log('✅ Test user created');
    } else {
      console.log('✅ Test user found');
    }

    // Find posts without uploadedBy
    const postsWithoutUser = await File.find({ uploadedBy: null });
    console.log(`📸 Found ${postsWithoutUser.length} posts without user information`);

    if (postsWithoutUser.length > 0) {
      console.log('🔧 Fixing posts...');
      for (const post of postsWithoutUser) {
        post.uploadedBy = testUser._id;
        await post.save();
        console.log(`✅ Fixed post: ${post.filename}`);
      }
      console.log('🎉 All posts fixed!');
    } else {
      console.log('✅ All posts already have user information');
    }

    // Check the feed again
    const allPosts = await File.find({}).populate('uploadedBy', 'username profilePicture bio');
    console.log(`📊 Total posts in database: ${allPosts.length}`);
    
    const postsWithUser = allPosts.filter(p => p.uploadedBy);
    console.log(`👥 Posts with user information: ${postsWithUser.length}`);

    console.log('✅ Database fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixPosts();
