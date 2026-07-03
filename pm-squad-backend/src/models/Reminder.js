const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    forAll: {
      type: Boolean,
      default: false,
    },
    // Time of day in 24-hour HH:MM format (e.g. "09:30").
    time: {
      type: String,
      required: true,
    },
    repeat: {
      type: String,
      enum: ['daily', 'weekdays', 'weekly', 'biweekly', 'monthly', 'once'],
      required: true,
    },
    channel: {
      type: String,
      enum: ['app', 'email', 'slack'],
      default: 'app',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastFired: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reminder', reminderSchema);
