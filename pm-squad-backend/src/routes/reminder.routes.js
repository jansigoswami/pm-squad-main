const express = require('express');
const router = express.Router();

const {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
} = require('../controllers/reminder.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getReminders);
router.post('/', createReminder);
router.patch('/:id', updateReminder);
router.delete('/:id', deleteReminder);

module.exports = router;
