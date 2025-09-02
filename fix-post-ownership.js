const mongoose = require('mongoose');
const User = require('./api/models/User');
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

// Function to fix post ownership
async function fixPostOwnership() {
  try {
    console.log('🔍 Starting post ownership fix...');
    
    // Get all posts
    const posts = await File.find({});
    console.log(`📊 Found ${posts.length} total posts`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    for (const post of posts) {
      // Check if uploadedBy is a valid ObjectId but doesn't correspond to a real user
      if (post.uploadedBy) {
        const user = await User.findById(post.uploadedBy);
        
        if (!user) {
          console.log(`⚠️  Post ${post._id} has invalid user ID: ${post.uploadedBy}`);
          
          // Try to find a user by username if the post has a caption that might indicate ownership
          // This is a heuristic approach - you might need to adjust based on your data
          if (post.caption) {
            // Look for common patterns that might indicate username
            const usernameMatch = post.caption.match(/@(\w+)/);
            if (usernameMatch) {
              const potentialUsername = usernameMatch[1];
              const userByUsername = await User.findOne({ username: potentialUsername });
              
              if (userByUsername) {
                console.log(`🔄 Fixing post ${post._id} ownership to user: ${potentialUsername}`);
                post.uploadedBy = userByUsername._id;
                await post.save();
                fixedCount++;
                continue;
              }
            }
          }
          
          // If we can't determine ownership, we'll need manual intervention
          console.log(`❌ Cannot determine ownership for post ${post._id}. Manual intervention required.`);
          skippedCount++;
        } else {
          console.log(`✅ Post ${post._id} has valid owner: ${user.username}`);
        }
      }
    }
    
    console.log(`\n📈 Fix Summary:`);
    console.log(`✅ Fixed: ${fixedCount} posts`);
    console.log(`⏭️  Skipped: ${skippedCount} posts (require manual intervention)`);
    console.log(`📊 Total processed: ${posts.length} posts`);
    
  } catch (error) {
    console.error('❌ Error fixing post ownership:', error);
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
  
  await fixPostOwnership();
  
  console.log('✅ Script completed');
  process.exit(0);
}

main().catch(console.error);
