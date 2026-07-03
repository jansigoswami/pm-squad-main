const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// Shape the user object returned to the client (never expose password).
const formatUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  color: user.color,
  initials: user.initials,
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new PM account (role is always forced to 'pm').
 * @access  Public
 */
const register = async (req, res) => {
  const { name, email, password } = req.body;

  const normalizedEmail = (email || '').toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res
      .status(400)
      .json({ success: false, message: 'Email already registered' });
  }

  // role is hard-coded to 'pm' — never trust a role from the request body.
  const user = await User.create({ name, email, password, role: 'pm' });

  const token = generateToken(user._id, user.role);

  res.status(201).json({ success: true, token, user: formatUser(user) });
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate a user and return a JWT.
 * @access  Public
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  const normalizedEmail = (email || '').toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select(
    '+password'
  );

  if (!user || !(await user.comparePassword(password || ''))) {
    return res
      .status(401)
      .json({ success: false, message: 'Invalid credentials' });
  }

  const token = generateToken(user._id, user.role);

  res.status(200).json({ success: true, token, user: formatUser(user) });
};

/**
 * @route   GET /api/auth/me
 * @desc    Get the currently authenticated user.
 * @access  Private
 */
const getMe = async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
};

module.exports = { register, login, getMe };
