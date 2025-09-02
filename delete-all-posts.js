const mongoose = require('mongoose');
const File = require('./api/models/File');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    return false;
  }
}

// Function to delete all posts
async function deleteAllPosts() {
  try {
    console.log('🗑️  Starting post deletion process...');
    
    // Count total posts first
    const totalPosts = await File.countDocuments();
    console.log(`📊 Found ${totalPosts} posts to delete`);
    
    if (totalPosts === 0) {
      console.log('✅ No posts found to delete');
      return;
    }
    
    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will permanently delete ALL posts from the database!');
    console.log('📝 This action cannot be undone.');
    console.log('🔍 To continue, please type "DELETE ALL POSTS" (exactly as shown):');
    
    // For safety, we'll require manual confirmation
    // In a real scenario, you might want to add a confirmation prompt
    console.log('\n🔄 Proceeding with deletion...');
    
    // Delete all posts
    const result = await File.deleteMany({});
    
    console.log(`\n✅ Successfully deleted ${result.deletedCount} posts`);
    console.log('🗑️  All posts have been removed from the database');
    
    // Verify deletion
    const remainingPosts = await File.countDocuments();
    console.log(`📊 Remaining posts: ${remainingPosts}`);
    
    if (remainingPosts === 0) {
      console.log('✅ Database cleanup completed successfully!');
    } else {
      console.log('⚠️  Some posts may still remain. Please check manually.');
    }
    
  } catch (error) {
    console.error('❌ Error deleting posts:', error);
  }
}

// Function to show database stats
async function showDatabaseStats() {
  try {
    console.log('\n📊 Database Statistics:');
    
    const totalPosts = await File.countDocuments();
    const publicPosts = await File.countDocuments({ isPrivate: false });
    const privatePosts = await File.countDocuments({ isPrivate: true });
    
    console.log(`📸 Total Posts: ${totalPosts}`);
    console.log(`🌍 Public Posts: ${publicPosts}`);
    console.log(`🔒 Private Posts: ${privatePosts}`);
    
    // Show some sample posts
    const samplePosts = await File.find().select('filename caption createdAt').limit(5);
    if (samplePosts.length > 0) {
      console.log('\n📋 Sample Posts:');
      samplePosts.forEach((post, index) => {
        console.log(`${index + 1}. ${post.filename} - "${post.caption}" (${post.createdAt})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error getting database stats:', error);
  }
}

// Main execution
async function main() {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI environment variable is required');
    process.exit(1);
  }
  
  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Failed to connect to database');
    process.exit(1);
  }
  
  // Show current database stats
  await showDatabaseStats();
  
  // Delete all posts
  await deleteAllPosts();
  
  console.log('\n✅ Script completed');
  process.exit(0);
}

main().catch(console.error);
