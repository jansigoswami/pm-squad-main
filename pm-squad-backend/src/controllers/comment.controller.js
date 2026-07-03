const Comment = require('../models/Comment');
const Task = require('../models/Task');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

/**
 * @route   GET /api/tasks/:taskId/comments
 * @desc    List comments on a task (oldest first).
 * @access  Private
 */
const getComments = async (req, res) => {
  const comments = await Comment.find({ task: req.params.taskId })
    .populate('author', 'name initials color')
    .sort({ createdAt: 1 });

  res.status(200).json({ success: true, data: comments });
};

/**
 * @route   POST /api/tasks/:taskId/comments
 * @desc    Add a comment, resolve @mentions, notify mentioned users.
 * @access  Private
 */
const addComment = async (req, res) => {
  const { taskId } = req.params;
  const { text } = req.body;

  const task = await Task.findById(taskId);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  // Parse @Name mentions from the text. Matches @ followed by a name
  // (letters, digits, underscores, spaces) — greedy per word group.
  const mentionMatches = text.match(/@([A-Za-z][A-Za-z0-9_]*)/g) || [];
  const mentionNames = [
    ...new Set(mentionMatches.map((m) => m.slice(1).trim())),
  ];

  let mentionedUsers = [];
  if (mentionNames.length > 0) {
    // Case-insensitive match on the first word of each user's name.
    mentionedUsers = await User.find({
      $or: mentionNames.map((name) => ({
        name: { $regex: `^${escapeRegex(name)}`, $options: 'i' },
      })),
    }).select('_id name');
  }

  const mentionIds = mentionedUsers.map((u) => u._id);

  const comment = await Comment.create({
    task: taskId,
    author: req.user._id,
    text,
    mentions: mentionIds,
  });

  const io = req.app.get('io');

  // Notify each mentioned user in their private socket room.
  if (io) {
    mentionedUsers.forEach((user) => {
      io.to(user._id.toString()).emit('mention:received', {
        from: req.user.name,
        taskId,
        taskTitle: task.title,
        comment: text,
      });
    });
  }

  await ActivityLog.create({
    task: taskId,
    user: req.user._id,
    action: 'comment_added',
    message: `${req.user.name} commented on this task`,
  });

  const populated = await Comment.findById(comment._id).populate(
    'author',
    'name initials color'
  );

  // Broadcast the new comment so open task views update in real time.
  if (io) io.emit('comment:added', { taskId, comment: populated });

  res.status(201).json({ success: true, data: populated });
};

/**
 * @route   DELETE /api/tasks/:taskId/comments/:commentId
 * @desc    Delete a comment (author or boss only).
 * @access  Private
 */
const deleteComment = async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);

  if (!comment) {
    return res
      .status(404)
      .json({ success: false, message: 'Comment not found' });
  }

  const isAuthor = comment.author.toString() === req.user._id.toString();
  const isBoss = req.user.role === 'boss';

  if (!isAuthor && !isBoss) {
    return res.status(403).json({
      success: false,
      message: 'You cannot delete this comment',
    });
  }

  await comment.deleteOne();

  const io = req.app.get('io');
  if (io) {
    io.emit('comment:deleted', {
      taskId: req.params.taskId,
      commentId: req.params.commentId,
    });
  }

  res.status(200).json({ success: true });
};

// Escape user-supplied text before using it inside a RegExp.
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { getComments, addComment, deleteComment };
