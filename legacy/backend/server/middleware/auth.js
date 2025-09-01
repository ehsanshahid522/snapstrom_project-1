import jwt from 'jsonwebtoken';

export default (req, res, next) => {
  console.log('Auth middleware called for:', req.path);
  console.log('Headers:', req.headers);
  
  const token = req.headers['authorization'];
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'No token provided' });
  }

  console.log('Token found, verifying...');
  console.log('JWT_SECRET available:', !!process.env.JWT_SECRET);
  
  jwt.verify(token.split(' ')[1], process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      return res.status(401).json({ message: 'Invalid token' });
    }
    console.log('Token verified, user:', decoded);
    // Normalize id to string to avoid ObjectId comparison issues
    req.user = { ...decoded, id: String(decoded.id) };
    next();
  });
};