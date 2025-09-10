import mongoose from 'mongoose';
import User from '../models/User.js';
import { connectDB } from '../utils/database.js';

async function fixUsernames() {
  try {
    console.log('🔗 Connecting to database...');
    await connectDB();
    
    console.log('🔍 Finding users with trailing spaces...');
    const users = await User.find({});
    
    let fixedCount = 0;
    
    for (const user of users) {
      const originalUsername = user.username;
      const trimmedUsername = user.username.trim();
      
      if (originalUsername !== trimmedUsername) {
        console.log(`🔧 Fixing username: "${originalUsername}" -> "${trimmedUsername}"`);
        
        // Check if trimmed username already exists
        const existingUser = await User.findOne({ 
          username: { $regex: `^${trimmedUsername}$`, $options: 'i' },
          _id: { $ne: user._id }
        });
        
        if (existingUser) {
          console.log(`⚠️  Skipping "${originalUsername}" - trimmed version "${trimmedUsername}" already exists`);
          continue;
        }
        
        // Update the username
        user.username = trimmedUsername;
        await user.save();
        fixedCount++;
      }
    }
    
    console.log(`✅ Fixed ${fixedCount} usernames`);
    console.log('🎉 Username cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error fixing usernames:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixUsernames();
