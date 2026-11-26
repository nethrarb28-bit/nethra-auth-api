const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSignup(req, res, next) {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters long.');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password is required and must be at least 6 characters long.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  req.body.email = email.trim().toLowerCase();
  next();
}

function validateForgotPassword(req, res, next) {
  const { email } = req.body;
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: 'A valid email address is required.'
    });
  }
  req.body.email = email.trim().toLowerCase();
  next();
}

function validateResetPassword(req, res, next) {
  const { email, token, newPassword } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!token || typeof token !== 'string' || token.trim().length < 6) {
    errors.push('A valid reset token is required.');
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    errors.push('New password must be at least 6 characters long.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  req.body.email = email.trim().toLowerCase();
  req.body.token = token.trim();
  next();
}

module.exports = {
  validateSignup,
  validateLogin,
  validateForgotPassword,
  validateResetPassword
};
