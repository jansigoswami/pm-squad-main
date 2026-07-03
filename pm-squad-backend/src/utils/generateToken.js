const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT for a user.
 * @param {string} userId - The user's MongoDB ObjectId.
 * @param {string} role - The user's role ('boss' | 'pm').
 * @returns {string} Signed JWT token.
 */
const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

module.exports = generateToken;
