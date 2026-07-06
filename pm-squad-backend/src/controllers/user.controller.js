const User = require('../models/User');
const Task = require('../models/Task');

/**
 * @route   GET /api/users
 * @desc    List all active users (safe public-facing fields only).
 * @access  Private
 */
const getAllUsers = async (req, res) => {
  const users = await User.find({ isActive: true }).select(
    'name initials color role permissions'
  );

  res.status(200).json({ success: true, data: users });
};

/**
 * @route   PATCH /api/users/:id/permissions
 * @desc    Update user permissions (Admin only).
 * @access  Boss only
 */
const updateUserPermissions = async (req, res) => {
  if (req.user.role !== 'boss') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const { canAssignTasks, canCreateSharedTasks, canViewAnalytics } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (user.role === 'boss') {
    return res.status(400).json({ success: false, message: 'Cannot modify admin permissions' });
  }

  user.permissions = {
    canAssignTasks: canAssignTasks ?? user.permissions.canAssignTasks,
    canCreateSharedTasks: canCreateSharedTasks ?? user.permissions.canCreateSharedTasks,
    canViewAnalytics: canViewAnalytics ?? user.permissions.canViewAnalytics,
  };

  await user.save();

  res.status(200).json({ success: true, data: user });
};

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a team member and reassign their tasks (Admin only).
 * @access  Boss only
 */
const deleteUser = async (req, res) => {
  if (req.user.role !== 'boss') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const { reassignTo } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (user.role === 'boss') {
    return res.status(400).json({ success: false, message: 'Cannot delete admin' });
  }

  // Reassign tasks if a target user is provided
  if (reassignTo) {
    await Task.updateMany(
      { owner: req.params.id },
      { owner: reassignTo, lastEditedBy: req.user._id }
    );
  } else {
    // Archive tasks by setting owner to null or marking as inactive
    await Task.updateMany(
      { owner: req.params.id },
      { owner: null, lastEditedBy: req.user._id }
    );
  }

  // Soft delete user (set isActive to false)
  user.isActive = false;
  await user.save();

  res.status(200).json({ success: true, message: 'User deleted successfully' });
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

module.exports = { getAllUsers, updateUserPermissions, deleteUser, getUserTasks, getWorkload };
