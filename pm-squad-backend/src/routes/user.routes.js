const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  updateUserPermissions,
  deleteUser,
  getUserTasks,
  getWorkload,
} = require('../controllers/user.controller');
const { protect, isBoss } = require('../middleware/auth');

router.use(protect);

// Static route must be declared before the dynamic ":id" route below.
router.get('/workload', isBoss, getWorkload);

router.get('/', getAllUsers);
router.patch('/:id/permissions', isBoss, updateUserPermissions);
router.delete('/:id', isBoss, deleteUser);
router.get('/:id/tasks', isBoss, getUserTasks);

module.exports = router;
