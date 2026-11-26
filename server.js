const path = require('path');
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db/database');
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Ensure SQLite database is initialized before handling API routes
app.use(async (req, res, next) => {
  try {
    await initDb();
    next();
  } catch (err) {
    next(err);
  }
});

// Health / API overview endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'Nethra R - Authentication & Database Integration API (Task 4)',
    endpoints: {
      signup: 'POST /api/auth/signup',
      login: 'POST /api/auth/login',
      logout: 'POST /api/auth/logout',
      forgotPassword: 'POST /api/auth/forgot-password',
      resetPassword: 'POST /api/auth/reset-password',
      profileProtected: 'GET /api/auth/me',
      notesProtected: 'GET, POST, DELETE /api/notes'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/notes', protectedRoutes);

// 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

if (require.main === module) {
  initDb()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to initialize database:', err);
      process.exit(1);
    });
}

module.exports = app;
