const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  getUserTasks,
  getWorkload,
} = require('../controllers/user.controller');
const { protect, isBoss } = require('../middleware/auth');

router.use(protect);

// Static route must be declared before the dynamic ":id" route below.
router.get('/workload', isBoss, getWorkload);

router.get('/', getAllUsers);
router.get('/:id/tasks', isBoss, getUserTasks);

module.exports = router;
