const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getOne, runQuery } = require('../db/database');
const {
  validateSignup,
  validateLogin,
  validateForgotPassword,
  validateResetPassword
} = require('../middleware/validate');
const { requireAuth, extractToken, JWT_SECRET } = require('../middleware/authMiddleware');

const router = express.Router();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

function issueSession(res, user) {
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.setHeader(
    'Set-Cookie',
    `token=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=7200; SameSite=Lax`
  );
  return token;
}

// POST /api/auth/signup
router.post('/signup', validateSignup, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = getOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = runQuery(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    );

    const user = getOne('SELECT id, name, email, created_at FROM users WHERE id = ?', [userId]);
    const token = issueSession(res, user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const userRecord = getOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!userRecord) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, userRecord.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      created_at: userRecord.created_at
    };
    const token = issueSession(res, user);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res, next) => {
  try {
    const token = extractToken(req);
    if (token) {
      runQuery('INSERT OR IGNORE INTO revoked_tokens (token) VALUES (?)', [token]);
    }
    res.setHeader('Set-Cookie', 'token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully. Session token invalidated.'
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', validateForgotPassword, (req, res, next) => {
  try {
    const { email } = req.body;
    const user = getOne('SELECT id, email FROM users WHERE email = ?', [email]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user account found with that email address.'
      });
    }

    const resetToken = crypto.randomBytes(16).toString('hex');
    const resetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

    runQuery(
      'UPDATE users SET reset_token = ?, reset_expires = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [resetToken, resetExpires, user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Password reset token generated (valid for 15 minutes).',
      resetToken,
      expiresInMinutes: 15
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', validateResetPassword, async (req, res, next) => {
  try {
    const { email, token, newPassword } = req.body;
    const user = getOne('SELECT * FROM users WHERE email = ?', [email]);

    if (!user || !user.reset_token || user.reset_token !== token) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password reset token or email.'
      });
    }

    if (!user.reset_expires || Date.now() > Number(user.reset_expires)) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token has expired. Please request a new one.'
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    runQuery(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newHash, user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me (Protected Route)
router.get('/me', requireAuth, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
});

module.exports = router;
