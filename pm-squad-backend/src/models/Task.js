const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    done: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['work', 'personal'],
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['todo', 'inprog', 'blocked', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal',
    },
    due: {
      type: Date,
      default: null,
    },
    reminder: {
      type: String,
      enum: ['', 'at', '1h', '1d', '2d', '1w'],
      default: '',
    },
    labels: [String],
    subtasks: [subtaskSchema],
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Speeds up the common owner + type + status filtered queries (Team Board, My Tasks).
taskSchema.index({ owner: 1, type: 1, status: 1 });
// Speeds up due-date based queries (Today View, Calendar, reminder jobs).
taskSchema.index({ due: 1 });

module.exports = mongoose.model('Task', taskSchema);
