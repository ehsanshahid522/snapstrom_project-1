import mongoose from 'mongoose';

// Test MongoDB connection
async function testConnection() {
  try {
    console.log('🔗 Testing MongoDB connection...');
    
    // Your connection string (replace with actual one)
    const mongoURI = 'mongodb+srv://snapstream_user:Ehsan0397@cluster0.a9c2ktd.mongodb.net/snapstream?retryWrites=true&w=majority&appName=Cluster0';
    
    console.log('📝 Connection string length:', mongoURI.length);
    console.log('🔍 Starts with mongodb+srv:', mongoURI.startsWith('mongodb+srv://'));
    console.log('🔍 Contains .mongodb.net:', mongoURI.includes('.mongodb.net'));
    console.log('🔍 Contains /snapstream:', mongoURI.includes('/snapstream'));
    
    // Try to connect
    await mongoose.connect(mongoURI, {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 20000,
      family: 4,
      retryWrites: false,
      w: 1,
      bufferCommands: false,
      bufferMaxEntries: 0,
      connectTimeoutMS: 10000
    });
    
    console.log('✅ Connection successful!');
    
    // Test ping
    const admin = mongoose.connection.db.admin();
    await admin.ping();
    console.log('✅ Ping successful!');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected successfully');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error code:', error.code);
    
    if (error.name === 'MongoServerSelectionError') {
      console.log('🔍 This is a server selection error - check:');
      console.log('   - Network access in MongoDB Atlas');
      console.log('   - Cluster status');
      console.log('   - Username/password');
    } else if (error.name === 'MongoNetworkError') {
      console.log('🔍 This is a network error - check:');
      console.log('   - Internet connection');
      console.log('   - Firewall settings');
      console.log('   - MongoDB Atlas network access');
    } else if (error.name === 'MongoParseError') {
      console.log('🔍 This is a parsing error - check:');
      console.log('   - Connection string format');
      console.log('   - Special characters in password');
    }
  }
}

testConnection();
