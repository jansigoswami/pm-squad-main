const Task = require('../models/Task');
const User = require('../models/User');

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * @route   GET /api/analytics/summary
 * @desc    Headline stats across all work tasks.
 * @access  Boss only
 */
const getSummary = async (req, res) => {
  const [totalTasks, doneCount, blockedCount, totalUsers] = await Promise.all([
    Task.countDocuments({ type: 'work' }),
    Task.countDocuments({ type: 'work', status: 'done' }),
    Task.countDocuments({ type: 'work', status: 'blocked' }),
    User.countDocuments({ isActive: true }),
  ]);

  const completionRate =
    totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  res.status(200).json({
    success: true,
    data: { totalTasks, completionRate, blockedCount, totalUsers },
  });
};

/**
 * @route   GET /api/analytics/by-user
 * @desc    Per-user work-task breakdown with completion rate.
 * @access  Boss only
 */
const getByUser = async (req, res) => {
  const users = await User.find({ isActive: true }).select(
    'name initials color'
  );

  const counts = await Task.aggregate([
    { $match: { type: 'work' } },
    { $group: { _id: { owner: '$owner', status: '$status' }, count: { $sum: 1 } } },
  ]);

  const byOwner = {};
  counts.forEach((row) => {
    const ownerId = row._id.owner ? row._id.owner.toString() : 'none';
    if (!byOwner[ownerId]) {
      byOwner[ownerId] = { open: 0, done: 0, blocked: 0, total: 0 };
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

  const data = users.map((user) => {
    const stats = byOwner[user._id.toString()] || {
      open: 0,
      done: 0,
      blocked: 0,
      total: 0,
    };
    const completionRate =
      stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
    return {
      _id: user._id.toString(),
      name: user.name,
      initials: user.initials,
      color: user.color,
      open: stats.open,
      done: stats.done,
      blocked: stats.blocked,
      total: stats.total,
      completionRate,
    };
  });

  res.status(200).json({ success: true, data });
};

/**
 * @route   GET /api/analytics/trend
 * @desc    Done-task counts for each of the last 7 weeks.
 * @access  Boss only
 */
const getTrend = async (req, res) => {
  const now = new Date();
  const oldestStart = new Date(now.getTime() - 7 * MS_PER_WEEK);

  // Fetch done tasks created within the trailing 7-week window once.
  const tasks = await Task.find({
    type: 'work',
    status: 'done',
    createdAt: { $gte: oldestStart },
  }).select('createdAt');

  // Build 7 buckets, oldest → newest, labelled "Week 1" … "Week 7".
  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const end = new Date(now.getTime() - i * MS_PER_WEEK);
    const start = new Date(end.getTime() - MS_PER_WEEK);
    const count = tasks.filter((t) => {
      const created = new Date(t.createdAt).getTime();
      return created >= start.getTime() && created < end.getTime();
    }).length;
    trend.push({ week: `Week ${7 - i}`, count });
  }

  res.status(200).json({ success: true, data: trend });
};

module.exports = { getSummary, getByUser, getTrend };
