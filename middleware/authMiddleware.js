const jwt = require('jsonwebtoken');
const { getOne } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'nethra_super_secret_jwt_key_change_in_production_2026';

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('token='));
    if (match) return decodeURIComponent(match.split('=')[1]);
  }
  return null;
}

function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.'
      });
    }

    const revoked = getOne('SELECT id FROM revoked_tokens WHERE token = ?', [token]);
    if (revoked) {
      return res.status(401).json({
        success: false,
        message: 'Session has been logged out. Please log in again.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = getOne('SELECT id, name, email, created_at FROM users WHERE id = ?', [decoded.id]);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found.'
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }
}

module.exports = {
  requireAuth,
  extractToken,
  JWT_SECRET
};
