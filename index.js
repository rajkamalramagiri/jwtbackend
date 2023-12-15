const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const uuid = require('uuid');

const app = express();
const PORT = 5000;

// Replace this secret with a secure secret key for production
const JWT_SECRET = 'your-secret-key';
app.use(cors());
app.use(bodyParser.json());

// Sample users (replace with your user authentication logic)
const users = [
  { id: '1', username: 'user1', password: 'password1', refreshToken: null },
  { id: '2', username: 'user2', password: 'password2', refreshToken: null },
];

// In-memory store for refresh tokens (in production, use a database)
const refreshTokens = [];

// Expiration time for refresh tokens in seconds (e.g., 7 days)
const refreshTokenExpiration = 7 * 24 * 60 * 60;

// Middleware to verify the JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Forbidden: Invalid token' });
    }
    req.user = user;
    next();
  });
};

app.get('/test', (req, res) => {
  res.send('hello')
})

// Dummy function to find user by username (replace with your actual logic)
function findUserByUsername(username) {
  return users.find(u => u.username === username);
}

// Route to handle user login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Replace with your actual user authentication logic (e.g., check database)
  const user = findUserByUsername(username);

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  // Generate JWT token
  const accessToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '5m' });


  // Generate refresh token with expiration time
  const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: refreshTokenExpiration,
  });

  // refreshTokens.push(refreshToken);
  
  // Save refresh token with the user (in production, store it in a database)
  
  // user.refreshToken = refreshToken;

  res.json({ accessToken, refreshToken });

});

// Route to refresh the JWT token
app.post('/token', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(403).json({ message: 'Forbidden: Invalid refresh token' });
  }

// Verify the refresh token and extract the user ID
  const decoded = jwt.verify(refreshToken, JWT_SECRET);
  console.log('decoed',decoded)
  const userId = decoded.userId;

  // Find user data associated with the refresh token
  const user = users.find(u => u.id === userId);


  if (!user) {
    return res.status(403).json({ message: 'Forbidden: User not found for refresh token' });
  }

  // Generate a new JWT token with user data
  const newAccessToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: '5m', // Token expires in 15 minutes
  });

  res.json({ accessToken: newAccessToken });
});



// Protected route that requires a valid token
app.get('/user', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
