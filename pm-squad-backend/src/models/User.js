const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['boss', 'pm'],
      default: 'pm',
    },
    color: {
      type: String,
      default: '#6366F1',
    },
    initials: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Hash password (rounds 12) and auto-generate initials before saving.
// Async middleware resolves the promise — no `next` needed (Mongoose 9).
userSchema.pre('save', async function () {
  // Auto-generate initials from first letter of each word in name, uppercase.
  if (this.isModified('name') && this.name) {
    this.initials = this.name
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase())
      .join('');
  }

  // Only hash the password if it has been modified (or is new).
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});

// Compare a candidate password against the stored hash.
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
