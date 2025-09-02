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

const User = mongoose.model('User', UserSchema);
const File = mongoose.model('File', FileSchema);

async function fixUsernames() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if we have any users
    const userCount = await User.countDocuments();
    console.log(`📊 Found ${userCount} users in database`);

    if (userCount === 0) {
      console.log('❌ No users found. Creating a default user...');
      const defaultUser = new User({
        username: 'defaultuser',
        email: 'default@example.com',
        password: 'hashedpassword123' // This should be properly hashed
      });
      await defaultUser.save();
      console.log('✅ Created default user:', defaultUser.username);
    }

    // Get the first user (or default user)
    const firstUser = await User.findOne();
    console.log('👤 Using user:', firstUser.username);

    // Find posts with missing uploaders
    const postsWithMissingUploaders = await File.find({ 
      $or: [
        { uploadedBy: null },
        { uploadedBy: { $exists: false } }
      ]
    });

    console.log(`🔍 Found ${postsWithMissingUploaders.length} posts with missing uploaders`);

    if (postsWithMissingUploaders.length > 0) {
      // Update all posts with missing uploaders
      const updateResult = await File.updateMany(
        { 
          $or: [
            { uploadedBy: null },
            { uploadedBy: { $exists: false } }
          ]
        },
        { uploadedBy: firstUser._id }
      );

      console.log(`✅ Updated ${updateResult.modifiedCount} posts with user: ${firstUser.username}`);
    }

    // Now let's check all posts and their uploaders
    const allPosts = await File.find().populate('uploadedBy', 'username');
    console.log('\n📱 All posts with uploaders:');
    
    allPosts.forEach((post, index) => {
      console.log(`${index + 1}. Post ID: ${post._id}`);
      console.log(`   Filename: ${post.filename}`);
      console.log(`   Uploader: ${post.uploadedBy ? post.uploadedBy.username : 'NO UPLOADER'}`);
      console.log(`   Caption: ${post.caption || 'No caption'}`);
      console.log('---');
    });

    console.log('\n✅ Username fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing usernames:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixUsernames();
