// Test MongoDB connection string encoding
const connectionStrings = [
  // Current (not working)
  "mongodb+srv://ehsanshahid97_db_user:Ehsan@397@cluster0.a9c2ktd.mongodb.net/snapstream?retryWrites=true&w=majority&appName=Cluster0",
  
  // URL encoded (should work)
  "mongodb+srv://ehsanshahid97_db_user:Ehsan%40397@cluster0.a9c2ktd.mongodb.net/snapstream?retryWrites=true&w=majority&appName=Cluster0"
];

console.log('🔍 MongoDB Connection String Analysis:\n');

connectionStrings.forEach((connStr, index) => {
  console.log(`String ${index + 1}:`);
  console.log(connStr);
  
  // Check for @ symbol in password
  const match = connStr.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@/);
  if (match) {
    const [, username, password] = match;
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log(`Password contains @: ${password.includes('@')}`);
    console.log(`URL encoded: ${password.replace('@', '%40')}`);
  }
  console.log('---');
});

console.log('✅ The issue is that @ in password needs to be %40 in URL encoding.');
console.log('📋 Update your MONGO_URI in Vercel with the URL-encoded version.');
