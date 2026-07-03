const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes: require a valid Bearer token and attach the user to req.user.
 */
const protect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: 'Not authorized, user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: 'Not authorized, token failed' });
  }
};

/**
 * Restrict a route to Boss (admin) users only. Must run after `protect`.
 */
const isBoss = (req, res, next) => {
  if (req.user && req.user.role === 'boss') {
    return next();
  }

  return res
    .status(403)
    .json({ success: false, message: 'Boss access required' });
};

module.exports = { protect, isBoss };
