const Task = require('../models/Task');
const Comment = require('../models/Comment');
const ActivityLog = require('../models/ActivityLog');

// Fields a task owner / boss is allowed to edit.
const EDITABLE_FIELDS = [
  'title',
  'notes',
  'type',
  'status',
  'priority',
  'due',
  'reminder',
  'labels',
  'subtasks',
];

// Human-readable labels for status values (used in activity messages).
const STATUS_LABELS = {
  todo: 'To Do',
  inprog: 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
};

/**
 * @route   GET /api/tasks
 * @desc    List all tasks visible to the current user (privacy-enforced).
 * @access  Private
 *
 * PRIVACY: personal tasks are only ever returned to their owner — not even
 * the boss can see another user's personal tasks.
 */
const getTasks = async (req, res) => {
  let query;

  if (req.user.role === 'boss') {
    query = {
      $or: [
        { type: 'work' },
        { type: 'personal', owner: req.user._id },
      ],
    };
  } else {
    query = {
      $or: [{ owner: req.user._id }, { type: 'work' }],
    };
  }

  const tasks = await Task.find(query)
    .populate('owner', 'name initials color role')
    .populate('lastEditedBy', 'name initials')
    .sort({ due: 1, createdAt: -1 });

  res
    .status(200)
    .json({ success: true, count: tasks.length, data: tasks });
};

/**
 * @route   POST /api/tasks
 * @desc    Create a task. Owner is always the authenticated user.
 * @access  Private
 */
const createTask = async (req, res) => {
  const payload = { ...req.body };

  // Never trust an owner supplied in the body — always the current user.
  payload.owner = req.user._id;
  if (payload.type === 'personal') {
    payload.owner = req.user._id;
  }
  delete payload.lastEditedBy;

  const saved = await Task.create(payload);

  await ActivityLog.create({
    task: saved._id,
    user: req.user._id,
    action: 'task_created',
    message: `${req.user.name} created this task`,
  });

  const populated = await Task.findById(saved._id)
    .populate('owner', 'name initials color role')
    .populate('lastEditedBy', 'name initials');

  const io = req.app.get('io');
  if (io) io.emit('task:created', populated);

  res.status(201).json({ success: true, data: populated });
};

/**
 * @route   GET /api/tasks/:id
 * @desc    Get a single task with comments.
 * @access  Private
 */
const getTask = async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('owner', 'name initials color role')
    .populate('lastEditedBy', 'name initials');

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  // PRIVACY: personal tasks are visible only to their owner (boss included is NOT allowed).
  if (
    task.type === 'personal' &&
    task.owner._id.toString() !== req.user._id.toString() &&
    req.user.role !== 'boss'
  ) {
    return res
      .status(403)
      .json({ success: false, message: 'Not authorized to view this task' });
  }

  // Extra guard: even a boss cannot see someone else's personal task.
  if (
    task.type === 'personal' &&
    task.owner._id.toString() !== req.user._id.toString()
  ) {
    return res
      .status(403)
      .json({ success: false, message: 'Not authorized to view this task' });
  }

  const comments = await Comment.find({ task: task._id })
    .populate('author', 'name initials color role')
    .sort({ createdAt: 1 });

  const data = task.toObject();
  data.comments = comments;

  res.status(200).json({ success: true, data });
};

/**
 * @route   PATCH /api/tasks/:id
 * @desc    Update a task. Non-owners may only change `status` of work tasks.
 * @access  Private
 */
const updateTask = async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  const isOwner = task.owner.toString() === req.user._id.toString();
  const isBoss = req.user.role === 'boss';

  // Non-owner, non-boss: only the `status` field may be touched.
  if (!isOwner && !isBoss) {
    const keys = Object.keys(req.body);
    const hasOtherFields = keys.some((key) => key !== 'status');
    if (hasOtherFields || keys.length === 0) {
      return res
        .status(403)
        .json({ success: false, message: 'You can only update task status' });
    }
  }

  // Build the update set from allowed fields only.
  const updates = {};
  for (const field of EDITABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      updates[field] = req.body[field];
    }
  }
  updates.lastEditedBy = req.user._id;

  // Track changes for the activity log (scalar fields only).
  const changes = [];
  const trackable = ['title', 'status', 'priority', 'due', 'type', 'reminder'];
  for (const field of trackable) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      const oldVal =
        task[field] === null || task[field] === undefined
          ? ''
          : String(task[field]);
      const newVal =
        updates[field] === null || updates[field] === undefined
          ? ''
          : String(updates[field]);
      if (oldVal !== newVal) {
        changes.push({ field, oldVal, newVal });
      }
    }
  }

  const updated = await Task.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  })
    .populate('owner', 'name initials color role')
    .populate('lastEditedBy', 'name initials');

  // Log the most meaningful change (status changes get a dedicated action).
  const statusChange = changes.find((c) => c.field === 'status');
  if (statusChange) {
    await ActivityLog.create({
      task: updated._id,
      user: req.user._id,
      action: 'status_changed',
      oldValue: STATUS_LABELS[statusChange.oldVal] || statusChange.oldVal,
      newValue: STATUS_LABELS[statusChange.newVal] || statusChange.newVal,
      message: `${req.user.name} changed status from ${
        STATUS_LABELS[statusChange.oldVal] || statusChange.oldVal
      } to ${STATUS_LABELS[statusChange.newVal] || statusChange.newVal}`,
    });
  } else if (changes.length > 0) {
    const fieldNames = changes.map((c) => c.field).join(', ');
    await ActivityLog.create({
      task: updated._id,
      user: req.user._id,
      action: 'task_updated',
      message: `${req.user.name} updated ${fieldNames}`,
    });
  }

  const io = req.app.get('io');
  if (io) io.emit('task:updated', updated);

  res.status(200).json({ success: true, data: updated });
};

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete a task (owner or boss only) and its related data.
 * @access  Private
 */
const deleteTask = async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  const isOwner = task.owner.toString() === req.user._id.toString();
  const isBoss = req.user.role === 'boss';

  if (!isOwner && !isBoss) {
    return res
      .status(403)
      .json({ success: false, message: 'You cannot delete this task' });
  }

  await task.deleteOne();
  await Comment.deleteMany({ task: req.params.id });
  await ActivityLog.deleteMany({ task: req.params.id });

  const io = req.app.get('io');
  if (io) io.emit('task:deleted', { taskId: req.params.id });

  res.status(200).json({ success: true, data: {} });
};

module.exports = {
  getTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
};
