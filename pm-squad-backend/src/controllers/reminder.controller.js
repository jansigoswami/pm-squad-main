const Reminder = require('../models/Reminder');

// Fields a user is allowed to update on a reminder.
const EDITABLE_FIELDS = [
  'title',
  'forAll',
  'time',
  'repeat',
  'channel',
  'isActive',
];

/**
 * @route   GET /api/reminders
 * @desc    List the user's own reminders plus any "for all" reminders.
 * @access  Private
 */
const getReminders = async (req, res) => {
  const reminders = await Reminder.find({
    $or: [{ owner: req.user._id }, { forAll: true }],
  }).sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: reminders });
};

/**
 * @route   POST /api/reminders
 * @desc    Create a reminder owned by the current user.
 * @access  Private
 */
const createReminder = async (req, res) => {
  const payload = { ...req.body, owner: req.user._id };

  const reminder = await Reminder.create(payload);

  res.status(201).json({ success: true, data: reminder });
};

/**
 * @route   PATCH /api/reminders/:id
 * @desc    Update a reminder (owner only).
 * @access  Private
 */
const updateReminder = async (req, res) => {
  const reminder = await Reminder.findById(req.params.id);

  if (!reminder) {
    return res
      .status(404)
      .json({ success: false, message: 'Reminder not found' });
  }

  if (reminder.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You cannot update this reminder',
    });
  }

  for (const field of EDITABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      reminder[field] = req.body[field];
    }
  }

  await reminder.save();

  res.status(200).json({ success: true, data: reminder });
};

/**
 * @route   DELETE /api/reminders/:id
 * @desc    Delete a reminder (owner only).
 * @access  Private
 */
const deleteReminder = async (req, res) => {
  const reminder = await Reminder.findById(req.params.id);

  if (!reminder) {
    return res
      .status(404)
      .json({ success: false, message: 'Reminder not found' });
  }

  if (reminder.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You cannot delete this reminder',
    });
  }

  await reminder.deleteOne();

  res.status(200).json({ success: true });
};

module.exports = {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
};
