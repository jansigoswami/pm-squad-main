const User = require('../models/User');
const Task = require('../models/Task');

/**
 * @route   GET /api/users
 * @desc    List all active users (safe public-facing fields only).
 * @access  Private
 */
const getAllUsers = async (req, res) => {
  const users = await User.find({ isActive: true }).select(
    'name initials color role'
  );

  res.status(200).json({ success: true, data: users });
};

/**
 * @route   GET /api/users/:id/tasks
 * @desc    All tasks owned by a given user.
 * @access  Boss only
 */
const getUserTasks = async (req, res) => {
  const tasks = await Task.find({ owner: req.params.id })
    .populate('owner', 'name initials color role')
    .sort({ due: 1, createdAt: -1 });

  res.status(200).json({ success: true, data: tasks });
};

/**
 * @route   GET /api/users/workload
 * @desc    Per-user work-task counts (total / open / done / blocked).
 * @access  Boss only
 */
const getWorkload = async (req, res) => {
  const users = await User.find({ isActive: true }).select(
    'name initials color'
  );

  // Aggregate work-task counts grouped by owner + status in one query.
  const counts = await Task.aggregate([
    { $match: { type: 'work' } },
    { $group: { _id: { owner: '$owner', status: '$status' }, count: { $sum: 1 } } },
  ]);

  // Index counts by owner id for quick lookup.
  const byOwner = {};
  counts.forEach((row) => {
    const ownerId = row._id.owner ? row._id.owner.toString() : 'none';
    if (!byOwner[ownerId]) {
      byOwner[ownerId] = { total: 0, open: 0, done: 0, blocked: 0 };
    }
    byOwner[ownerId].total += row.count;
    if (row._id.status === 'todo' || row._id.status === 'inprog') {
      byOwner[ownerId].open += row.count;
    } else if (row._id.status === 'done') {
      byOwner[ownerId].done += row.count;
    } else if (row._id.status === 'blocked') {
      byOwner[ownerId].blocked += row.count;
    }
  });

  const workload = users.map((user) => {
    const stats = byOwner[user._id.toString()] || {
      total: 0,
      open: 0,
      done: 0,
      blocked: 0,
    };
    return {
      user: {
        _id: user._id,
        name: user.name,
        initials: user.initials,
        color: user.color,
      },
      total: stats.total,
      open: stats.open,
      done: stats.done,
      blocked: stats.blocked,
    };
  });

  res.status(200).json({ success: true, data: workload });
};

module.exports = { getAllUsers, getUserTasks, getWorkload };
